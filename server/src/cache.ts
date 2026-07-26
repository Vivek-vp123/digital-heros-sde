import { createHash } from 'crypto';
import type { AuditResult, RedisLike } from './types';

export function createAuditCacheKey(url: string) {
  const hash = createHash('sha256').update(url).digest('hex');
  return `page-pulse:audit:${hash}`;
}

export async function readCachedAudit(redis: RedisLike, url: string): Promise<AuditResult | null> {
  const raw = await redis.get(createAuditCacheKey(url));

  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as AuditResult;
}

export async function writeCachedAudit(
  redis: RedisLike,
  url: string,
  result: AuditResult,
  ttlSeconds: number
) {
  await redis.setEx(createAuditCacheKey(url), ttlSeconds, JSON.stringify(result));
}
