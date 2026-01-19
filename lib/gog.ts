/**
 * GOG Compatibility Layer
 */
import { AppConfig } from './types/config';
import { Orchestrator } from './orchestrator';
import { GogScraper } from './scrapers/gog'; // maybe needed
import { GAME_INSTALL_TEMPLATE } from './utils/legacy-utils';

function getOrchestrator(config: AppConfig) {
    return new Orchestrator(config);
}

/**
 * Legacy gen_gog function
 */
export async function gen_gog(sid: string, config: AppConfig = {}) {
    const orchestrator = getOrchestrator(config);

    try {
        const info = await orchestrator.getMediaInfo('gog', sid);
        const extra = info.extra || {};

        let descr = "";
        if (info.poster) descr += `[img]${info.poster}[/img]\n\n`;

        descr += "【基本信息】\n\n";
        if (info.title) descr += `名称: ${info.title}\n`;
        if (extra.platforms && extra.platforms.length > 0) descr += `平台: ${extra.platforms.join("、")}\n`;
        if (extra.gog_id) {
            // Use slug if available for nicer URL?
            const slugOrId = extra.slug || extra.gog_id;
            descr += `GOG页面: https://www.gog.com/game/${slugOrId}\n`;
        }
        if (extra.languages && extra.languages.length > 0) descr += `游戏语种: ${extra.languages.join("、")}\n`;

        descr += "\n【游戏简介】\n\n";
        if (info.introduction) descr += `${info.introduction}\n\n`;

        // System Reqs
        if (extra.system_requirements && Object.keys(extra.system_requirements).length > 0) {
            descr += "【系统需求】\n\n";
            for (let [osName, osData] of Object.entries(extra.system_requirements) as [string, any][]) {
                let osDisplayName = osName === "windows" ? "Windows" :
                    osName === "osx" ? "Mac OS X" :
                        osName === "linux" ? "Linux" : osName;

                descr += `${osDisplayName}`;
                if (osData.versions) descr += ` (${osData.versions})`;
                descr += ":\n\n";

                const reqs = osData.requirements || {};
                // Minimum
                if (reqs.minimum) {
                    descr += "最低配置:\n";
                    for (let [reqId, reqDesc] of Object.entries(reqs.minimum) as [string, any][]) {
                        let reqName = reqId.charAt(0).toUpperCase() + reqId.slice(1);
                        descr += `  ${reqName}: ${reqDesc}\n`;
                    }
                    descr += "\n";
                }
                // Recommended
                if (reqs.recommended) {
                    descr += "推荐配置:\n";
                    for (let [reqId, reqDesc] of Object.entries(reqs.recommended) as [string, any][]) {
                        let reqName = reqId.charAt(0).toUpperCase() + reqId.slice(1);
                        descr += `  ${reqName}: ${reqDesc}\n`;
                    }
                    descr += "\n";
                }
            }
        }

        descr += GAME_INSTALL_TEMPLATE + "\n\n";

        if (extra.screenshots && extra.screenshots.length > 0) {
            descr += "【游戏截图】\n\n";
            descr += extra.screenshots.map((s: string) => `[img]${s}[/img]`).join("\n") + "\n\n";
        }

        return {
            sid: sid,
            success: true,
            ...info,
            format: descr.trim()
        };
    } catch (e: any) {
        return {
            site: 'gog',
            sid: sid,
            success: false,
            error: e.message || String(e)
        };
    }
}
