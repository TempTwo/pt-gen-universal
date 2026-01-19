import { Formatter } from '../interfaces/formatter';
import { MediaInfo } from '../types/schema';
import { normalizeMaybeArray, normalizePeople } from '../utils/string';
import { ensureArray } from '../utils/array';

export class MarkdownFormatter implements Formatter {
    format(data: MediaInfo): string {
        const poster = String(data?.poster || '');
        const trans_title = normalizeMaybeArray(data?.trans_title).trim();
        const this_title = normalizeMaybeArray(data?.this_title).trim();
        const year = String(data?.year || '').trim();
        const region = Array.isArray(data?.region) ? data.region.join(' / ') : String(data?.region || '');
        const genre = ensureArray(data?.genre).filter(Boolean);
        const language = Array.isArray(data?.language) ? data.language.join(' / ') : String(data?.language || '');
        const playdate = ensureArray(data?.playdate).filter(Boolean);
        const imdb_rating = String(data?.imdb_rating || '');
        const imdb_link = String(data?.imdb_link || '');
        const douban_rating = String(data?.douban_rating || '');
        const douban_link = String(data?.douban_link || '');
        const tmdb_rating = String(data?.tmdb_rating || '');
        const tmdb_link = String(data?.tmdb_link || '');
        const episodes = String(data?.episodes || '');
        const seasons = String(data?.seasons || '');
        const duration = String(data?.duration || '');
        const director = normalizePeople(data?.director);
        const writer = normalizePeople(data?.writer);
        const cast = normalizePeople(data?.cast);
        const tags = ensureArray(data?.tags).filter(Boolean);
        const introduction = String(data?.introduction || '');
        const awards = String(data?.awards || '');

        let descr = poster ? `![海报](${poster})\n\n` : '';
        descr += `## 基本信息\n\n`;
        descr += trans_title ? `- **译名**: ${trans_title}\n` : '';
        descr += this_title ? `- **片名**: ${this_title}\n` : '';
        descr += year ? `- **年代**: ${year}\n` : '';
        descr += region ? `- **产地**: ${region}\n` : '';
        descr += genre.length > 0 ? `- **类别**: ${genre.join(' / ')}\n` : '';
        descr += language ? `- **语言**: ${language}\n` : '';
        descr += playdate.length > 0 ? `- **上映日期**: ${playdate.join(' / ')}\n` : '';
        descr += seasons ? `- **季数**: ${seasons}\n` : '';
        descr += episodes ? `- **集数**: ${episodes}\n` : '';
        descr += duration ? `- **片长**: ${duration}\n` : '';

        if (imdb_rating || douban_rating || tmdb_rating) {
            descr += `\n## 评分\n\n`;
            descr += imdb_rating ? `- **IMDb**: ${imdb_rating}` : '';
            descr += imdb_link ? ` ([链接](${imdb_link}))` : '';
            descr += imdb_rating ? `\n` : '';
            descr += douban_rating ? `- **豆瓣**: ${douban_rating}` : '';
            descr += douban_link ? ` ([链接](${douban_link}))` : '';
            descr += douban_rating ? `\n` : '';
            descr += tmdb_rating ? `- **TMDB**: ${tmdb_rating}` : '';
            descr += tmdb_link ? ` ([链接](${tmdb_link}))` : '';
            descr += tmdb_rating ? `\n` : '';
        }

        if (director.length > 0 || writer.length > 0 || cast.length > 0) {
            descr += `\n## 制作人员\n\n`;
            descr += director.length > 0 ? `- **导演**: ${director.join(' / ')}\n` : '';
            descr += writer.length > 0 ? `- **编剧**: ${writer.join(' / ')}\n` : '';
            descr += cast.length > 0 ? `- **主演**: ${cast.join(' / ')}\n` : '';
        }

        descr += tags.length > 0 ? `\n## 标签\n\n${tags.join(' | ')}\n` : '';
        descr += introduction ? `\n## 简介\n\n${introduction}\n` : '';
        descr += awards ? `\n## 获奖情况\n\n${awards}\n` : '';

        return descr.trim();
    }
}
