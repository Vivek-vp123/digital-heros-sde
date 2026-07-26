import { performance } from 'node:perf_hooks';
import { z } from 'zod';
import { AppError } from './error';
import { readCachedAudit, writeCachedAudit } from './cache';
import type { AuditResult, AuditServiceDeps } from './types';

const auditInputSchema = z.object({
  url: z.string().url().refine((value) => /^https?:\/\//i.test(value), 'Only http and https URLs are supported.')
});

function normalizeUrl(input: string) {
  const parsed = new URL(input);
  parsed.hash = '';
  parsed.hostname = parsed.hostname.toLowerCase();
  parsed.protocol = parsed.protocol.toLowerCase();

  if ((parsed.protocol === 'https:' && parsed.port === '443') || (parsed.protocol === 'http:' && parsed.port === '80')) {
    parsed.port = '';
  }

  if (parsed.pathname === '') {
    parsed.pathname = '/';
  }

  return parsed.toString();
}

function countMatches(html: string, pattern: RegExp) {
  return html.match(pattern)?.length ?? 0;
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/is);
  return match?.[1]?.trim() || null;
}

function extractMetaDescription(html: string) {
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/is)
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/is);
  return match?.[1]?.trim() || null;
}

function buildIssues(result: Omit<AuditResult, 'issues' | 'score' | 'cached'>) {
  const issues: string[] = [];

  if (!result.ok) {
    issues.push(`HTTP status ${result.statusCode}`);
  }

  if (!result.title) {
    issues.push('Missing page title');
  }

  if (!result.metaDescription) {
    issues.push('Missing meta description');
  }

  if (result.links > 80) {
    issues.push('High link count can dilute clarity');
  }

  if (result.responseTimeMs > 3000) {
    issues.push('Slow response time');
  }

  return issues;
}

function scoreAudit(result: Omit<AuditResult, 'issues' | 'score' | 'cached'>) {
  let score = 100;

  if (!result.ok) score -= 30;
  if (!result.title) score -= 15;
  if (!result.metaDescription) score -= 10;
  if (result.links > 80) score -= 10;
  if (result.responseTimeMs > 3000) score -= 15;
  if (result.headings.h1 === 0) score -= 10;

  return Math.max(0, score);
}

export function validateAuditRequest(payload: unknown) {
  return auditInputSchema.parse(payload);
}

export function createAuditService(deps: AuditServiceDeps) {
  return {
    async auditUrl(input: string, requestId: string): Promise<AuditResult> {
      const parsedInput = auditInputSchema.parse({ url: input });
      const normalizedUrl = normalizeUrl(parsedInput.url);
      const cached = await readCachedAudit(deps.redis, normalizedUrl);

      if (cached) {
        return {
          ...cached,
          cached: true
        };
      }

      return deps.semaphore.runExclusive(async () => {
        const cachedAfterLock = await readCachedAudit(deps.redis, normalizedUrl);

        if (cachedAfterLock) {
          return {
            ...cachedAfterLock,
            cached: true
          };
        }

        const fetchImpl = deps.fetchFn ?? fetch;
        const controller = new AbortController();
        const startedAt = performance.now();
        const timer = setTimeout(() => controller.abort(), deps.timeoutMs);

        try {
          const response = await fetchImpl(normalizedUrl, {
            signal: controller.signal,
            headers: {
              'user-agent': 'PagePulse/1.0 (+https://digitalheroesco.com)'
            }
          });

          const body = await response.text();
          const responseTimeMs = Math.round(performance.now() - startedAt);
          const contentType = response.headers.get('content-type');
          const isHtml = contentType?.includes('text/html') ?? false;
          const result: AuditResult = {
            url: input,
            finalUrl: response.url || normalizedUrl,
            statusCode: response.status,
            ok: response.ok,
            responseTimeMs,
            contentType,
            title: isHtml ? extractTitle(body) : null,
            metaDescription: isHtml ? extractMetaDescription(body) : null,
            links: isHtml ? countMatches(body, /<a\s/gi) : 0,
            headings: {
              h1: isHtml ? countMatches(body, /<h1\b/gi) : 0,
              h2: isHtml ? countMatches(body, /<h2\b/gi) : 0
            },
            fetchedAt: new Date().toISOString(),
            cached: false,
            issues: [],
            score: 0
          };

          result.issues = buildIssues(result);
          result.score = scoreAudit(result);

          await writeCachedAudit(deps.redis, normalizedUrl, result, deps.cacheTtlSeconds);
          deps.logger.info({ requestId, url: normalizedUrl, cached: false, score: result.score }, 'audit_completed');
          return result;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw new AppError(504, 'audit_timeout', 'The URL audit timed out before the fetch completed.');
          }

          throw new AppError(502, 'audit_fetch_failed', 'The target URL could not be fetched.', {
            cause: error instanceof Error ? error.message : 'unknown'
          });
        } finally {
          clearTimeout(timer);
        }
      });
    }
  };
}
