# Wanzami Admin — UI/UX Redesign Plan

Grounded in the `ui-ux-pro-max` design engine (Dark/OLED operations dashboard, status-color system, data-dense but scannable) and adapted to Wanzami's existing brand (orange `#fd7e14`, Inter/Bebas, shadcn + Tailwind).

## 1. Why redesign

The admin works but it grew feature-first. Concrete problems today:

- **Flat 18-item sidebar.** Dashboard, Movies, Series, PPV, Blog, Users, Team, Email Service, Support, Live Studio, Creator Hub, Payments, Invoices, Processes, Moderation, Analytics, Settings, Logs all sit at one level. Operators scan a wall of links with no grouping or active-section sense.
- **No location cues.** Single-page view-swapping means no breadcrumbs, no URL per screen, no deep links to a specific movie or ticket.
- **Inconsistent panels.** Each management screen renders its own table/card markup, spacing, and status colors. Movie status uses one palette, PPV another.
- **Forms are long single columns.** The movie form stacks ~20 fields with no sectioning or progressive disclosure; required-field errors surface inline but late.
- **No bulk actions.** Every title is edited one at a time.

The goal is structure and consistency, not a visual reskin. Keep the brand; fix the bones.

## 2. Information architecture

Regroup the 18 destinations into 5 sections that match how the team actually works:

| Group | Items | Rationale |
|-------|-------|-----------|
| **Overview** | Dashboard, Analytics | First thing you open; numbers and health. |
| **Content** | Movies, Series, Live Studio, Creator Hub, Blog | Everything you publish. The new Coming Soon / Leaving Soon states live here. |
| **Revenue** | PPV, Payments, Invoices | Money in one place. |
| **Community** | Users, Support, Moderation | People and the things they report. |
| **System** | Team, Email Service, Processes, Logs, Settings | Operator/infra tooling, used less often. |

Rules applied (`nav-hierarchy`, `drawer-usage`, `adaptive-navigation`):
- Primary nav = grouped left sidebar. Secondary nav = in-page tabs (e.g. Payments → Transactions / Payouts / Disputes).
- "System" collapses by default; most days you never open it.
- Each destination gets a real route (`/content/movies`, `/content/movies/[id]`), so screens are deep-linkable and the browser back button works (`deep-linking`, `back-behavior`).

## 3. Navigation & layout system

**Shell:** shadcn `Sidebar` (`SidebarProvider` + `SidebarGroup` per section) instead of the hand-rolled `w-64 fixed` sidebar. Gains collapsible rail, mobile sheet, and keyboard support for free.

- **Collapsible sidebar:** full labels on desktop, icon-rail when collapsed, off-canvas sheet under 1024px (`adaptive-navigation`).
- **Top bar:** breadcrumb (`Content / Movies / Edit "Lagos Nights"`), global search, upload-queue indicator, account menu. Breadcrumbs appear once a screen is 3+ levels deep (`breadcrumb-web`).
- **Command palette (⌘K / Ctrl-K):** jump to any screen or title without hunting the sidebar. This is the real fix for "too many nav items."
- **Active state:** highlight the current item and its parent group (`nav-state-active`).
- **Content width:** `max-w-[1400px]` centered with consistent gutters; tables can go full-bleed within the page.

```
┌──────────────────────────────────────────────────────────┐
│ Topbar: ☰  Content / Movies            ⌘K  ⬆3  ◔  ▾ Admin │
├───────────┬──────────────────────────────────────────────┤
│ Overview  │  Movies                         [+ New movie] │
│  Dashboard│  ┌────────────────────────────────────────┐  │
│  Analytics│  │ search · filters · status · bulk-bar   │  │
│ Content   │  ├────────────────────────────────────────┤  │
│ ▸ Movies  │  │ ▢ Poster  Title   Status     Updated   │  │
│   Series  │  │ ▢  ▣      Title   ● Live      2d       │  │
│   Live    │  │ ▢  ▣      Title   ◷ Coming    —        │  │
│ Revenue   │  └────────────────────────────────────────┘  │
│ Community │                                              │
│ System ▾  │                                              │
└───────────┴──────────────────────────────────────────────┘
```

## 4. Design tokens

Keep the brand. Formalize everything else as semantic tokens (`color-semantic`, no raw hex in components).

**Brand & surface (dark-only, OLED-friendly):**
- `--brand: #fd7e14` (primary actions, active nav), `--brand-dark: #e86f0f`, `--brand-light: #ff9f4d`
- `--bg: #0a0a0a`, `--surface: #141414`, `--surface-2: #1c1c1c`, `--border: #2a2a2a`
- `--fg: #f5f5f5`, `--fg-muted: #a1a1a1`

**Status colors (one system everywhere — this is the big consistency win):**
| Status | Token | Use |
|--------|-------|-----|
| Live / success / paid | `--status-live: #10b981` (emerald) | published, succeeded |
| Coming Soon | `--status-coming: #0ea5e9` (sky) | matches the new frontend badge |
| Leaving Soon | `--status-leaving: #f43f5e` (rose) | matches the new frontend badge |
| Pending / processing | `--status-pending: #f59e0b` (amber) | review, uploading |
| Archived / disabled | `--status-neutral: #6b7280` | archived, inactive |
| Error / failed / refund | `--status-error: #ef4444` | failures, disputes |

Every badge, table dot, and toast pulls from these. The Coming/Leaving tokens deliberately match the badges already shipped on the storefront so admins see the same color the customer sees.

**Scale tokens:** spacing on a 4/8px rhythm (`spacing-scale`); radius `sm 6 / md 10 / lg 16 / full`; elevation `e1 e2 e3` (one shadow scale, `elevation-consistent`); type scale `12 14 16 18 24 32` with Inter body / Bebas display; **tabular figures** for all money and count columns (`number-tabular`).

## 5. Component standards

A small shared kit replaces the per-panel markup:

- **`<DataTable>`** — one component for Movies, Series, Users, Payments, Invoices, Tickets. Sortable headers with `aria-sort` (`sortable-table`), sticky header, row selection with a **bulk-action bar** (`Bulk Actions` — publish, archive, set availability, delete), per-row overflow menu, `overflow-x-auto` wrapper (`data-table`, `bulk-actions`), skeleton rows while loading, and a real empty state (`empty-states`).
- **`<StatusBadge status=…>`** — dot + label from the status tokens. Single source for Live / Coming Soon / Leaving Soon / Pending / Archived / Error.
- **`<FormSection>`** — splits long forms into labelled groups (see §6). Required markers, helper text under complex fields (`input-helper-text`), errors below the field with focus-to-first-invalid on submit (`error-placement`, `focus-management`), and a sticky save bar showing dirty state.
- **`<PageHeader>`** — title, breadcrumb, and the single primary CTA per screen (`primary-action`).
- **`<EmptyState>`**, **`<ConfirmDialog>`** (every destructive/bulk action, with undo toast where feasible — `confirmation-dialogs`, `undo-support`), **`<MetricCard>`** for dashboard tiles.
- **Upload dock** becomes a dockable panel with per-item progress, retry on failure, and a clear queued/processing/done state (`progressive-loading`, `error-recovery`).

Icons: one Lucide set, consistent stroke, no emoji (`no-emoji-icons`).

## 6. Key screen redesigns

**Dashboard** — top row of `MetricCard`s (titles live, uploads in flight, revenue 30d, open tickets), each with a sparkline; below, "Needs attention" (failed uploads, pending review, **titles flipping to Live or Leaving in the next 7 days** — surfaces the new availability automation), then a recent-activity feed.

**Movies / Series list** — `DataTable` with poster thumb, title, `StatusBadge`, availability window, updated-at. Filters for status and availability; multi-select bulk bar to publish/archive or set Coming/Leaving across many titles at once.

**Movie / Series form** — break the single column into `FormSection`s:
1. Basics (title, type, description, genres)
2. Media (poster, thumbnail, trailer, video)
3. Classification (maturity, runtime, language, countries)
4. **Availability** (Live / Coming Soon / Leaving Soon + the scheduled date — already built; this redesign just gives it a proper home and inline preview of the badge the customer will see)
5. Monetization (PPV toggle + price)

Two-column on wide screens, sticky save bar, validate on blur (`inline-validation`), progressive disclosure for advanced/SEO fields (`progressive-disclosure`).

**Live Studio / Creator Hub** — status-forward layout (live indicator, viewer count, stream health) using the same status tokens.

**Payments / Analytics** — `DataTable` for transactions with tabular currency; charts follow the chart rules (legends, tooltips, empty + loading states, accessible palette, `aria` summary — `loading-chart`, `empty-data-state`, `screen-reader-summary`).

## 7. Accessibility & responsive

- Contrast ≥ 4.5:1 on the dark surfaces for body text, ≥ 3:1 for large/glyphs; verify the orange-on-dark and status colors independently (`color-accessible-pairs`).
- Visible focus rings, full keyboard nav, focus moves to main on route change (`focus-states`, `focus-on-route-change`).
- Status never by color alone — always dot **plus** label (`color-not-only`).
- Respect `prefers-reduced-motion`; transitions 150–300ms (`reduced-motion`, `duration-timing`).
- Breakpoints 768 / 1024 / 1440: sidebar → sheet, tables → horizontal scroll, two-col forms → single (`breakpoint-consistency`, `table-handling`).

## 8. Phased rollout

Ship behind the existing shell so nothing breaks mid-flight.

1. **Foundation (week 1).** Token file (brand + status + scale), `StatusBadge`, `PageHeader`, `EmptyState`, `ConfirmDialog`. Retro-fit `StatusBadge` into Movies/Series/PPV first — instant consistency win, low risk.
2. **Navigation (week 1–2).** shadcn grouped `Sidebar` + topbar + breadcrumbs + real routes per screen + ⌘K palette. Keep all existing panels mounted; only the chrome and routing change.
3. **Data layer (week 2–3).** `DataTable` with sort + bulk actions; migrate Movies, then Series, Users, Payments, Invoices, Tickets onto it.
4. **Forms (week 3–4).** `FormSection` refactor of movie/series forms, sticky save bar, blur validation, Availability section with live badge preview.
5. **Dashboards & polish (week 4+).** Metric cards, "Needs attention" (incl. availability transitions), chart standards, accessibility/responsive QA pass against the §7 checklist.

Each phase is independently shippable and reversible. Start at phase 1 + 2 for the biggest perceived jump (grouped nav + one status system) with the least risk.
