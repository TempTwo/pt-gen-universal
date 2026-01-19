
import { Scraper } from '../interfaces/scraper';
import { AppConfig } from '../types/config';
import { IndienovaRawData } from '../types/raw-data';
import { SearchResult } from '../types/schema';
import { fetchWithTimeout } from '../utils/fetch';
import { NONE_EXIST_ERROR } from '../utils/error';

export class IndienovaScraper implements Scraper {
    async fetch(id: string, config: AppConfig): Promise<IndienovaRawData> {
        const url = `https://indienova.com/game/${id}`;

        const headers: any = {};
        if (config.indienovaCookie) {
            headers['Cookie'] = config.indienovaCookie;
        }

        const response = await fetchWithTimeout(url, { headers }, config.doubanTimeoutMs || 10000);

        const html = await response.text();
        if (html.includes('出现错误')) {
            throw new Error(NONE_EXIST_ERROR);
        }

        return {
            site: 'indienova',
            success: true,
            sid: id,
            html: html
        };
    }

    async search(query: string, config: AppConfig): Promise<SearchResult[]> {
        // Legacy didn't implement search
        return [];
    }
}
