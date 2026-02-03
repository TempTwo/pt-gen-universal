import { createApp } from '../app';
import { MemoryStorage } from '../storage/memory';
import { readFileSync } from 'node:fs';
import { parseBooleanEnv, parseNumberEnv } from '../utils/env';

/**
 * Bun 运行时入口
 */

// 创建内存存储适配器
const storage = new MemoryStorage({
  maxEntries: parseNumberEnv(process.env.CACHE_MAX_ENTRIES),
  sweepIntervalMs: parseNumberEnv(process.env.CACHE_SWEEP_INTERVAL_MS),
});

function loadHtmlPage(): string | undefined {
  try {
    return readFileSync(new URL('../../index.html', import.meta.url), 'utf-8');
  } catch {
    return undefined;
  }
}

// 创建 Hono 应用
const app = createApp(storage, {
  apikey: process.env.APIKEY,
  disableSearch: parseBooleanEnv(process.env.DISABLE_SEARCH) ?? false,
  enableDebug: parseBooleanEnv(process.env.ENABLE_DEBUG) ?? false,
  cacheTTL: parseNumberEnv(process.env.CACHE_TTL),
  htmlPage: loadHtmlPage(),
  proxyUrl: process.env.PROXY_URL,
  proxyAllowSensitiveHeaders: parseBooleanEnv(process.env.PROXY_ALLOW_SENSITIVE_HEADERS) ?? false,
  tmdbApiKey: process.env.TMDB_API_KEY,
  doubanCookie: process.env.DOUBAN_COOKIE,
  indienovaCookie: process.env.INDIENOVA_COOKIE,
});

// Bun 服务器配置
export default {
  fetch: app.fetch,
  port: Number(process.env.PORT) || 3000,
};

console.log(`🚀 PT-Gen server running on http://localhost:${Number(process.env.PORT) || 3000}`);
