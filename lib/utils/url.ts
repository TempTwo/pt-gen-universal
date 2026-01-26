import { AppError, ErrorCode } from '../errors';

// Shared URL matching rules for both API v1 and v2.
const SUPPORT_LIST: Record<string, RegExp> = {
    douban: /(?:https?:\/\/)?(?:(?:movie|www|m)\.)?douban\.com\/(?:(?:movie\/)?subject|movie)\/(\d+)\/?/,
    imdb: /(?:https?:\/\/)?(?:www\.)?imdb\.com\/title\/(tt\d+)\/?/,
    bangumi: /(?:https?:\/\/)?(?:bgm\.tv|bangumi\.tv|chii\.in)\/subject\/(\d+)\/?/,
    steam: /(?:https?:\/\/)?(?:store\.)?steam(?:powered|community)\.com\/app\/(\d+)\/?/,
    // Keep the slug bounded to avoid swallowing extra path/query fragments.
    indienova: /(?:https?:\/\/)?indienova\.com\/(?:game|g)\/([^/?#]+)(?:[/?#]|$)/,
    gog: /(?:https?:\/\/)?(?:www\.)?gog\.com\/(?:[a-z]{2}(?:-[A-Z]{2})?\/)?game\/([\w-]+)/,
    tmdb: /(?:https?:\/\/)?(?:www\.)?themoviedb\.org\/(?:(movie|tv))\/(\d+)\/?/,
};

export function matchUrl(url: string): { site: string; sid: string } {
    for (const [site, pattern] of Object.entries(SUPPORT_LIST)) {
        const match = url.match(pattern);
        if (match) {
            const sid = site === 'tmdb' ? `${match[1]}-${match[2]}` : match[1];
            return { site, sid };
        }
    }
    throw new AppError(ErrorCode.INVALID_PARAM, 'Unsupported URL');
}
