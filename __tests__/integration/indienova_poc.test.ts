
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Orchestrator } from '../../lib/orchestrator';
import { IndienovaScraper } from '../../lib/scrapers/indienova';
import * as fetchModule from '../../lib/utils/fetch';

describe('Indienova POC Integration', () => {
    let orchestrator: Orchestrator;

    beforeEach(() => {
        vi.restoreAllMocks();
        const config = {};
        orchestrator = new Orchestrator(config);
    });

    it('should fetch and format indienova game info', async () => {
        const mockHtml = `
            <title>Game Title - Indienova</title>
            <div class="title-holder"><h1><span>Game Title</span></h1></div>
            <div id="tabs-intro"><div class="bottommargin-sm">Description</div></div>
        `;

        const fetchSpy = vi.spyOn(fetchModule, 'fetchWithTimeout').mockImplementation(async (url) => {
            if (url.includes('indienova.com/game/')) {
                return { ok: true, status: 200, text: async () => mockHtml } as Response;
            }
            return { ok: false, status: 404 } as Response;
        });

        const result = await orchestrator.fetchInfo('indienova', 'game-id', 'bbcode');

        expect(result).toContain('Game Title');
        expect(result).toContain('Description');

        expect(fetchSpy).toHaveBeenCalled();
    });
});
