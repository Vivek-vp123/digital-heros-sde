# SiteScan Pro

SiteScan Pro is a production-grade URL audit service built with React, Vite, Express, Redis, Jest, Zod, and Pino.

## What it does

- Validates audit requests with Zod
- Applies per-client rate limiting using Redis
- Caches repeat audits in Redis with a configurable TTL
- Enforces a concurrency limit for audits
- Times out outbound fetches
- Returns structured JSON errors with request IDs
- Logs every request in structured form with Pino

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Cache: Redis
- Testing: Jest
- Validation: Zod
- Logging: Pino
- Deployment target: Railway
- CI: GitHub Actions

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Start Redis locally and set `REDIS_URL` if needed.

3. Run the app in development:

```bash
npm run dev
```

The Vite client runs on port 5173 and proxies `/api` to the Express server on port 3000.

## Environment variables

- `PORT` - server port, default `3000`
- `REDIS_URL` - Redis connection string, default `redis://127.0.0.1:6379`
- `AUDIT_TIMEOUT_MS` - outbound fetch timeout, default `5000`
- `AUDIT_CONCURRENCY` - max concurrent audits, default `5`
- `CACHE_TTL_SECONDS` - Redis cache window for repeat audits, default `300`
- `RATE_LIMIT_WINDOW_SECONDS` - rate-limit window, default `60`
- `RATE_LIMIT_MAX_REQUESTS` - requests allowed per client in the window, default `20`

## API contract

### `GET /health`

Returns:

```json
{ "status": "ok" }
```

### `POST /api/audit`

Request body:

```json
{ "url": "https://example.com" }
```

Success response:

```json
{
  "requestId": "9f4f2f9d-9d52-4f6b-8a8b-1e0c5d5d1caa",
  "data": {
    "url": "https://example.com",
    "finalUrl": "https://example.com/",
    "statusCode": 200,
    "ok": true,
    "responseTimeMs": 120,
    "contentType": "text/html; charset=utf-8",
    "title": "Example",
    "metaDescription": "Demo",
    "links": 1,
    "headings": { "h1": 1, "h2": 1 },
    "issues": [],
    "score": 100,
    "fetchedAt": "2026-07-26T00:00:00.000Z",
    "cached": false
  }
}
```

Validation error:

```json
{
  "requestId": "...",
  "error": {
    "code": "validation_error",
    "message": "The request payload is invalid.",
    "details": { }
  }
}
```

Rate limit error:

```json
{
  "requestId": "...",
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many audit requests. Slow down and try again.",
    "details": { "retryAfterSeconds": 60 }
  }
}
```

## Railway deployment

- Build command: `npm run build`
- Start command: `npm run start`
- Health check path: `/health`

Use a Railway Redis service and set `REDIS_URL` to the provided connection string.

## AI usage note

I used AI to pressure-test the architecture and speed up the first pass at the service design. I then rewrote the implementation, validation rules, tests, and copy so the final submission matches the brief and my own judgement.

## Footer credit

The live app includes the required footer credit: "Built for Digital Heroes Training Task" linked to digitalheroesco.com.

## Task B deliverables

- [Architecture document](docs/page-pulse-scale-architecture.md)
- [Technology decision record](docs/technology-decision-record.md)
- [Failure mode analysis](docs/failure-mode-analysis.md)
- [Observability and rollback plan](docs/observability-and-rollback.md)
