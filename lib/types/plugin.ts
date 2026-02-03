import { Normalizer } from '../interfaces/normalizer';
import { Scraper } from '../interfaces/scraper';

/**
 * Site plugin definition (scraper + normalizer + URL matching rules).
 *
 * Orchestrator is intentionally generic and does not hardcode any site list.
 * Add a new site by creating a plugin and including it in the registry.
 */
export interface SitePlugin {
  /** Canonical site id, e.g. 'douban', 'tmdb'. */
  site: string;

  /**
   * Match priority for ambiguous URL patterns.
   * Higher numbers win; ties preserve registry order.
   */
  priority?: number;

  /** URL patterns that can be recognized as this site. */
  urlPatterns: RegExp[];

  /**
   * Whether this site supports the `search` feature.
   * Defaults to true. If false, Orchestrator.search throws FEATURE_DISABLED.
   */
  supportsSearch?: boolean;

  /**
   * Convert a RegExp match result into sid.
   * Defaults to using the first capture group (`match[1]`).
   */
  parseSid?: (match: RegExpMatchArray) => string;

  scraper: Scraper;
  normalizer: Normalizer;
}
