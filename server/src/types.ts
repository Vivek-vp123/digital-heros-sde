import type { Logger } from 'pino';

export interface RedisLike {
  get(key: string): Promise<string | null>;
  setEx(key: string, seconds: number, value: string): Promise<string>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  del(key: string | string[]): Promise<number>;
}

export interface AppConfig {
  port: number;
  redisUrl: string;
  auditTimeoutMs: number;
  auditConcurrency: number;
  cacheTtlSeconds: number;
  rateLimitWindowSeconds: number;
  rateLimitMaxRequests: number;
  nodeEnv: string;
}

export interface AuditResult {
  url: string;
  finalUrl: string;
  statusCode: number;
  ok: boolean;
  responseTimeMs: number;
  contentType: string | null;
  title: string | null;
  metaDescription: string | null;
  links: number;
  headings: {
    h1: number;
    h2: number;
  };
  issues: string[];
  score: number;
  fetchedAt: string;
  cached: boolean;
}

export interface RequestContext {
  requestId: string;
  logger: Logger;
}

export interface AuditServiceDeps {
  redis: RedisLike;
  fetchFn?: typeof fetch;
  timeoutMs: number;
  cacheTtlSeconds: number;
  semaphore: SemaphoreLike;
  logger: Logger;
}

export interface SemaphoreLike {
  runExclusive<T>(task: () => Promise<T>): Promise<T>;
}
