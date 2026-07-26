import { jest } from '@jest/globals';
import type { RedisLike } from '../server/src/types';

export class InMemoryRedis implements RedisLike {
  private readonly store = new Map<string, { value: string; expiresAt: number | null }>();

  async get(key: string) {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async setEx(key: string, seconds: number, value: string) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + seconds * 1000
    });

    return 'OK';
  }

  async incr(key: string) {
    const current = await this.get(key);
    const value = current ? Number(current) : 0;
    const next = value + 1;
    this.store.set(key, {
      value: String(next),
      expiresAt: this.store.get(key)?.expiresAt ?? null
    });
    return next;
  }

  async expire(key: string, seconds: number) {
    const entry = this.store.get(key);
    if (!entry) {
      return 0;
    }

    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string) {
    const entry = this.store.get(key);
    if (!entry) {
      return -2;
    }
    if (entry.expiresAt === null) {
      return -1;
    }

    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return Math.max(remaining, -2);
  }

  async del(key: string | string[]) {
    const keys = Array.isArray(key) ? key : [key];
    let removed = 0;
    for (const currentKey of keys) {
      removed += this.store.delete(currentKey) ? 1 : 0;
    }
    return removed;
  }
}

export function createTestFetch(html = '<!doctype html><html><head><title>Example</title><meta name="description" content="Demo"></head><body><h1>One</h1><h2>Two</h2><a href="/a">A</a></body></html>') {
  const fetchMock = jest.fn(async (_url: string, init?: RequestInit) => {
    const signal = init?.signal as AbortSignal | undefined;
    if (signal?.aborted) {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      throw abortError;
    }

    const headers = new Headers({ 'content-type': 'text/html; charset=utf-8' });

    return {
      ok: true,
      status: 200,
      url: 'https://example.com/',
      headers,
      text: async () => html
    } as Response;
  });

  return fetchMock;
}
