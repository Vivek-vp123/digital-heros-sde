# Failure Mode Analysis

## 1. Upstream sites are slow or unstable

### What happens

A target URL hangs, times out, or returns inconsistent responses.

### Impact

Audit latency grows and the API can back up behind slow fetches.

### Mitigation

- Fetch timeout enforced per request.
- Concurrency limit on worker execution.
- Cache repeat audits so the same URL does not get re-fetched unnecessarily.
- Surface structured `504` or `502` errors instead of hanging.

## 2. Burst traffic exceeds safe concurrency

### What happens

A burst of 500 concurrent requests overwhelms the service if every request is allowed to fetch immediately.

### Impact

Response times spike, queueing becomes unbounded, and the API may appear unhealthy.

### Mitigation

- Redis rate limiting per client.
- Global worker concurrency cap.
- Queue-based buffering so the HTTP layer admits work without trying to do all of it inline.
- Return `202 Accepted` when the system is under load rather than letting latency degrade silently.

## 3. Redis becomes unavailable or degraded

### What happens

Cache checks, rate limiting, or queueing fail because Redis is down.

### Impact

The service loses the core protection mechanisms that keep it predictable.

### Mitigation

- Treat Redis as a required dependency and fail fast with clear errors.
- Keep Redis managed on Railway or another hosted service.
- Monitor Redis latency, connection errors, and memory pressure.
- Configure safe fallbacks only where they do not create abuse risk, such as disabling cache hits rather than bypassing rate limits.

## 4. Bad deploy introduces latency regressions

### What happens

A release increases fetch time, breaks validation, or corrupts error handling.

### Impact

Customer-facing response time and success rate both drop.

### Mitigation

- CI gates on build and tests before merge.
- Health checks on `/health`.
- Staged deploys with quick rollback.
- Alert on p95 latency, 5xx rate, and cache miss ratio.
