# Observability and Rollback Plan

## What to monitor

- Request rate overall and by client.
- p50, p95, and p99 response time for `POST /api/audit`.
- HTTP 4xx and 5xx rate.
- Timeout count and upstream fetch failure count.
- Cache hit rate.
- Rate-limit rejections.
- Redis latency and connection errors.
- Worker queue depth and job age.

## Alerts

- p95 response time above the SLA for 5 minutes.
- 5xx rate above a small error budget threshold.
- Cache hit rate drops sharply after a deploy.
- Redis errors increase or Redis latency crosses a safe limit.
- Queue depth or job age trends upward for more than one interval.

## Logging

Use structured JSON logs with these fields:

- `requestId`
- `method`
- `path`
- `clientIp`
- `statusCode`
- `durationMs`
- `url`
- `cacheHit`
- `errorCode`

Logs should be enough to trace a request from admission through fetch to response without reading plain text messages.

## Rollback strategy

1. Keep each deploy small.
2. Validate the new release on `/health` before shifting traffic.
3. Compare the first live metrics against the previous release.
4. Roll back immediately if latency, timeout rate, or 5xx rate regresses.
5. Preserve the old release artifact so rollback is a redeploy, not a rebuild.

## Deployment guardrails

- GitHub Actions runs build and test on every push.
- Railway should use a health check before routing traffic.
- Redis configuration changes should be made separately from app deploys when possible.
- Any deploy that changes queue semantics should be treated as higher risk and watched manually for the first rollout window.
