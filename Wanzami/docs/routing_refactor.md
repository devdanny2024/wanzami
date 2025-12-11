# Routing Refactor Plan

## Goals
- Move away from the single `App` overlay router; use proper Next.js routes/layouts.
- Ensure auth screens (`/login`, `/register`, splash) are true pages, not overlays.
- Make global UI (navbar, cookie banner, loaders) live in shared layouts/providers.

## Steps
1) Extract auth pages to dedicated routes (login, register) and stop rendering them from `App`. ✅ (login already dedicated; register exists)
2) Split core routes to real pages (home `/`, title `/title/[id]`, player `/player/[id]`, others) and remove `mapPathToPage` switching. ✅ (title/player done; home and others still routed via `App`)
3) Move global UI concerns (cookie banner, Toaster, navbar shell) to layout/providers so they render on every page without overlay hacks. ✅ (cookie banner + toaster now in `app/providers`)
4) Replace overlay-based auth gating with route-level guards (redirect unauthenticated users instead of showing embedded auth screens).
5) Add per-page skeletons/loaders instead of black-screen global loaders; ensure TopLoader sits on actual pages.
6) Simplify `App.tsx` by pruning unused splash/registration state once routes are fully split.
7) QA: verify navigation does not flash login; cookie banner shows on all pages; player/detail routes load directly; episodes/quality/back buttons work.
