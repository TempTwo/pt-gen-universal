import { AppConfig } from './types/config';
import { Scraper } from './interfaces/scraper';
import { Normalizer } from './interfaces/normalizer';
import { Formatter } from './interfaces/formatter';
import { MediaInfo, SearchResult } from './types/schema';
import { DoubanScraper } from './scrapers/douban';
import { ImdbScraper } from './scrapers/imdb';
import { BangumiScraper } from './scrapers/bangumi';
import { SteamScraper } from './scrapers/steam';
import { GogScraper } from './scrapers/gog';
import { IndienovaScraper } from './scrapers/indienova';
import { TmdbScraper } from './scrapers/tmdb';
import { DoubanNormalizer } from './normalizers/douban';
import { ImdbNormalizer } from './normalizers/imdb';
import { BangumiNormalizer } from './normalizers/bangumi';
import { SteamNormalizer } from './normalizers/steam';
import { GogNormalizer } from './normalizers/gog';
import { IndienovaNormalizer } from './normalizers/indienova';
import { TmdbNormalizer } from './normalizers/tmdb';
import { BBCodeFormatter } from './formatters/bbcode';
import { JsonFormatter } from './formatters/json';
import { MarkdownFormatter } from './formatters/markdown';
import { AppError, ErrorCode } from './errors';
import { toAppError } from './utils/app-error';

export class Orchestrator {
    private scrapers: Map<string, Scraper> = new Map();
    private normalizers: Map<string, Normalizer> = new Map();
    private formatters: Map<string, Formatter> = new Map();

    constructor(private config: AppConfig) {
        // Register default components
        this.registerScraper('douban', new DoubanScraper());
        this.registerScraper('tmdb', new TmdbScraper());
        this.registerScraper('imdb', new ImdbScraper());
        this.registerScraper('bangumi', new BangumiScraper());
        this.registerScraper('steam', new SteamScraper());
        this.registerScraper('gog', new GogScraper());
        this.registerScraper('indienova', new IndienovaScraper());

        this.registerNormalizer('douban', new DoubanNormalizer());
        this.registerNormalizer('tmdb', new TmdbNormalizer());
        this.registerNormalizer('imdb', new ImdbNormalizer());
        this.registerNormalizer('bangumi', new BangumiNormalizer());
        this.registerNormalizer('steam', new SteamNormalizer());
        this.registerNormalizer('gog', new GogNormalizer());
        this.registerNormalizer('indienova', new IndienovaNormalizer());

        this.registerFormatter('bbcode', new BBCodeFormatter());
        this.registerFormatter('json', new JsonFormatter());
        this.registerFormatter('markdown', new MarkdownFormatter());
    }

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
        try {
            const scraper = this.scrapers.get(sourceName);
            if (!scraper) {
                throw new AppError(ErrorCode.INVALID_PARAM, `Scraper not found: ${sourceName}`);
            }

            const normalizer = this.normalizers.get(sourceName);
            if (!normalizer) {
                throw new AppError(ErrorCode.INVALID_PARAM, `Normalizer not found: ${sourceName}`);
            }

            const formatter = this.formatters.get(formatterName);
            if (!formatter) {
                throw new AppError(ErrorCode.INVALID_PARAM, `Formatter not found: ${formatterName}`);
            }

            const rawData = await scraper.fetch(id, this.config);
            if (!rawData.success) {
                throw toAppError(new Error(rawData.error || 'Unknown error during fetch'));
            }

            const mediaInfo = normalizer.normalize(rawData, this.config);
            return formatter.format(mediaInfo);
        } catch (e) {
            throw toAppError(e);
        }
    }

    async getMediaInfo(sourceName: string, id: string): Promise<MediaInfo> {
        try {
            const scraper = this.scrapers.get(sourceName);
            if (!scraper) {
                throw new AppError(ErrorCode.INVALID_PARAM, `Scraper not found: ${sourceName}`);
            }

            const normalizer = this.normalizers.get(sourceName);
            if (!normalizer) {
                throw new AppError(ErrorCode.INVALID_PARAM, `Normalizer not found: ${sourceName}`);
            }

            const rawData = await scraper.fetch(id, this.config);
            if (!rawData.success) {
                throw toAppError(new Error(rawData.error || 'Unknown error during fetch'));
            }

            return normalizer.normalize(rawData, this.config);
        } catch (e) {
            throw toAppError(e);
        }
    }

    async search(sourceName: string, query: string): Promise<SearchResult[]> {
        try {
            const scraper = this.scrapers.get(sourceName);
            if (!scraper) {
                throw new AppError(ErrorCode.INVALID_PARAM, `Scraper not found: ${sourceName}`);
            }
            return await scraper.search(query, this.config);
        } catch (e) {
            throw toAppError(e);
        }
    }
}
