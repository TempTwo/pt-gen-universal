import { describe, expect, it } from 'vitest';
import { Orchestrator } from '../../lib/orchestrator';
import type { SitePlugin } from '../../lib/types/plugin';

describe('Orchestrator.matchUrl', () => {
  it('supports capture groups even when a urlPattern is accidentally /g', () => {
    const plugin: SitePlugin = {
      site: 'test',
      urlPatterns: [/https:\/\/example\.com\/t\/(\d+)/g],
      scraper: {
        async fetch() {
          return { site: 'test', success: false, error: 'not used' };
        },
        async search() {
          return [];
        },
      },
      normalizer: {
        normalize() {
          throw new Error('not used');
        },
      },
    };

    const orch = new Orchestrator({}, [plugin]);
    expect(orch.matchUrl('https://example.com/t/123')).toEqual({ site: 'test', sid: '123' });
  });

  it('uses plugin priority to resolve ambiguous url patterns', () => {
    const low: SitePlugin = {
      site: 'low',
      priority: 0,
      urlPatterns: [/https:\/\/example\.com\/x\/(\w+)/],
      scraper: {
        async fetch() {
          return { site: 'low', success: false, error: 'not used' };
        },
        async search() {
          return [];
        },
      },
      normalizer: {
        normalize() {
          throw new Error('not used');
        },
      },
    };

    const high: SitePlugin = {
      site: 'high',
      priority: 10,
      urlPatterns: [/https:\/\/example\.com\/x\/(\w+)/],
      scraper: {
        async fetch() {
          return { site: 'high', success: false, error: 'not used' };
        },
        async search() {
          return [];
        },
      },
      normalizer: {
        normalize() {
          throw new Error('not used');
        },
      },
    };

    // Register low first; priority should still pick high.
    const orch = new Orchestrator({}, [low, high]);
    expect(orch.matchUrl('https://example.com/x/abc')).toEqual({ site: 'high', sid: 'abc' });
  });
});
