import { AppConfig } from './types/config';
import { Scraper } from './interfaces/scraper';
import { Normalizer } from './interfaces/normalizer';
import { Formatter } from './interfaces/formatter';
import { MediaInfo, SearchResult } from './types/schema';

export class Orchestrator {
    private scrapers: Map<string, Scraper> = new Map();
    private normalizers: Map<string, Normalizer> = new Map();
    private formatters: Map<string, Formatter> = new Map();

    constructor(private config: AppConfig) { }

    registerScraper(name: string, scraper: Scraper) {
        this.scrapers.set(name, scraper);
    }

    registerNormalizer(name: string, normalizer: Normalizer) {
        this.normalizers.set(name, normalizer);
    }

    registerFormatter(name: string, formatter: Formatter) {
        this.formatters.set(name, formatter);
    }

    async fetchInfo(
        sourceName: string,
        id: string,
        formatterName: string = 'bbcode'
    ): Promise<string> {
        const scraper = this.scrapers.get(sourceName);
        if (!scraper) {
            throw new Error(`Scraper not found: ${sourceName}`);
        }

        const normalizer = this.normalizers.get(sourceName);
        if (!normalizer) {
            throw new Error(`Normalizer not found: ${sourceName}`);
        }

        const formatter = this.formatters.get(formatterName);
        if (!formatter) {
            throw new Error(`Formatter not found: ${formatterName}`);
        }

        const rawData = await scraper.fetch(id, this.config);
        if (!rawData.success) {
            throw new Error(rawData.error || 'Unknown error during fetch');
        }

        const mediaInfo = normalizer.normalize(rawData, this.config);
        return formatter.format(mediaInfo);
    }

    async getMediaInfo(sourceName: string, id: string): Promise<MediaInfo> {
        const scraper = this.scrapers.get(sourceName);
        if (!scraper) {
            throw new Error(`Scraper not found: ${sourceName}`);
        }

        const normalizer = this.normalizers.get(sourceName);
        if (!normalizer) {
            throw new Error(`Normalizer not found: ${sourceName}`);
        }

        const rawData = await scraper.fetch(id, this.config);
        if (!rawData.success) {
            throw new Error(rawData.error || 'Unknown error during fetch');
        }

        return normalizer.normalize(rawData, this.config);
    }
}
