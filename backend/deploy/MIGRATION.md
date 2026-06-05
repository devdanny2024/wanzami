# Wanzami — AWS → VPS + Cloudflare R2 migration runbook

Move the backend off AWS (ECS Fargate + ALB + RDS + ElastiCache + S3/CloudFront)
onto a **single VPS** running `docker-compose`, with **media on Cloudflare R2**.
Target cost ~**$35–55/mo** vs ~**$145/mo** today.

## Target architecture
```
                Cloudflare (DNS + free CDN + TLS)
                          │
        api.wanzami.tv ───┤                       media.wanzami.tv
                          │                              │
   ┌──────────────────────┴───────────────┐        Cloudflare R2
   │  VPS  (docker compose)                │     (S3-compatible bucket,
   │  Caddy ─► backend :4000               │      FREE egress, ~171 GB)
   │          worker-cron                  │            ▲
   │          worker-transcode (ffmpeg) ───┼────────────┘ writes HLS to R2
   │          postgres   redis             │
   └────────────────────────────────────────┘
```
The repo already supports this with **config only** — `S3_ENDPOINT` + `forcePathStyle`
(`src/upload/s3.ts`, `src/config.ts`) make the S3 SDK talk to R2; `FFMPEG_PATH`,
`REDIS_TLS`, single `DATABASE_URL`, optional `MEDIA_CDN_BASE`. The only image change
is installing **ffmpeg** (done in `deploy/Dockerfile`).

## Files in this folder
- `Dockerfile` — app image (repo Dockerfile + ffmpeg).
- `docker-compose.yml` — postgres, redis, backend, worker-cron, worker-transcode, caddy.
- `Caddyfile` — TLS + reverse proxy (replaces the ALB).
- `.env.vps.example` — copy to `.env`, fill in.

---

## Phase 0 — prerequisites
- A VPS. **Test first on a free Webdock box**; production on **Hetzner** (CCX/CPX, ~8 vCPU / 16 GB / ~240 GB — transcoding wants vCPU).
- A **Cloudflare** account (R2 enabled) and the `wanzami.tv` domain on Cloudflare DNS.
- `aws --profile new` access (read-only here) to copy data + env values.
- `rclone` installed locally or on the VPS.

## Phase 1 — provision the VPS
```bash
# install Docker + compose plugin
curl -fsSL https://get.docker.com | sh
# clone the backend
git clone git@github.com:devdanny2024/wanzami.git && cd wanzami
cp deploy/.env.vps.example deploy/.env   # then edit deploy/.env
```

## Phase 2 — Cloudflare R2 (media storage)
1. Cloudflare → R2 → **Create bucket** `wanzami-media`.
2. R2 → **Manage API tokens** → create an **S3-compatible** token (Object Read & Write).
   You get an Access Key ID + Secret + the endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
3. (Optional CDN domain) R2 bucket → Settings → **Public access / custom domain** →
   `media.wanzami.tv`. Put that in `MEDIA_CDN_BASE`. Leave blank to use presigned URLs.
4. Fill `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION=auto` in `.env`.

## Phase 3 — copy media S3 → R2 (~171 GB, one-time)
```bash
# rclone remotes: "awss3" (uses AWS profile new) and "r2"
rclone config create awss3 s3 provider AWS env_auth true region eu-north-1
AWS_PROFILE=new rclone sync awss3:wanzami-media-eu-576393818319 r2:wanzami-media \
  --transfers 32 --checkers 64 --fast-list --progress
```
Re-run the same `sync` just before cutover to catch new uploads (it's incremental).

## Phase 4 — copy the database RDS → local Postgres
RDS is **not public**, so dump from inside the VPC: start the existing
`wanzami-db-migrator-temp` EC2 (same VPC/SG as RDS) or a temporary bastion, then:
```bash
# on the in-VPC host (creds: SecretsManager rds!db-... or RDS master user)
pg_dump -h <rds-endpoint> -U <master-user> -d wanzami -Fc -f wanzami.dump
# copy wanzami.dump to the VPS, then after `docker compose up` brings postgres up:
docker compose -f deploy/docker-compose.yml cp wanzami.dump postgres:/tmp/
docker compose -f deploy/docker-compose.yml exec postgres \
  pg_restore -U wanzami -d wanzami --clean --if-exists /tmp/wanzami.dump
```
(If you prefer, skip the dump and let `prisma migrate deploy` build a fresh schema —
only do that if you don't need existing data.)

## Phase 5 — fill `deploy/.env`
Pull the current secret VALUES from ECS and map them in:
```bash
aws ecs describe-task-definition --task-definition wanzami-backend-task \
  --query 'taskDefinition.containerDefinitions[0].environment' --profile new
```
Map every key into `deploy/.env` (see `.env.vps.example`). Change `DATABASE_URL`,
`REDIS_URL`, the `S3_*` block (→ R2), and the origin/callback URLs.

## Phase 6 — build & start
```bash
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
docker compose -f deploy/docker-compose.yml logs -f backend   # watch migrate + boot
```
`backend` runs `prisma migrate deploy` then starts the API; workers attach to Redis.

## Phase 7 — DNS + TLS (Cloudflare)
- `api.wanzami.tv` → A record → VPS IP. For Caddy to issue the cert, either grey-cloud
  this record OR use Cloudflare **Full (strict)** SSL.
- `media.wanzami.tv` → R2 custom domain (orange-cloud, cached).
- Caddy auto-issues Let's Encrypt for `API_DOMAIN`. (Test box: `API_DOMAIN=:80`, plain HTTP.)

## Phase 8 — rewire external services (don't skip)
- **Paystack** dashboard → webhook URL + callback → `https://api.wanzami.tv/...`.
- **Flutterwave** dashboard → webhook + `FLW_CALLBACK_URL`.
- **Google OAuth** console → add `GOOGLE_REDIRECT_URI` for the new domain.
- **Client apps** → all hardcode `https://api.blvckcode.io/api` as a fallback. Repoint + rebuild:
  - **Admin** (Next.js, `D:\Work\wanzami\Admin`): env-only — set `NEXT_PUBLIC_API_BASE` + `NEXT_PUBLIC_MEDIA_CDN_BASE`, rebuild. (hardcoded fallbacks in LiveStudio.tsx:76, CreatorHub.tsx:140)
  - **Web** (Next.js, `D:\Work\wanzami\Wanzami`): set `NEXT_PUBLIC_API_BASE` + image CDN envs **and edit `scripts/fetch-remotion-posters.mjs:6`** (hardcodes the ALB DNS), rebuild.
  - **Mobile** (Flutter): rebuild with `--dart-define=API_BASE_URL=...`; **code-edit the Google OAuth callback** in `login_page.dart:88` + `register_page.dart:43` (hardcoded `api.blvckcode.io/.../google/mobile-callback`).
  - **TV/Tablet** (Flutter): rebuild with `--dart-define=APP_ENV=prod --dart-define=API_BASE_URL=...` (defaults in `app_env.dart:5-6`).

## Phase 9 — verify before cutover
- [ ] `GET https://api.wanzami.tv/` reachable through Caddy (TLS valid).
- [ ] Login / Google OAuth works; admin login works.
- [ ] Browse catalogue; **VOD playback** of an existing title (HLS from R2) works.
- [ ] Upload a test title → transcode worker produces HLS renditions in R2 `vod/...`.
- [ ] A test **Paystack/Flutterwave** payment + webhook is received.
- [ ] cron worker runs its scheduled jobs (check logs).

## Phase 10 — cutover & rollback
- Final `rclone sync` (Phase 3) + final DB dump (Phase 4) during a short freeze.
- Flip DNS to the VPS. Watch logs.
- **Rollback:** DNS still has the old ALB/CloudFront targets — repoint back; AWS stays
  intact until Phase 11.

## Phase 11 — decommission AWS (after a stable verification window)
ECS services → desired count 0 → delete; delete ALB + target groups; delete RDS
(final snapshot first); delete ElastiCache; keep S3 until R2 is confirmed, then delete;
delete CloudFront; remove ECR images. Keep the account/Route53 if `wanzami.tv` stays there.

---

## Audit specifics (from the 2026-06-04 sweep — use these exact values)
- **RDS is PUBLICLY ACCESSIBLE** → no bastion needed for `pg_dump`. Endpoint:
  `wanzami-pg-eu-prod-new.cxqkieuw4d8k.eu-north-1.rds.amazonaws.com:5432`, db `wanzami`,
  master user `wanzami`. Password = Secrets Manager `rds!db-892c9b27-...` (rotates every
  7 days — **next rotation 2026-06-09**, so dump before then or pin a snapshot). To reach it,
  add the VPS IP to RDS security group **`sg-0e2686178685ed388`** (port 5432), or run
  `pg_dump` from this machine if its IP is already allowlisted.
- **Take a manual RDS snapshot before cutover** — automated retention is only 1 day.
- **Media sync source creds:** use `aws --profile new` for `rclone` (or the app's static S3
  key already in the worker task defs). Pull all live secret values for `.env` with:
  `aws ecs describe-task-definition --task-definition wanzami-backend-task --query 'taskDefinition.containerDefinitions[0].environment' --profile new`
- **Email worker:** there is also a BullMQ `email` queue + `dist/worker/emailWorker.js`.
  ECS ran only 3 services, so it's started in-process — confirm which (index.js vs cron.js)
  and ensure transactional email still flows on the VPS (add a `worker-email` service if not).
- **SMTP** today = Gmail `smtp.gmail.com:465`, user `wanzamitv@gmail.com` + app password
  (from task def). Gmail may challenge the new VPS IP — keep the app password / allow it.
- **Redis** on ElastiCache requires TLS; the VPS uses a *fresh* local Redis (no data to
  migrate — BullMQ state is transient), so `REDIS_TLS=false` is correct.
- **DNS reality:** the API domain is **`api.blvckcode.io`** (ACM/clients use it), NOT
  wanzami.tv. The Route53 `wanzami.tv` zone is empty (NS/SOA only) — web frontends are hosted
  elsewhere (Vercel-style). At cutover repoint **api.blvckcode.io** → VPS (wherever that DNS
  lives) and the media domain → Cloudflare R2.
- **Decommission extras:** EventBridge rule `wanzami-db-secret-rotation` + Lambda
  `wanzami-db-rotation-force-redeploy` (redeploys ECS on secret rotation) become irrelevant
  post-migration; 2 stopped EC2 (`i-03c3...`, `i-0cc0...`) can be deleted; rotate the
  hardcoded S3 key `AKIATEVS5PZ6YNNKWV7G` that was exposed in task defs.

## Cost (rough monthly)
| | AWS now | VPS + R2 |
|---|---|---|
| Compute | Fargate ~$90 + ALB ~$22 | VPS ~$30–50 |
| Postgres | RDS ~$16 | included |
| Redis | ElastiCache ~$13 | included |
| Storage | S3 ~$4 | R2 ~$3 |
| CDN/egress | CloudFront (grows w/ viewers) | Cloudflare free + **R2 $0 egress** |
| **Total** | **~$145+/mo** | **~$35–55/mo** |

## Notes / risks
- **HA:** one VPS = single point of failure (Fargate ran 2 API tasks). Fine at current
  near-zero traffic + snapshots; add a 2nd VPS + load balancer when you scale.
- **Transcode CPU:** can starve the API on a shared box — cap `worker-transcode` CPUs
  and/or `TRANSCODE_CONCURRENCY`, or move it to its own VPS later.
- **Backups:** you now own them — cron `pg_dump` offsite + R2 is already durable.
- **Live (IVS):** dormant today; if you launch live later it needs a self-hosted RTMP→HLS
  stack (OvenMediaEngine / SRS) — out of scope here.
