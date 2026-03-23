# Wanzami Live: Multi-Camera / Third-Party Streaming Plan (Audit + Implementation)

## Scope audited
- `backend/src/controllers/liveController.ts`
- `backend/src/routes/liveRoutes.ts`
- `backend/src/controllers/livePlayback.ts`
- `backend/src/services/ivsService.ts`
- `backend/prisma/schema.prisma` (`LiveEvent`, `LiveEventSource`)
- `Admin/src/components/LiveStudio.tsx`

## Current state (what exists)
- Live event lifecycle exists: schedule, publish/unpublish, start, end, replay metadata.
- Multi-source data model exists (`LiveEventSource`) with source types (`CAMERA`, `SCREEN`, `RTMP`, `CONTROL_DECK`) and active source flag.
- Admin can create/update/delete/switch sources.
- Playback selection logic exists (`pickPlayablePlaybackUrl`) and publish gate checks for playable URL.
- IVS integration exists for channel/key provisioning and channel playback discovery.

## Gaps found for YouTube-like third-party multi-camera reliability
1. **Unsafe source switching while LIVE**
   - API allowed switching to sources with `OFFLINE/ERROR` status or missing `playbackUrl`.
   - This risks black screens or stale playback during live broadcasts.
2. **Unsafe source activation via source update/create while LIVE**
   - Active output could be set on non-playable source while stream is live.
3. **Start-live with explicitly selected non-playable source**
   - Start flow allowed selecting a source that could not actually play.
4. **Admin UX readiness cues are minimal**
   - Studio does not strongly indicate source readiness before go-live/switch.

## Concrete implementation plan (phased)

### Phase 1 (done now): API-level safety guardrails
- Enforce `LIVE_SOURCE_SWITCH_BLOCKED` when trying to make active/switch/start with source that is not:
  - `status === READY`, and
  - has non-empty `playbackUrl`
- Apply this to:
  - `POST /admin/live/events/:id/sources/switch`
  - `PATCH /admin/live/events/:id/sources/:sourceId` when `isActiveOutput=true`
  - `POST /admin/live/events/:id/sources` when `isActiveOutput=true` and event is live
  - `POST /admin/live/events/:id/start` when explicit `sourceId` is provided
- Add tests for blocking logic.

### Phase 2: Third-party ingest contract (next)
- Add source metadata contract for integrations:
  - `provider` (obs, streamyard, vmix, ndi-gateway, custom)
  - `sourceKey` / stable external id
  - `health` (`lastHeartbeatAt`, `latencyMs`, `droppedFrames`, `bitrateKbps`)
  - `transport` (`RTMP_PUSH`, `SRT`, `WHIP`, `HLS_PULL`)
- Add ingestion registration endpoint (signed/admin):
  - `POST /admin/live/events/:id/sources/register-third-party`
- Add heartbeat endpoint for source health updates.

### Phase 3: Live orchestration and automatic failover
- Introduce `switchReason` and switch audit logging.
- Add optional automatic failover policy:
  - if active source health degraded N seconds, switch to warm standby source.
- Add debounce + cooldown to avoid switch flapping.

### Phase 4: Playback and observability hardening
- Per-event stream metrics endpoint for Admin polling.
- Structured logs around start/end/switch with correlation IDs.
- Alarm rules (source offline, no active playable source, high buffering).

### Phase 5: Deployment plan
1. Deploy backend API guards first (backward compatible).
2. Roll out Admin UI readiness indicators.
3. Add provider registration/heartbeat behind feature flag.
4. Enable failover policy in canary events only.
5. Expand to all events after metrics stabilize.

## Safe/testable fixes implemented in this task

### Backend changes
- `backend/src/controllers/liveController.ts`
  - Added `isSourceSwitchSafeForLive()` helper.
  - Blocked unsafe active-source creation while event is LIVE.
  - Blocked unsafe active-source update while event is LIVE.
  - Blocked unsafe source switch while event is LIVE.
  - Blocked start-live when explicit selected source is not playable.

### Tests added/updated
- Updated: `backend/src/controllers/liveController.source.update.test.ts`
  - Added test: blocks activating non-playable source while live.
- Added: `backend/src/controllers/liveController.source.switch.test.ts`
  - Added test: blocks switching to non-playable source while live.

### Validation run
- Command: `node --import tsx --test src/controllers/liveController*.test.ts src/controllers/livePlayback.test.ts`
- Result: **15/15 passing**.

## Notes for main integration
- Changes are API-safe and do not alter mobile auth/content modules.
- Existing clients attempting unsafe live source switch now receive `409 LIVE_SOURCE_SWITCH_BLOCKED` and should display actionable UI message.
