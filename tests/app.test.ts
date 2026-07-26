import request from 'supertest';
import pino from 'pino';
import { createApp } from '../server/src/app';
import type { AppConfig } from '../server/src/types';
import { InMemoryRedis, createTestFetch } from './fakes';

function buildConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    port: 3000,
    redisUrl: 'redis://localhost:6379',
    auditTimeoutMs: 200,
    auditConcurrency: 2,
    cacheTtlSeconds: 60,
    rateLimitWindowSeconds: 60,
    rateLimitMaxRequests: 5,
    nodeEnv: 'test',
    ...overrides
  };
}

describe('page pulse app', () => {
  it('returns structured validation errors and request IDs', async () => {
    const app = createApp(buildConfig(), new InMemoryRedis(), pino({ level: 'silent' }), createTestFetch());

    const response = await request(app).post('/api/audit').send({ url: 'not-a-url' });

    expect(response.status).toBe(400);
    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.body.error.code).toBe('validation_error');
  });

  it('returns audits and reuses cached results for repeat requests', async () => {
    const redis = new InMemoryRedis();
    const fetchMock = createTestFetch();
    const app = createApp(buildConfig(), redis, pino({ level: 'silent' }), fetchMock as unknown as typeof fetch);

    const first = await request(app).post('/api/audit').send({ url: 'https://example.com' });
    const second = await request(app).post('/api/audit').send({ url: 'https://example.com' });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body.data.cached).toBe(false);
    expect(second.body.data.cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rate limits a client after the configured threshold', async () => {
    const app = createApp(
      buildConfig({ rateLimitMaxRequests: 1 }),
      new InMemoryRedis(),
      pino({ level: 'silent' }),
      createTestFetch()
    );

    const headers = { 'x-forwarded-for': '203.0.113.10' };
    const first = await request(app).post('/api/audit').set(headers).send({ url: 'https://example.com' });
    const second = await request(app).post('/api/audit').set(headers).send({ url: 'https://www.wikipedia.org' });

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(second.body.error.code).toBe('rate_limit_exceeded');
  });
});
