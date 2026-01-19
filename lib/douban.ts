/**
 * Douban Compatibility Layer
 * Adapts the new Orchestrator-based implementation to the legacy function signatures.
 */
import { AppConfig } from './types/config';
import { Orchestrator } from './orchestrator';
import { DoubanScraper } from './scrapers/douban';
import { DoubanNormalizer } from './normalizers/douban';
import { BBCodeFormatter } from './formatters/bbcode';
import { JsonFormatter } from './formatters/json';

// Initialize core components
// Note: In a real app, these might be singletons or injected.
// For compatibility, we create them on demand or lazily.

function getOrchestrator(config: AppConfig) {
    const orchestrator = new Orchestrator(config);
    orchestrator.registerScraper('douban', new DoubanScraper());
    orchestrator.registerNormalizer('douban', new DoubanNormalizer());
    orchestrator.registerFormatter('bbcode', new BBCodeFormatter());
    orchestrator.registerFormatter('json', new JsonFormatter());
    return orchestrator;
}

/**
 * Legacy search_douban function
 */
export async function search_douban(query: string, config: AppConfig = {}) {
    const orchestrator = getOrchestrator(config);
    // The Orchestrator doesn't expose search directly in a generic way yet (it has fetchInfo).
    // But Scraper interface has search. 
    // We can access scraper directly or add search to Orchestrator.
    // For now, let's instantiate scraper directly for search, or add search to Orchestrator.
    // Let's use the Scraper directly for search as Orchestrator is more for "Get Info" flow.
    const scraper = new DoubanScraper();
    const results = await scraper.search(query, config);

    // Transform to legacy format
    return {
        data: results.map(item => ({
            year: item.year,
            subtype: item.type,
            title: item.title,
            subtitle: item.subtitle,
            link: item.link,
            id: item.id,
            img: item.poster
        }))
    };
}

/**
 * Legacy gen_douban function
 */
export async function gen_douban(sid: string, config: AppConfig = {}) {
    const orchestrator = getOrchestrator(config);

    try {
        // The legacy gen_douban returns an object with `format` field containing the BBCode.
        // And also raw fields.
        // Our Orchestrator.getMediaInfo returns the normalized object (MediaInfo).
        // The Formatter produces the string.

        // 1. Get Normalized Info
        const info = await orchestrator.getMediaInfo('douban', sid);

        // 2. Format it
        const bbcodeFormatter = new BBCodeFormatter();
        const bbcode = bbcodeFormatter.format(info);

        // 3. Construct legacy response
        // Legacy response has many fields. 
        // We should map MediaInfo back to legacy fields if needed for other consumers,
        // roughly matching what parseDoubanSubjectHtml returned.

        return {
            sid: sid,
            success: true,
            ...info, // MediaInfo keys are mostly compatible or cleaner versions of legacy keys
            format: bbcode,
            douban_link: info.douban_link || `https://movie.douban.com/subject/${sid}/`,
        };
    } catch (e: any) {
        return {
            site: 'douban',
            sid: sid,
            success: false,
            error: e.message || String(e)
        };
    }
}
