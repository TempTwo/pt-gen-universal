import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { createCacheMiddleware, type Storage } from '../../src/app';
import { CTX_CACHEABLE } from '../../src/utils/context';

class TestStorage implements Storage {
  public readonly map = new Map<string, string>();
  public putCount = 0;

  async get(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }

  async put(key: string, value: string): Promise<void> {
    this.putCount++;
    this.map.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }
}

describe('cache middleware', () => {
  it('writes cache only when controller marks CTX_CACHEABLE=true, and serves cache on next request', async () => {
    const storage = new TestStorage();
    const app = new Hono<{ Variables: { cacheable?: boolean } }>();
    app.use('/api/*', createCacheMiddleware(storage, 60) as any);

    let hits = 0;
    app.get('/api/cacheable', (c) => {
      hits++;
      c.set(CTX_CACHEABLE, true);
      return c.json({ ok: true, hits });
    });

    const res1 = await app.request('http://localhost/api/cacheable');
    expect(res1.status).toBe(200);
    expect(await res1.json()).toEqual({ ok: true, hits: 1 });
    expect(storage.putCount).toBe(1);

    const res2 = await app.request('http://localhost/api/cacheable');
    expect(res2.status).toBe(200);
    // Cache hit: handler should not run again.
    expect(await res2.json()).toEqual({ ok: true, hits: 1 });
    expect(storage.putCount).toBe(1);
  });

  it('does not write cache when CTX_CACHEABLE is not set', async () => {
    const storage = new TestStorage();
    const app = new Hono<{ Variables: { cacheable?: boolean } }>();
    app.use('/api/*', createCacheMiddleware(storage, 60) as any);

    let hits = 0;
    app.get('/api/not-cacheable', (c) => {
      hits++;
      return c.json({ ok: true, hits });
    });

    const res1 = await app.request('http://localhost/api/not-cacheable');
    expect(res1.status).toBe(200);
    expect(await res1.json()).toEqual({ ok: true, hits: 1 });
    expect(storage.putCount).toBe(0);

    const res2 = await app.request('http://localhost/api/not-cacheable');
    expect(res2.status).toBe(200);
    // No cache hit: handler should run again.
    expect(await res2.json()).toEqual({ ok: true, hits: 2 });
    expect(storage.putCount).toBe(0);
  });
});
