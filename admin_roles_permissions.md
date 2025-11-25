# Admin Roles & Permissions Matrix

## Roles
- **Super Admin**: Full control; can manage roles, feature flags, providers, DRM/CDN, refunds, takedowns, data exports.
- **Content Manager**: Manage movies/series/PPV assets, pricing, availability, artwork; trigger ingest/transcode; catalog curation.
- **Blog Editor**: Manage blog posts, categories, SEO; schedule/publish/unpublish.
- **Moderator**: Resolve reports; hide content/cards; mute/ban users; view limited user context.
- **Support (CS)**: View users/devices/entitlements/playback history; reset sessions; revoke device tokens; reissue entitlements; initiate refunds (needs approval).
- **Finance/Billing**: View and refund payments; wallet/PPV ledgers; settlements; tax/currency rules.
- **Analytics/Marketing**: Dashboards and exports for revenue/engagement/playback/recs; read-only elsewhere.
- **Ops/Tech**: Monitor health/logs/queues; rerun jobs; manage feature flags, WAF/rate limits; read-only finance.

## Access by Admin Section
| Role / Section | Dashboard | Movies/Series/PPV Mgmt | Blog Mgmt | User Mgmt | Payments | Moderation | Analytics | Settings | Ops Tools |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Super Admin | Full | Full | Full | Full | Full | Full | Full | Full | Full |
| Content Manager | View | Full | View | View-limited | View | View flags | Content perf | Feature flags (view) | View jobs |
| Blog Editor | View | No | Full | View-limited | No | View flags | View | No | No |
| Moderator | View | View flags | No | Limited (for actions) | No | Full | View | No | No |
| Support (CS) | View | No | No | Assist (devices/entitlements) | View; initiate refund (needs approval) | Assist | View | No | No |
| Finance/Billing | View | No | No | View | Full (refunds/reports) | No | Revenue | Payments settings | No |
| Analytics/Marketing | View | View | View | View | View | View | Full | No | No |
| Ops/Tech | View | No | No | View | View | View | View | Feature flags, WAF, rate limits | Full (jobs/queues) |

### Notes
- "View" = read-only; "View-limited" = limited fields (PII-reduced) only.
- Refunds: Support initiates, Finance/Super Admin approve.
- Moderation actions (hide, ban) restricted to Moderator/Super Admin; Content Manager can see flags on their assets.
- Settings split: finance (providers, tax/currency) under Finance/Super Admin; feature flags/WAF under Ops/Tech/Super Admin.
- Ops Tools: job retries (transcodes, notifications), queue inspection, error logs.