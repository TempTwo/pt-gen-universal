import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Orchestrator } from '../../lib/orchestrator';
import { BBCodeFormatter } from '../../lib/formatters/bbcode';
import * as fetchModule from '../../lib/utils/fetch';
import { gogPlugin } from '../../src/sites/gog';

describe('GOG POC Integration', () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    vi.restoreAllMocks();
    const config = {};
    orchestrator = new Orchestrator(config, [gogPlugin]);
  });

  it('should fetch and format gog game info', async () => {
    const mockApiJson = {
      id: 12345,
      title: 'Cyberpunk 2077',
      slug: 'cyberpunk_2077',
      description: { lead: 'Wake up samurai' },
    };
    const mockStoreHtml = `
            cardProduct: {
                "boxArtImage": "https://example.com/cp2077.jpg",
                "supportedOperatingSystems": []
            }
        `;

    const fetchSpy = vi.spyOn(fetchModule, 'fetchWithTimeout').mockImplementation(async (url) => {
      const u = String(url);
      if (u.includes('catalog.gog.com')) {
        // Mock resolve ID if needed, but if we pass numeric ID it skips.
        // If we pass slug it searches.
        return {
          response: {
            ok: true,
            status: 200,
            json: async () => ({ products: [{ slug: 'cp2077', id: 12345 }] }),
          } as Response,
          proxyUsed: false,
          finalUrl: u,
        } as any;
      }
      if (u.includes('api.gog.com')) {
        return {
          response: { ok: true, status: 200, json: async () => mockApiJson } as Response,
          proxyUsed: false,
          finalUrl: u,
        } as any;
      }
      if (u.includes('www.gog.com/en/game/')) {
        return {
          response: { ok: true, status: 200, text: async () => mockStoreHtml } as Response,
          proxyUsed: false,
          finalUrl: u,
        } as any;
      }
      return {
        response: { ok: false, status: 404 } as Response,
        proxyUsed: false,
        finalUrl: u,
      } as any;
    });

    const info = await orchestrator.getMediaInfo('gog', '12345');
    const result = new BBCodeFormatter().format(info);

    expect(result).toContain('Cyberpunk 2077');
    expect(result).toContain('Wake up samurai');

    expect(fetchSpy).toHaveBeenCalled();
  });
});
