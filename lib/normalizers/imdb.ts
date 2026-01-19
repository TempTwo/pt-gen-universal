
import { Normalizer } from '../interfaces/normalizer';
import { ImdbRawData } from '../types/raw-data';
import { MediaInfo } from '../types/schema';
import { AppConfig } from '../types/config';

export class ImdbNormalizer implements Normalizer {
    normalize(rawData: ImdbRawData, config: AppConfig): MediaInfo {
        const data = rawData;
        const jsonLd = data.json_ld || {};

        const info: MediaInfo = {
            site: 'imdb',
            id: data.imdb_id,

            // Titles
            title: jsonLd.name || '',
            original_title: jsonLd.name || '', // Assuming name is original or primary
            chinese_title: '',
            foreign_title: jsonLd.name || '',
            aka: (data.aka || []).map(a => a.title),
            trans_title: [], // To be populated
            this_title: [jsonLd.name || ''],

            // Basics
            year: data.json_ld?.datePublished ? data.json_ld.datePublished.substring(0, 4) : '',
            playdate: (data.release_date || []).map(r => `${r.date}(${r.country})`),
            region: [], // To be extracted from details or other fields? Legacy didn't explicitly extract region?
            // Legacy didn't seem to extract "region" explicitly in `gen_imdb`? 
            // It extracted `datePublished` (year).
            genre: Array.isArray(jsonLd.genre) ? jsonLd.genre : (jsonLd.genre ? [jsonLd.genre] : []),
            language: [], // Legacy didn't extract language explicitly?
            duration: jsonLd.duration || '', // PT2H22M format? 
            // Legacy just copies `duration`. JSON-LD duration is ISO 8601 (PT2H). 
            // Legacy logic: `data[copy_item] = page_json[copy_item]`. So it copied ISO format?
            // Wait, standard `MediaInfo` duration is typically "142 minutes". 
            // If legacy returned raw ISO, maybe formatters handled it? 
            // `BBCodeFormatter` just puts it in.

            episodes: '',
            seasons: '',

            poster: jsonLd.image || '',

            // People
            director: [],
            writer: [],
            cast: [],

            introduction: jsonLd.description || '',
            awards: '',
            tags: data.json_ld?.keywords ? data.json_ld.keywords.split(',') : [],

            // Ratings
            imdb_id: data.imdb_id,
            imdb_link: `https://www.imdb.com/title/${data.imdb_id}/`,
            imdb_rating_average: jsonLd.aggregateRating?.ratingValue || 0,
            imdb_votes: jsonLd.aggregateRating?.ratingCount || 0,
            imdb_rating: `${jsonLd.aggregateRating?.ratingValue || 0}/10 from ${jsonLd.aggregateRating?.ratingCount || 0} users`,

            // Extra
            extra: {
                details: data.details,
                reviews: data.next_data?.props?.urqlState?.reviews, // complex path
                // ... map other legacy fields if needed
            }
        };

        // Standardize People
        const mapPeople = (item: any) => {
            if (!item) return [];
            const arr = Array.isArray(item) ? item : [item];
            return arr.filter((p: any) => p['@type'] === 'Person').map((p: any) => p.name);
        };

        info.director = mapPeople(jsonLd.director);
        info.writer = mapPeople(jsonLd.creator); // Legacy mapped 'creator' to 'creators'
        info.cast = mapPeople(jsonLd.actor);

        // Titles logic
        // Legacy didn't do much title logic for IMDb, just "Title: {name}".
        // We can just populate trans_title with akas.
        info.trans_title = info.aka;

        // Handle Duration format?
        // If it is PT... format, maybe we should parse it?
        // But for now, let's keep it raw to match legacy behavior unless we want to improve.
        // Legacy: `data["duration"] = page_json["duration"];`

        return info;
    }
}
