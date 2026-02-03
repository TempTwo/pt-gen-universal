/**
 * 原始数据类型定义
 * 用于描述从各站点爬取到的、尚未规范化的原始数据结构。
 */

export interface BaseRawData {
  site: string;
  success: boolean;
  error?: string;
  proxy_used?: boolean;
}

export interface DoubanRawData extends BaseRawData {
  site: 'douban';
  sid: string;
  html?: string; // 原始 HTML
  json?: any; // JSON-LD 数据
  mobile_html?: string; // 移动端 HTML
  // 其他爬虫特定字段
  [key: string]: any;
}

export interface TmdbRawData extends BaseRawData {
  site: 'tmdb';
  tmdb_id: string;
  details?: any; // API 响应
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string; // for TV
  original_title?: string;
  original_name?: string; // for TV
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  release_date?: string;
  first_air_date?: string; // for TV
  last_air_date?: string; // for TV
  status?: string;
  tagline?: string;
  vote_average?: number;
  vote_count?: number;
  genres?: { id: number; name: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  spoken_languages?: { iso_639_1: string; name: string }[];
  runtime?: number;
  episode_run_time?: number[]; // for TV
  number_of_episodes?: number; // for TV
  number_of_seasons?: number; // for TV

  // Appended responses
  credits?: {
    cast: any[];
    crew: any[];
  };
  external_ids?: {
    imdb_id?: string;
    // ...
  };
  images?: {
    backdrops: any[];
    posters: any[];
    logos: any[];
  };
  keywords?: {
    keywords?: { id: number; name: string }[];
    results?: { id: number; name: string }[]; // for TV
  };
  alternative_titles?: {
    titles?: { iso_3166_1: string; iso_639_1?: string; title: string; type: string }[];
    results?: { iso_3166_1: string; iso_639_1?: string; title: string; type: string }[]; // for TV
  };
  videos?: {
    results: any[];
  };
  release_dates?: any;
  content_ratings?: any;
  created_by?: any[]; // for TV
  // 其他 API 响应数据
  [key: string]: any;
}

export interface ImdbRawData extends BaseRawData {
  site: 'imdb';
  imdb_id: string;
  json_ld?: any;
  next_data?: any;
  details?: { [key: string]: string[] };
  release_date?: { country: string; date: string }[];
  aka?: { country: string; title: string }[];
  main_html?: string; // Optional: raw html if needed
  [key: string]: any;
}

export interface BangumiRawData extends BaseRawData {
  site: 'bangumi';
  sid: string;
  main_html?: string;
  characters_html?: string;
  [key: string]: any;
}

export interface SteamRawData extends BaseRawData {
  site: 'steam';
  sid: string;
  main_html?: string;
  steamcn_data?: any;
  [key: string]: any;
}

export interface GogRawData extends BaseRawData {
  site: 'gog';
  sid: string;
  gog_id: string;
  api_data?: any;
  store_page_html?: string;
  [key: string]: any;
}

export interface IndienovaRawData extends BaseRawData {
  site: 'indienova';
  sid: string;
  html?: string;
  [key: string]: any;
}

// 联合类型，未来可以扩展更多站点
export type RawData =
  | DoubanRawData
  | TmdbRawData
  | ImdbRawData
  | BangumiRawData
  | SteamRawData
  | GogRawData
  | IndienovaRawData
  | (BaseRawData & { [key: string]: any });
