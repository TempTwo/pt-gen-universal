import { BBCodeFormatter } from './formatters/bbcode';
import { MarkdownFormatter } from './formatters/markdown';

export type LegacyFormat = 'bbcode' | 'markdown';

// Back-compat wrapper for older tests/usages; the new code path uses lib/formatters/* directly.
export function formatMovieInfo(data: any, format: LegacyFormat = 'bbcode'): string {
  if (format === 'markdown') return new MarkdownFormatter().format(data);
  return new BBCodeFormatter().format(data);
}

export { BBCodeFormatter, MarkdownFormatter };
