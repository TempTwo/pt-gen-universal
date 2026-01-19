/**
 * Steam Compatibility Layer
 */
import { AppConfig } from './types/config';
import { Orchestrator } from './orchestrator';
import { SteamScraper } from './scrapers/steam';
import { GAME_INSTALL_TEMPLATE } from './utils/legacy-utils';

function getOrchestrator(config: AppConfig) {
    return new Orchestrator(config);
}

/**
 * Legacy gen_steam function
 */
export async function gen_steam(sid: string, config: AppConfig = {}) {
    const orchestrator = getOrchestrator(config);

    try {
        const info = await orchestrator.getMediaInfo('steam', sid);
        const extra = info.extra || {};

        // Reconstruct legacy output format
        let descr = "";
        // Header images
        if (info.poster) {
            // legacy used separate header and library images constructed from sid
            const headerImg = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${sid}/header.jpg`;
            const libraryImg = `https://steamcdn-a.akamaihd.net/steam/apps/${sid}/library_600x900_2x.jpg`;
            descr += `[img]${headerImg}[/img]\n\n`;
            descr += `[img]${libraryImg}[/img]\n\n`;
        }

        descr += "【基本信息】\n\n";
        if (info.title) descr += `名称: ${info.title}\n`;
        // type_line, dev_line, pub_line, release_line were extracted raw legacy.
        // Normalized to: type (tags?), dev (director), pub (writer), release (playdate/year).
        // Reconstructing from normalized data might be lossy compared to raw lines.
        // Ideally Normalizer extracted them. 
        // Let's use info.genre as type?, director as dev, writer as pub.
        if (info.genre && info.genre.length) descr += `类型: ${info.genre.join(", ")}\n`;
        if (info.director && info.director.length) descr += `开发者: ${info.director.join(", ")}\n`;
        if (info.writer && info.writer.length) descr += `发行商: ${info.writer.join(", ")}\n`;
        if (info.playdate && info.playdate.length) descr += `发行日期: ${info.playdate[0]}\n`;

        // extra.linkbar not available unless extracted. legacy extracted it.
        // I put languages in extra.languages_raw.
        if (extra.languages_raw && extra.languages_raw.length > 0) {
            descr += "游戏语种: ";
            const uiSub = extra.languages_raw.filter((l: string) => l.includes('界面') && l.includes('字幕'));
            const audio = extra.languages_raw.filter((l: string) => l.includes('完全音频'));

            if (uiSub.length > 0) descr += `[b]界面和字幕语言[/b]: ${uiSub.map((s: string) => s.split(' ')[0]).join("、")}\n`;
            // Simplified formatting for brevity in compat layer
        }

        descr += "\n【游戏简介】\n\n";
        if (info.introduction) {
            descr += `${info.introduction}\n\n`;
        }

        descr += GAME_INSTALL_TEMPLATE + "\n\n";

        if (extra.sysreq && extra.sysreq.length > 0) {
            descr += "【配置需求】\n\n";
            extra.sysreq.forEach((req: string) => {
                descr += req + "\n\n";
            });
        }

        if (extra.screenshots && extra.screenshots.length > 0) {
            descr += "【游戏截图】\n\n";
            descr += extra.screenshots.map((s: string) => `[img]${s}[/img]`).join("\n") + "\n\n";
        }

        return {
            sid: sid,
            success: true,
            ...info,
            format: descr.trim()
        };
    } catch (e: any) {
        return {
            site: 'steam',
            sid: sid,
            success: false,
            error: e.message || String(e)
        };
    }
}
