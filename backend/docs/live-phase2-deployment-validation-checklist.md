# Wanzami Live Streaming — Phase 2 Deployment & Validation Checklist

## Scope
Third-party source registration + heartbeat health checks, including status transitions:
- `READY`
- `DEGRADED`
- `OFFLINE`

Backwards compatibility retained for legacy `ERROR` heartbeat state (normalized to `DEGRADED`).

## 1) Pre-deploy
- [ ] Confirm backend branch includes:
  - [ ] `register-third-party` admin endpoint
  - [ ] source heartbeat endpoint
  - [ ] heartbeat-derived health transitions in source responses
  - [ ] live-switch safety checks while event is `LIVE`
- [ ] Confirm Prisma migration exists:
  - [ ] `20260221105000_live_source_degraded_status`
- [ ] Verify env value (optional):
  - [ ] `LIVE_SOURCE_HEARTBEAT_TIMEOUT_MS` (default `45000`)

## 2) Deploy
- [ ] Run DB migration
  - [ ] `npm run prisma:migrate` (or your production migration command)
- [ ] Regenerate Prisma client if required by your pipeline
  - [ ] `npm run prisma:generate`
- [ ] Deploy backend service
- [ ] Restart API instances/workers

## 3) Automated verification
- [ ] Run targeted tests:
  - [ ] `src/controllers/liveController.thirdparty.test.ts`
  - [ ] `src/controllers/liveController.source.health.test.ts`
- [ ] Run full test suite:
  - [ ] `npm test`

## 4) API validation (manual smoke)
Use an admin token.

### A. Register third-party source
- [ ] `POST /api/admin/live/events/:id/sources/register-third-party`
- [ ] Confirm response includes:
  - [ ] `metadata.thirdParty.provider`
  - [ ] `metadata.thirdParty.transport`
  - [ ] initial `status` (`READY` when playback URL exists, else `OFFLINE`)

### B. Heartbeat updates
- [ ] `POST /api/admin/live/events/:id/sources/:sourceId/heartbeat`
- [ ] Send `state=READY` with metrics (`latencyMs`, `bitrateKbps`)
- [ ] Confirm `health.lastHeartbeatAt` updates
- [ ] Send legacy `state=ERROR`
- [ ] Confirm returned `status` is `DEGRADED`

### C. Timeout transitions
- [ ] `GET /api/admin/live/events/:id/sources`
- [ ] Confirm transition logic:
  - [ ] fresh heartbeat => `READY`
  - [ ] heartbeat older than 50% of timeout => `DEGRADED`
  - [ ] heartbeat older than timeout => `OFFLINE`

### D. Live switch safety
- [ ] Put event in `LIVE`
- [ ] Attempt switch to `DEGRADED`/`OFFLINE` source
- [ ] Confirm `409 LIVE_SOURCE_SWITCH_BLOCKED`
- [ ] Switch to `READY` source with playback URL
- [ ] Confirm success

## 5) Rollback notes
- API behavior is backward compatible with clients still sending `ERROR` heartbeat state.
- If rollback is needed, deploy previous backend image.
- DB enum migration adds a value and is generally non-destructive; keep app + schema versions aligned.
