/**
 * Bangumi Compatibility Layer
 */
import { AppConfig } from './types/config';
import { Orchestrator } from './orchestrator';
import { BangumiScraper } from './scrapers/bangumi';

function getOrchestrator(config: AppConfig) {
    return new Orchestrator(config);
}

/**
 * Legacy search_bangumi function
 */
export async function search_bangumi(query: string, config: AppConfig = {}) {
    try {
        const scraper = new BangumiScraper();
        const results = await scraper.search(query, config);

        return {
            data: results.map(item => ({
                year: item.year,
                subtype: item.type,
                title: item.title,
                subtitle: item.subtitle,
                link: item.link
            }))
        };
    } catch (e: any) {
        return {
            error: `Bangumi search failed: ${e.message}`
        };
    }
}

/**
 * Legacy gen_bangumi function
 */
export async function gen_bangumi(sid: string, config: AppConfig = {}) {
    const orchestrator = getOrchestrator(config);

    try {
        const info = await orchestrator.getMediaInfo('bangumi', sid);
        const extra = info.extra || {};
        const infoMap = extra.infoMap || {};
        const staff = extra.staff || [];

        // Reconstruct legacy output format
        let descr = (info.poster) ? `[img]${info.poster}[/img]\n\n` : "";

        if (info.trans_title && info.trans_title.length > 0) {
            descr += `◎译　　名　${info.trans_title.join(' / ')}\n`;
        }

        // info.this_title has main title
        descr += `◎片　　名　${info.this_title[0] || info.title}\n`;
        descr += `◎年　　代　${info.year}\n`;
        descr += (info.tags && info.tags.length > 0) ? `◎类　　别　${info.tags.join(" / ")}\n` : "";
        descr += infoMap["放送开始"] ? `◎上映日期　${infoMap["放送开始"]}\n` : "";

        const bgmRating = info.extra?.bangumi_rating_average // Normalizer doesn't put rating in root? 
        // Normalizer puts in 'bangumi_rating' string, 'bangumi_rating_average' number.
        // Legacy had separate check. 
        // Let's use info.bangumi_rating if available.
        descr += (info.bangumi_rating) ? `◎Bangumi评分　${info.bangumi_rating}\n` : "";
        descr += (info.bangumi_link) ? `◎Bangumi链接　${info.bangumi_link}\n` : "";
        descr += infoMap["话数"] ? `◎话　　数　${infoMap["话数"]}\n` : "";

        // Staff similar to legacy
        if (info.director && info.director.length > 0) {
            descr += `◎导　　演　${info.director.join(" / ")}\n`;
        }
        if (info.writer && info.writer.length > 0) {
            descr += `◎编　　剧　${info.writer.join(" / ")}\n`;
        }

        if (info.cast && info.cast.length > 0) {
            descr += `◎主　　演　${info.cast.slice(0, 9).join("\n" + "　".repeat(4) + "  　").trim()}\n`;
        }

        // Other staff
        const s = staff.filter((s: string) =>
            !s.includes("监督") && !s.includes("导演") &&
            !s.includes("脚本") && !s.includes("系列构成")
        ).slice(0, 15);

        if (s.length > 0) {
            descr += `\n◎制作人员\n\n　　${s.join("\n　　")}\n`;
        }

        if (info.introduction && info.introduction.length > 0) {
            descr += `\n◎简　　介\n\n　　${info.introduction.replace(/\n/g, "\n" + "　".repeat(2))}\n\n`;
        }

        if (extra.alt) {
            descr += `(来源于 ${extra.alt} )\n`;
        }

        return {
            sid: sid,
            success: true,
            ...info,
            format: descr.trim()
        };
    } catch (e: any) {
        return {
            site: 'bangumi',
            sid: sid,
            success: false,
            error: e.message || String(e)
        };
    }
}
