
import { Normalizer } from '../interfaces/normalizer';
import { SteamRawData } from '../types/raw-data';
import { MediaInfo } from '../types/schema';
import { AppConfig } from '../types/config';
import * as cheerio from 'cheerio';
import { html2bbcode } from '../utils/legacy-utils.js'; // Need to create/move this

export class SteamNormalizer implements Normalizer {
    normalize(rawData: SteamRawData, config: AppConfig): MediaInfo {
        const data = rawData;
        const mainHtml = data.main_html || '';
        const $ = cheerio.load(mainHtml);
        const steamCn = data.steamcn_data || {};

        // Name
        const nameAnchor = $("div.apphub_AppName");
        const name = nameAnchor.length ? nameAnchor.text().trim() : ($("span[itemprop='name']").text().trim() || '');

        let chineseName = '';
        if (steamCn.name_cn) chineseName = steamCn.name_cn;

        // Cover
        const coverAnchor = $("img.game_header_image_full[src]");
        const poster = coverAnchor.length ? coverAnchor.attr("src")?.replace(/^(.+?)(\?t=\d+)?$/, "$1") || '' : '';

        // Detail Block
        const detailAnchor = $("div.details_block");
        const detailsText = detailAnchor.length ? detailAnchor.eq(0).text() : '';
        // Parse details logic reused or simplified
        const detailLines = detailsText.replace(/:[ \t\n]+/g, ": ").split("\n").map(x => x.trim()).filter(x => x.length > 0);
        let releaseDate = '';
        let dev = '';
        let pub = '';

        detailLines.forEach(line => {
            if (line.startsWith("发行日期:")) releaseDate = line.replace("发行日期:", "").trim();
            else if (line.startsWith("开发者:")) dev = line.replace("开发者:", "").trim();
            else if (line.startsWith("发行商:")) pub = line.replace("发行商:", "").trim();
        });

        // Tags
        const tags = $("a.app_tag").map((_, el) => $(el).text().trim()).get();

        // Start creating MediaInfo
        const info: MediaInfo = {
            site: 'steam',
            id: data.sid,
            title: chineseName || name,
            original_title: name,
            chinese_title: chineseName,
            foreign_title: name,
            aka: [],
            trans_title: chineseName ? [chineseName] : [],
            this_title: [name],

            year: releaseDate ? releaseDate.match(/\d{4}/)?.[0] || '' : '',
            playdate: [releaseDate],
            region: [],
            genre: tags,
            language: [],
            duration: '',
            episodes: '',
            seasons: '',

            poster: poster,

            director: dev ? [dev] : [], // Map Developer to Director field for generic schema?
            writer: pub ? [pub] : [],   // Map Publisher to Writer field?
            cast: [],

            introduction: '',
            awards: '',
            tags: tags,

            extra: {
                steam_id: data.sid,
                linkbar: '',
                languages_raw: [], // Will populate
                sysreq: [], // Will populate
                screenshots: [], // Will populate
                descr_bbcode: '' // To hold cleaned description
            }
        };

        // Languages
        /* Legacy logic */
        const languageAnchor = $("table.game_language_options tr[class!=unsupported]");
        const lagCheckColList = ["界面", "完全音频", "字幕"];
        const languages = languageAnchor.slice(1).map((_, el) => {
            const tag = $(el);
            const tds = tag.find("td");
            const lang = tds.eq(0).text().trim();
            const support: string[] = [];
            for (let i = 0; i < lagCheckColList.length; i++) {
                if (tds.eq(i + 1).text().includes("✔")) support.push(lagCheckColList[i]);
            }
            return `${lang}${support.length > 0 ? ` (${support.join(", ")})` : ""}`;
        }).get();
        info.extra.languages_raw = languages;

        // Description Cleaning (Requires html2bbcode logic)
        const descrAnchor = $("div#game_area_description");
        if (descrAnchor.length) {
            // We need html2bbcode util. 
            // Assuming we have formatting logic.
            // For now, I will extract text or raw html? 
            // Legacy uses html2bbcode.
            // I'll skip cleaning implementation here and do it in utils or just store raw.
            // Ideally `Normalizer` should normalize text.
            let html = descrAnchor.html() || '';
            let bbcode = html2bbcode(html);
            // ... legacy regex cleaning ...
            bbcode = bbcode
                .replace(/\[h2\]关于这款游戏\[\/h2\]/ig, "")
                .replace(/\[h2\]关于此游戏\[\/h2\]/ig, "")
                .replace(/\[h2\]\s*\[\/h2\]/ig, "")
                .replace(/\[h2\]([\s\S]*?)\[\/h2\]/ig, "$1")
                .replace(/\[img\][\s\S]*?\[\/img\]/ig, "")
                .replace(/\[\/?(ul|ol|list)\]/ig, "")
                .replace(/\[li\]/ig, "[*]")
                .replace(/\[\/li\]/ig, "");

            info.introduction = bbcode.split("\n").map((x: string) => x.trim()).filter((x: string) => x.length > 0).join("\n").trim();
        }

        // Screenshots
        function normalizeScreenshotUrl(url: string) {
            if (!url) return "";
            url = url.replace(/&amp;/g, "&").replace(/\?t=\d+$/, "");
            const m = url.match(/^https?:\/\/[^\/]+(\/store_item_assets\/steam\/apps\/.+)$/);
            if (m) return "https://shared.akamai.steamstatic.com" + m[1];
            return url;
        }

        let screenshots: string[] = [];
        const screenshotPropsDiv = $("div.gamehighlight_desktopcarousel[data-props]");
        if (screenshotPropsDiv.length) {
            try {
                const propsRaw = screenshotPropsDiv.attr("data-props") || "";
                const props = JSON.parse(propsRaw.replace(/&quot;/g, '"'));
                if (props && Array.isArray(props.screenshots)) {
                    screenshots = props.screenshots.map((s: any) => normalizeScreenshotUrl(s.full || s.standard || s.thumbnail));
                }
            } catch { }
        }
        if (screenshots.length === 0) {
            $("div.screenshot_holder a").each((_, el) => {
                const href = $(el).attr("href") || "";
                const cleaned = href.replace(/^.+?url=(http.+?)\.[\dx]+(.+?)(\?t=\d+)?$/, "$1$2");
                screenshots.push(normalizeScreenshotUrl(cleaned));
            });
        }
        info.extra.screenshots = screenshots;

        // SysReq
        const osDict: { [key: string]: string } = { "win": "Windows", "mac": "Mac OS X", "linux": "SteamOS + Linux" };
        const sysreq = $("div.sysreq_contents > div.game_area_sys_req").map((_, el) => {
            const tag = $(el);
            const os = osDict[tag.attr("data-os") || ""] || tag.attr("data-os");
            const clone = tag.clone();
            clone.html(tag.html()?.replace(/<br>/ig, "[br]") || "");
            const content = clone.text()
                .split("\n").map(x => x.trim()).filter(x => x.length > 0).join("\n\n")
                .split("[br]").map(x => x.trim()).filter(x => x.length > 0).join("\n");
            return `${os}\n${content}`;
        }).get();
        info.extra.sysreq = sysreq;

        return info;
    }
}
