# Redis / Queue Reliability (ETIMEDOUT hardening)

This backend now treats Redis queue outages as **degraded mode** instead of fatal process failures.

## What changed

- Redis connections for `emailQueue`, `transcodeQueue`, `emailWorker`, and `transcodeWorker` now use:
  - lazy connect
  - bounded exponential reconnect backoff
  - connection timeout
  - non-fatal connection event handlers
- Queue enqueue path now uses bounded retries + operation timeout.
- Repetitive Redis network logs are rate-limited to reduce noise.
- Upload completion no longer hard-fails when Redis is temporarily down:
  - returns `202` with guidance
  - leaves upload in `PROCESSING` with actionable error text

## Environment variables

```env
REDIS_URL=redis://localhost:6379
REDIS_TLS=false
REDIS_CONNECT_TIMEOUT_MS=10000
REDIS_LAZY_CONNECT=true
REDIS_RETRY_BASE_DELAY_MS=250
REDIS_RETRY_MAX_DELAY_MS=5000
REDIS_MAX_RECONNECT_ATTEMPTS=50
QUEUE_ENQUEUE_TIMEOUT_MS=2500
QUEUE_ENQUEUE_MAX_ATTEMPTS=3
QUEUE_ENQUEUE_RETRY_BASE_DELAY_MS=200
QUEUE_ENQUEUE_RETRY_MAX_DELAY_MS=2000
```

## Notes

- For Redis providers requiring TLS, either:
  - set `REDIS_URL=rediss://...`, or
  - keep `redis://...` and set `REDIS_TLS=true`.
- If Redis stays down after retry cap, queue operations fail fast so API threads are not blocked.
- Use existing retry endpoints (e.g., transcode retry/backfill) after Redis recovers.
