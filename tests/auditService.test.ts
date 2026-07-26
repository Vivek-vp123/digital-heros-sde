import { describe, expect, it, jest } from '@jest/globals';
import pino from 'pino';
import { createAuditService } from '../server/src/auditService';
import { Semaphore } from '../server/src/semaphore';
import { InMemoryRedis, createTestFetch } from './fakes';

describe('audit service', () => {
  it('validates, fetches once, and serves repeat audits from cache', async () => {
    const redis = new InMemoryRedis();
    const fetchMock = createTestFetch();
    const service = createAuditService({
      redis,
      fetchFn: fetchMock,
      timeoutMs: 200,
      cacheTtlSeconds: 60,
      semaphore: new Semaphore(2),
      logger: pino({ level: 'silent' })
    });

    const first = await service.auditUrl('https://example.com', 'req-1');
    const second = await service.auditUrl('https://example.com', 'req-2');

    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.title).toBe('Example');
    expect(first.issues).toEqual([]);
  });

  it('returns a structured timeout error when the fetch never resolves', async () => {
    const redis = new InMemoryRedis();
    const fetchMock = jest.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal as AbortSignal | undefined;
        signal?.addEventListener('abort', () => {
          const abortError = new Error('Aborted');
          abortError.name = 'AbortError';
          reject(abortError);
        });
      });
    });

    const service = createAuditService({
      redis,
      fetchFn: fetchMock as unknown as typeof fetch,
      timeoutMs: 10,
      cacheTtlSeconds: 60,
      semaphore: new Semaphore(1),
      logger: pino({ level: 'silent' })
    });

    await expect(service.auditUrl('https://example.com', 'req-timeout')).rejects.toMatchObject({
      statusCode: 504,
      code: 'audit_timeout'
    });
  });
});
