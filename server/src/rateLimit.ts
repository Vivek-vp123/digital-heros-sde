import type { NextFunction, Request, Response } from 'express';
import { AppError } from './error';
import type { RedisLike } from './types';

export function createRateLimitMiddleware(redis: RedisLike, windowSeconds: number, maxRequests: number) {
  return async function rateLimit(req: Request, _res: Response, next: NextFunction) {
    try {
      const clientId = req.ip;
      const key = `page-pulse:rate:${clientId}`;
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (count > maxRequests) {
        const ttl = await redis.ttl(key);
        throw new AppError(429, 'rate_limit_exceeded', 'Too many audit requests. Slow down and try again.', {
          retryAfterSeconds: ttl > 0 ? ttl : windowSeconds
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
