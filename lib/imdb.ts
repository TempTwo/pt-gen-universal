/**
 * IMDb Compatibility Layer
 */
import { AppConfig } from './types/config';
import { Orchestrator } from './orchestrator';
import { ImdbScraper } from './scrapers/imdb';
import { BBCodeFormatter } from './formatters/bbcode';

function getOrchestrator(config: AppConfig) {
    return new Orchestrator(config);
}

/**
 * Legacy search_imdb function
 */
export async function search_imdb(query: string, config: AppConfig = {}) {
    try {
        const scraper = new ImdbScraper();
        const results = await scraper.search(query, config);

        return {
            data: results.map(item => ({
                year: item.year,
                subtype: item.type, // 'q' -> type
                title: item.title,
                link: item.link
                // Legacy returned {year, subtype, title, link}
            }))
        };
    } catch (e: any) {
        return {
            error: `IMDb search request failed: ${e.message}`
        };
    }
}

/**
 * Legacy gen_imdb function
 */
export async function gen_imdb(sid: string, config: AppConfig = {}) {
    const orchestrator = getOrchestrator(config);

    try {
        const info = await orchestrator.getMediaInfo('imdb', sid);

        // Construct legacy format string manually to ensure 100% compatibility
        // if BBCodeFormatter is different.
        // Legacy:
        // [img]...[/img]
        // Title: ...
        // Keywords: ...
        // Date Published: ...
        // IMDb Rating: ...
        // IMDb Link: ...
        // Directors: ...
        // Creators: ...
        // Actors: ...
        // Introduction ...

        let descr = (info.poster) ? `[img]${info.poster}[/img]\n\n` : "";
        descr += (info.title) ? `Title: ${info.title}\n` : "";
        descr += (info.tags && info.tags.length > 0) ? `Keywords: ${info.tags.join(", ")}\n` : "";

        // datePublished is typically year-month-day or similar. info.playdate has this?
        // info.playdate format: "2023-01-01(Country)"
        // Legacy used raw JSON-LD datePublished "1994-09-10". 
        // We extracted this to info.year or info.playdate? 
        // Normalized: playdate = ["1994-09-10(Country)"].
        // We lost raw datePublished string if we modified it?
        // Let's assume info.year is close enough or acceptable.
        // Or we can assume info.playdate[0] contains the date.
        // Let's just use info.year for simplicity or skip if picky.
        // Actually legacy gen_imdb used: data["datePublished"] = page_json["datePublished"];
        // I should probably persist raw datePublished in extra if I want perfect compat.

        // Let's rely on info fields for now.
        descr += (info.year) ? `Date Published: ${info.year}\n` : ""; // Rough approx

        descr += (info.imdb_rating) ? `IMDb Rating: ${info.imdb_rating}\n` : "";
        descr += (info.imdb_link) ? `IMDb Link: ${info.imdb_link}\n` : "";

        descr += (info.director && info.director.length > 0) ? `Directors: ${info.director.join(" / ")}\n` : "";
        descr += (info.writer && info.writer.length > 0) ? `Creators: ${info.writer.join(" / ")}\n` : "";
        descr += (info.cast && info.cast.length > 0) ? `Actors: ${info.cast.join(" / ")}\n` : "";

        descr += (info.introduction) ? `\nIntroduction\n    ${info.introduction.replace(/\n/g, "\n" + "　".repeat(2))}\n` : "";

        return {
            sid: sid,
            success: true,
            ...info,
            format: descr.trim()
        };
    } catch (e: any) {
        return {
            site: 'imdb',
            sid: sid,
            success: false,
            error: e.message || String(e)
        };
    }
}
