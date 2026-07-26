# Technology Decision Record

## Decision 1: Express for the API

Use Express for the backend service.

### Why

- The stack requested Express.
- It is lightweight, predictable, and easy to deploy on Railway.
- The codebase only needs a small API surface, so a framework with minimal ceremony is the best fit.

### Alternative considered

Fastify.

### Why rejected

Fastify is strong, but it would add a different abstraction layer than the one requested and does not materially improve this small service enough to justify diverging from the brief.

## Decision 2: Redis as the shared operational store

Use Redis for caching, rate limiting, and burst buffering.

### Why

- It is already required for caching and rate limiting.
- It supports TTL-based cache entries and atomic counters.
- It avoids introducing a second dependency for a queue when the traffic profile is moderate.

### Alternative considered

Postgres.

### Why rejected

There is no database requirement for the task, and a relational store would be unnecessary overhead for counters, cache entries, and a transient job buffer.

## Decision 3: Background worker for outbound fetches

Move the network-bound audit work into a worker process once scale matters.

### Why

- It protects the API from slow or hung outbound requests.
- It gives us a clean concurrency boundary.
- It is the simplest way to absorb burst traffic without letting response times spiral.

### Alternative considered

Synchronous-only request handling.

### Why rejected

A synchronous-only design is fine for a demo but becomes fragile under 500 concurrent requests because it couples request latency directly to external site performance.

## Decision 4: React + Vite for the front end

Keep React + Vite for the public UI.

### Why

- It is the required stack.
- It builds quickly and ships a small production bundle.
- The UI is simple, so more structure would not improve the brief.

### Alternative considered

Server-rendered templates.

### Why rejected

That would conflict with the requested tech stack and add no real benefit for this use case.

## Decision 5: Jest for tests

Use Jest for service and route tests.

### Why

- It is common, stable, and fits the requested stack.
- It supports unit and integration-style tests around the Express API.
- It works cleanly with mocked fetch and in-memory Redis fakes.

### Alternative considered

Vitest.

### Why rejected

Vitest would also work, but Jest is already specified in the brief.
