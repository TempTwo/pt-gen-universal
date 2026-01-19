
import { Normalizer } from '../interfaces/normalizer';
import { GogRawData } from '../types/raw-data';
import { MediaInfo } from '../types/schema';
import { AppConfig } from '../types/config';
import { html2bbcode } from '../utils/legacy-utils';
import { GAME_INSTALL_TEMPLATE } from '../utils/legacy-utils';

export class GogNormalizer implements Normalizer {
    normalize(rawData: GogRawData, config: AppConfig): MediaInfo {
        const data = rawData;
        const apiJson = data.api_data || {};
        const html = data.store_page_html || '';

        const info: MediaInfo = {
            site: 'gog',
            id: data.sid,
            title: apiJson.title || '',
            original_title: apiJson.title || '',
            chinese_title: '',
            foreign_title: '',
            aka: [],
            trans_title: [],
            this_title: [apiJson.title || ''],
            year: '',
            playdate: [],
            region: [],
            genre: [],
            language: [],
            duration: '',
            episodes: '',
            seasons: '',
            poster: '',
            director: [],
            writer: [],
            cast: [],
            introduction: '',
            awards: '',
            tags: [],
            extra: {
                gog_id: data.gog_id,
                slug: apiJson.slug,
                platforms: [],
                languages: [],
                system_requirements: {},
                screenshots: []
            }
        };

        // Parse HTML (System Reqs, Screenshots, Poster)
        if (html) {
            let cardMatch = html.match(/cardProduct:\s*(\{[\s\S]*?\})\s*(?:,\s*\w+:|$)/);
            if (!cardMatch) {
                cardMatch = html.match(/cardProduct:\s*(\{[\s\S]*?\n\s*\})/);
            }

            if (cardMatch) {
                try {
                    const cardProduct = JSON.parse(cardMatch[1]);

                    // Poster
                    if (cardProduct.boxArtImage) {
                        info.poster = cardProduct.boxArtImage;
                    }

                    // Screenshots
                    if (cardProduct.screenshots && cardProduct.screenshots.length > 0) {
                        info.extra.screenshots = cardProduct.screenshots.map((s: any) => {
                            let url = s.imageUrl || s;
                            if (!url.startsWith('http')) url = `https:${url}`;
                            if (!url.includes('_ggvgl')) url = `${url}_ggvgl_2x.jpg`;
                            return url;
                        });
                    } else {
                        // API fallback
                        // API expanded screenshots? legacy checked api but mostly relied on cardProduct?
                        // API screenshots structure?
                        // Legacy: data["screenshot"] = [] initially.
                    }

                    // System Reqs
                    const supportedOs = cardProduct.supportedOperatingSystems || [];
                    for (const osInfo of supportedOs) {
                        const osName = osInfo.operatingSystem?.name;
                        const osVer = osInfo.operatingSystem?.versions;
                        const sysReqs = osInfo.systemRequirements || [];

                        if (!osName || sysReqs.length === 0) continue;

                        info.extra.system_requirements[osName] = {
                            versions: osVer,
                            requirements: {}
                        };

                        for (const reqGroup of sysReqs) {
                            const reqType = reqGroup.type;
                            const reqs = reqGroup.requirements || [];
                            if (!reqType || reqs.length === 0) continue;

                            info.extra.system_requirements[osName].requirements[reqType] = {};
                            reqs.forEach((r: any) => {
                                if (r.id && r.description) {
                                    info.extra.system_requirements[osName].requirements[reqType][r.id] = r.description;
                                }
                            });
                        }
                    }

                } catch (e) {
                    console.error('Failed to parse cardProduct json', e);
                }
            }
        }

        // Platforms
        const platforms = apiJson.content_system_compatibility || {};
        if (platforms.windows) info.extra.platforms.push("Windows");
        if (platforms.osx) info.extra.platforms.push("Mac OS X");
        if (platforms.linux) info.extra.platforms.push("Linux");

        // Languages
        const langs = apiJson.languages || {};
        info.extra.languages = Object.values(langs);

        // Description
        const descHtml = apiJson.description?.full || apiJson.description?.lead || "";
        if (descHtml) {
            let descrBbcode = html2bbcode(descHtml);
            descrBbcode = descrBbcode
                .replace(/\[img\][\s\S]*?\[\/img\]/ig, "")
                .replace(/\[h2\][\s\S]*?\[\/h2\]/ig, "")
                .replace(/\[hr\]/ig, "");

            info.introduction = descrBbcode.split("\n").map((x: string) => x.trim()).filter((x: string) => x.length > 0).join("\n").trim();
        }

        // Release Date?
        // Legacy didn't extract.

        return info;
    }
}
