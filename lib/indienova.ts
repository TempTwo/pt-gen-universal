/**
 * Indienova Compatibility Layer
 */
import { AppConfig } from './types/config';
import { Orchestrator } from './orchestrator';

function getOrchestrator(config: AppConfig) {
    return new Orchestrator(config);
}

export async function gen_indienova(sid: string, config: AppConfig = {}) {
    const orchestrator = getOrchestrator(config);

    try {
        const info = await orchestrator.getMediaInfo('indienova', sid);
        const extra = info.extra || {};

        let descr = "";
        if (info.poster) descr += `[img]${info.poster}[/img]\n\n`;

        descr += "【基本信息】\n\n";
        if (info.chinese_title) descr += `中文名称：${info.chinese_title}\n`;
        if (info.foreign_title) descr += `英文名称：${info.foreign_title}\n`;
        if (info.aka && info.aka.length) descr += `其他名称：${info.aka[0]}\n`;
        if (info.playdate && info.playdate.length) descr += `发行时间：${info.playdate[0]}\n`;
        if (extra.rate) descr += `评分：${extra.rate}\n`;
        if (info.director && info.director.length) descr += `开发商：${info.director.join(" / ")}\n`;
        if (info.writer && info.writer.length) descr += `发行商：${info.writer.join(" / ")}\n`;
        if (extra.intro_detail && extra.intro_detail.length) descr += `${extra.intro_detail.join("\n")}\n`;
        if (info.tags && info.tags.length) descr += `标签：${info.tags.slice(0, 8).join(" | ")}\n`;

        if (extra.links && Object.keys(extra.links).length > 0) {
            const formatLinks = Object.entries(extra.links).map(([key, value]) => `[url=${value}]${key}[/url]`);
            descr += `链接地址：${formatLinks.join("  ")}\n`;
        }

        if (extra.price && extra.price.length) descr += `价格信息：${extra.price.join(" / ")}\n`;

        descr += "\n";

        if (info.introduction) descr += `【游戏简介】\n\n${info.introduction}\n\n`;

        if (extra.screenshots && extra.screenshots.length) {
            descr += `【游戏截图】\n\n${extra.screenshots.map((x: string) => `[img]${x}[/img]`).join("\n")}\n\n`;
        }

        if (extra.level && extra.level.length) {
            descr += `【游戏评级】\n\n${extra.level.map((x: string) => `[img]${x}[/img]`).join("\n")}\n\n`;
        }

        return {
            sid: sid,
            success: true,
            ...info,
            format: descr.trim()
        };
    } catch (e: any) {
        return {
            site: 'indienova',
            sid: sid,
            success: false,
            error: e.message || String(e)
        };
    }
}
