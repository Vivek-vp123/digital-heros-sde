import { z } from 'zod';
import type { AppConfig } from './types';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  REDIS_URL: z.string().min(1).default('redis://127.0.0.1:6379'),
  AUDIT_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  AUDIT_CONCURRENCY: z.coerce.number().int().positive().default(5),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(20),
  NODE_ENV: z.string().default('development')
});

const env = envSchema.parse(process.env);

export const config: AppConfig = {
  port: env.PORT,
  redisUrl: env.REDIS_URL,
  auditTimeoutMs: env.AUDIT_TIMEOUT_MS,
  auditConcurrency: env.AUDIT_CONCURRENCY,
  cacheTtlSeconds: env.CACHE_TTL_SECONDS,
  rateLimitWindowSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
  rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  nodeEnv: env.NODE_ENV
};
