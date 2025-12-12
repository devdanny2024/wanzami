# Wanzami Routing & Player Refactor Plan (Updated)

## Goals
- Shift from stateful page switching to URL-based routing across the site.
- Give player/detail views real URLs so browser back/forward works without z-index hacks.
- Keep backend calls (`fetchTitles`, `fetchTitleWithEpisodes`, `postEvents`, etc.) unchanged.


## Route Map (Next.js app router + client navigation)
- `/` → HomePage
- `/search` → SearchPage
- `/blog` → BlogHomePage
- `/blog/post/:postId` → BlogPostPage
- `/blog/category/:category` → BlogCategoryPage
- `/blog/search` → BlogSearchPage
- `/ppv` → PPV landing
- `/movies` → Movies landing (placeholder)
- `/series` → Series landing (placeholder)
- `/kids` → Kids landing (placeholder)
- `/originals` → Originals landing (placeholder)
- `/mylist` → My List (placeholder)
- `/payment` → PaymentPage
- `/title/:id` → MovieDetailPage (non-PPV)
- `/ppv/:id` → PPVMoviePage
- `/player/:id` (+ query: `episodeId`, `startTime`) → CustomMediaPlayer fullscreen
- Auth/Splash: `/login`, `/signup`, `/splash` (or integrate splash into `/`)

## Current Progress (done)
- App renders on all paths (catch-all route) and uses `next/navigation`.
- Path ↔ state mapping in `App.tsx`; navigation pushes real URLs (title/player/blog).
- Movie click → `/title/:id`; play/resume → `/player/:id`; player close backs/falls back.
- Navbar uses `Link`/`router.push` for desktop/mobile; active state keyed by URL.
- Blog deep links hydrate selected post/category.
- Legacy `currentPage` removed from render flow.

## Next Steps
1) Add lightweight loaders for `/title/:id` and `/player/:id` to fetch details/episodes on direct hits and handle not-found gracefully.
2) Remove player z-index/pointer hacks once routed overlay is stable.
3) Verify all nav and deep-link flows end-to-end (home/search/blog/ppv/movies/series/kids/mylist; player back behavior; continue-watching resume; auth gating if needed).

