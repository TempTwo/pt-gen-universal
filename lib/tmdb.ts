/**
 * TMDB Compatibility Layer
 */
import { AppConfig } from './types/config';
import { Orchestrator } from './orchestrator';
import { TmdbScraper } from './scrapers/tmdb';
import { TmdbNormalizer } from './normalizers/tmdb';
import { BBCodeFormatter } from './formatters/bbcode';
import { JsonFormatter } from './formatters/json';
import { MarkdownFormatter } from './formatters/markdown';

function getOrchestrator(config: AppConfig) {
    const orchestrator = new Orchestrator(config);
    // Re-register here if needed, or rely on Orchestrator's default constructor
    // The Orchestrator constructor now registers them by default.
    return orchestrator;
}

/**
 * Legacy search_tmdb function
 */
export async function search_tmdb(query: string, config: AppConfig = {}) {
    try {
        const scraper = new TmdbScraper();
        const results = await scraper.search(query, config);

        // Transform to legacy format
        return {
            data: results.map(item => ({
                year: item.year,
                subtype: item.extra?.media_type === 'movie' ? '电影' : '剧集',
                title: item.title,
                subtitle: item.subtitle,
                link: item.link,
                id: item.id.replace('movie-', '').replace('tv-', ''), // Legacy might expect raw ID? 
                // Legacy search output: id: item.id. 
                // Legacy item.id comes from TMDB result ID (number).
                // My SearchResult ID is 'movie-123'. 
                // Wait, legacy search_tmdb logic:
                // id: item.id,
                // media_type: item.media_type
                // So legacy returned raw number ID.
                // But let's check legacy app usage. 
                // In app.js:
                // const sid = site === 'tmdb' ? `${match[1]}-${match[2]}` : match[1]
                // But search results are used by frontend?
                // Let's strip the prefix if it exists to match raw ID if that's what legacy did.
                // Legacy: `id: item.id`.
                media_type: item.extra?.media_type
            }))
        };
    } catch (e: any) {
        console.error("TMDB搜索错误:", e);
        return {
            error: `搜索过程中出现错误: ${e.message}`
        };
    }
}

/**
 * Legacy gen_tmdb function
 */
export async function gen_tmdb(sid: string, config: AppConfig = {}) {
    const orchestrator = getOrchestrator(config);

    try {
        const info = await orchestrator.getMediaInfo('tmdb', sid);
        const bbcodeFormatter = new BBCodeFormatter();
        const bbcode = bbcodeFormatter.format(info);

        // Legacy TMDB output had many fields. 
        // We map relevant ones.

        return {
            sid: sid,
            success: true,
            ...info,
            // Mapping back some specific fields if they differ
            original_title: info.this_title[0],
            format: bbcode,
        };
    } catch (e: any) {
        return {
            site: 'tmdb',
            sid: sid,
            success: false,
            error: e.message || String(e)
        };
    }
}
