import { AppConfig } from './types/config';
import { MediaInfo, SearchResult } from './types/schema';
import { AppError, ErrorCode } from './errors';
import { toAppError } from './utils/app-error';
import { SitePlugin } from './types/plugin';

export class Orchestrator {
    private plugins: Map<string, SitePlugin> = new Map();
    private pluginOrder: string[] = [];

    constructor(private config: AppConfig, plugins: SitePlugin[] = []) {
        this.registerPlugins(plugins);
    }

    registerPlugins(plugins: SitePlugin[]) {
        for (const plugin of plugins) this.registerPlugin(plugin);
    }

    registerPlugin(plugin: SitePlugin) {
        this.plugins.set(plugin.site, plugin);
        // Preserve registry order for stable matching when priorities tie.
        if (!this.pluginOrder.includes(plugin.site)) this.pluginOrder.push(plugin.site);
    }

    private pluginsForMatching(): SitePlugin[] {
        const withOrder = this.pluginOrder
            .map((site, idx) => ({
                idx,
                plugin: this.plugins.get(site),
            }))
            .filter((x): x is { idx: number; plugin: SitePlugin } => Boolean(x.plugin));

        // Higher priority first; ties keep registry order.
        withOrder.sort((a, b) => {
            const ap = a.plugin.priority ?? 0;
            const bp = b.plugin.priority ?? 0;
            if (ap !== bp) return bp - ap;
            return a.idx - b.idx;
        });

        return withOrder.map((x) => x.plugin);
    }

    matchUrl(url: string): { site: string; sid: string } {
        for (const plugin of this.pluginsForMatching()) {
            for (const pattern of plugin.urlPatterns) {
                // Use exec() so capture groups work even if someone accidentally adds /g.
                // Reset lastIndex to avoid stateful regex surprises.
                pattern.lastIndex = 0;
                const match = pattern.exec(url);
                if (!match) continue;
                const sid = plugin.parseSid ? plugin.parseSid(match) : match[1];
                // If the match doesn't yield a usable sid, keep trying other patterns/plugins.
                if (!sid) continue;
                return { site: plugin.site, sid };
            }
        }
        throw new AppError(ErrorCode.INVALID_PARAM, 'Unsupported URL');
    }

    async getMediaInfoByUrl(url: string): Promise<MediaInfo> {
        const { site, sid } = this.matchUrl(url);
        return this.getMediaInfo(site, sid);
    }

    async getMediaInfo(sourceName: string, id: string): Promise<MediaInfo> {
        try {
            const plugin = this.plugins.get(sourceName);
            if (!plugin) {
                // Keep legacy error message for compatibility.
                throw new AppError(ErrorCode.INVALID_PARAM, `Scraper not found: ${sourceName}`);
            }

            const rawData = await plugin.scraper.fetch(id, this.config);
            if (!rawData.success) {
                throw toAppError(new Error(rawData.error || 'Unknown error during fetch'));
            }

            return plugin.normalizer.normalize(rawData, this.config);
        } catch (e) {
            throw toAppError(e);
        }
    }

    async search(sourceName: string, query: string): Promise<SearchResult[]> {
        try {
            const plugin = this.plugins.get(sourceName);
            if (!plugin) {
                throw new AppError(ErrorCode.INVALID_PARAM, `Scraper not found: ${sourceName}`);
            }
            if (plugin.supportsSearch === false) {
                throw new AppError(
                    ErrorCode.FEATURE_DISABLED,
                    `search not supported for site: ${sourceName}`
                );
            }
            return await plugin.scraper.search(query, this.config);
        } catch (e) {
            throw toAppError(e);
        }
    }
}
