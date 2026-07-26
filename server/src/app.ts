import crypto from 'node:crypto';
import express, { type ErrorRequestHandler } from 'express';
import fs from 'fs';
import path from 'path';
import { z, ZodError } from 'zod';
import { createAuditService } from './auditService';
import { AppError, toErrorResponse } from './error';
import { createRateLimitMiddleware } from './rateLimit';
import type { AppConfig, RedisLike } from './types';
import type { Logger } from 'pino';
import { Semaphore } from './semaphore';

const requestSchema = z.object({
  url: z.string().url().refine((value) => /^https?:\/\//i.test(value), 'Only http and https URLs are supported.')
});

export function createApp(config: AppConfig, redis: RedisLike, logger: Logger, fetchFn?: typeof fetch) {
  const app = express();
  const semaphore = new Semaphore(config.auditConcurrency);
  const auditService = createAuditService({
    redis,
    fetchFn,
    timeoutMs: config.auditTimeoutMs,
    cacheTtlSeconds: config.cacheTtlSeconds,
    semaphore,
    logger
  });

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '16kb' }));

  app.use((req, res, next) => {
    const requestId = (req.header('x-request-id') || crypto.randomUUID()).toString();
    const requestLogger = logger.child({ requestId, method: req.method, path: req.path, ip: req.ip });
    const startedAt = Date.now();

    req.requestId = requestId;
    req.logger = requestLogger;
    res.setHeader('x-request-id', requestId);

    requestLogger.info({ event: 'request_started' }, 'request_started');
    res.on('finish', () => {
      requestLogger.info(
        {
          event: 'request_finished',
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt
        },
        'request_finished'
      );
    });

    next();
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post(
    '/api/audit',
    createRateLimitMiddleware(redis, config.rateLimitWindowSeconds, config.rateLimitMaxRequests),
    async (req, res, next) => {
      try {
        const { url } = requestSchema.parse(req.body);
        const result = await auditService.auditUrl(url, req.requestId);
        res.status(200).json({ requestId: req.requestId, data: result });
      } catch (error) {
        next(error);
      }
    }
  );

  const clientDir = path.resolve(process.cwd(), 'dist/client');
  const indexFile = path.join(clientDir, 'index.html');

  if (fs.existsSync(clientDir)) {
    app.use(express.static(clientDir, { maxAge: '1h', etag: true }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/health') {
        next();
        return;
      }

      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
        return;
      }

      next();
    });
  }

  const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
    if (error instanceof ZodError) {
      res.status(400).json({
        requestId: req.requestId,
        error: {
          code: 'validation_error',
          message: 'The request payload is invalid.',
          details: error.flatten()
        }
      });
      return;
    }

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        requestId: req.requestId,
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null
        }
      });
      return;
    }

    req.logger.error({ err: error }, 'request_failed');
    const response = toErrorResponse(error, req.requestId);
    res.status(response.statusCode).json(response.body);
  };

  app.use(errorHandler);

  return app;
}
