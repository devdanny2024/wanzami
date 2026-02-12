# Wanzami Repository

This repository contains the Wanzami platform codebase across web, admin, backend, infrastructure, and mobile clients.

## Project Overview

Wanzami is a streaming platform ecosystem with:

- **User-facing web app** (`Wanzami`) for browsing and watching content
- **Admin dashboard** (`Admin`) for operations and content management
- **Backend API/service** (`backend`) for auth, catalog, uploads, recommendations, payments, support, and live features
- **Infrastructure as code** (`infra/terraform`) for AWS deployment
- **Mobile clients/prototypes**:
  - Flutter app (`wanzami_mobile_flutter`)
  - React/Vite mobile design app (`WANZAMI Mobile Streaming App`)

> This repo is organized as a **multi-project monorepo-style layout** (independent app folders), not a single workspace-managed monorepo package.

---

## Architecture (High-Level)

- **Frontend**: Next.js (web + admin), React/Vite prototype, Flutter mobile app
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Queue/Jobs**: BullMQ + Redis
- **Storage/Media**: S3-compatible storage + FFmpeg processing
- **Live Streaming**: AWS IVS integration
- **Infra**: Terraform to provision AWS ECS/Fargate, ALB, ECR, logs, optional Route53/ACM/CloudFront

### Backend modules (from `backend/src`)

- `routes/`, `controllers/`, `services/`
- `auth/`, `middleware/`
- `queues/`, `jobs/`, `worker/`
- `upload/`, `templates/`, `utils/`

Domain coverage includes auth/session/device management, profiles, titles/episodes/assets/uploads, engagement events and popularity, recommendations/similarity, PPV billing/violations, support tickets, audit/error logs, and live events.

---

## Repository Structure

```text
wanzami/
├─ Admin/                         # Next.js admin dashboard
├─ Wanzami/                       # Next.js user-facing web app
├─ backend/                       # Express + TS API service
├─ infra/terraform/               # AWS Terraform stack
├─ wanzami_mobile_flutter/        # Flutter mobile app (parity slice)
├─ WANZAMI Mobile Streaming App/  # React + Vite mobile design app
├─ routing_plan.md
└─ admin_roles_permissions.md
```

---

## Prerequisites

Install the following locally:

- **Node.js 20+** (CI uses Node 20)
- **npm**
- **PostgreSQL** (for backend)
- **Redis** (for queues/workers)
- **Flutter SDK** (for `wanzami_mobile_flutter`)
- **Terraform + AWS credentials** (for infra/deploy)

Optional but recommended:

- `ffmpeg` binary available in PATH (or configure `FFMPEG_PATH`)

---

## Environment Setup

## 1) Backend env file

```bash
cd backend
cp .env.example .env
```

Set at minimum:

- `DATABASE_URL`
- `PORT` (default 4000)
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `APP_ORIGIN` (web; usually `http://localhost:3000`)
- `ADMIN_APP_ORIGIN` (admin; usually `http://localhost:3001`)

Additional keys (as needed):

- SMTP (`SMTP_*`)
- Google OAuth (`GOOGLE_*`)
- AWS IVS (`AWS_*`, `IVS_*`)
- Payment gateways (Paystack/Flutterwave)
- Redis (`REDIS_URL`)
- S3/media settings

## 2) Frontend env

No committed `.env.example` was found for `Wanzami`/`Admin`. If env vars are needed for API base URL or auth, create local `.env.local` files per app and align values with backend origins/ports.

## 3) Flutter env

Passed at runtime with `--dart-define`:

```bash
flutter run --dart-define=APP_ENV=dev --dart-define=API_BASE_URL=http://localhost:4000/api
```

---

## Installation

Install dependencies in each project independently:

```bash
cd Wanzami && npm ci
cd ../Admin && npm ci
cd ../backend && npm ci
cd "../WANZAMI Mobile Streaming App" && npm install
cd ../wanzami_mobile_flutter && flutter pub get
```

Notes:

- `Wanzami`, `Admin`, and `backend` include lockfiles and are CI-installed with `npm ci`.
- `WANZAMI Mobile Streaming App` currently has no lockfile in-repo, so `npm install` is the safe default.

---

## Running Apps/Services

Use separate terminals.

### 1) Backend API

```bash
cd backend
npm run dev
```

- Starts on `http://localhost:4000` by default
- Health endpoint in code: `GET /health`

### 2) Web App (Wanzami)

```bash
cd Wanzami
npm run dev
```

- Default: `http://localhost:3000`

### 3) Admin App

```bash
cd Admin
npm run dev -- -p 3001
```

- Recommended: run admin on `http://localhost:3001` to match backend env defaults

### 4) Mobile Design App (React/Vite)

```bash
cd "WANZAMI Mobile Streaming App"
npm run dev
```

### 5) Flutter Mobile App

```bash
cd wanzami_mobile_flutter
flutter pub get
flutter run --dart-define=APP_ENV=dev --dart-define=API_BASE_URL=http://localhost:4000/api
```

### 6) Backend workers (after backend build)

```bash
cd backend
npm run build
npm run worker:transcode
npm run worker:cron
```

---

## Quality Commands

Run inside each project folder.

### Wanzami (`Wanzami/`)

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test` *(placeholder: prints no tests defined)*

### Admin (`Admin/`)

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test` *(placeholder: prints no tests defined)*
- `npm run quality:gate` *(PowerShell script)*

### Backend (`backend/`)

- `npm run typecheck`
- `npm run build`
- `npm run test` *(Node test runner with tsx)*

No backend lint script is currently defined in `package.json`.

---

## Key Workflows

## Local development flow

1. Start PostgreSQL + Redis
2. Configure `backend/.env`
3. Install backend deps and run Prisma
4. Start backend (`npm run dev`)
5. Start web and admin apps
6. Start optional workers for async processing

## Prisma workflow (backend)

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

For deployment, CI runs `prisma migrate deploy` inside ECS task.

## Content/recommendation scripts (backend)

Useful maintenance scripts include:

- `npm run seed:titles`
- `npm run jobs:compute-popularity`
- `npm run jobs:compute-embeddings`
- `npm run jobs:compute-similarities`
- `npm run jobs:export-events`
- `npm run jobs:check-guardrails`

---

## Deployment Notes (Inferred from Repo)

## CI

- **Admin CI** (`.github/workflows/admin-ci.yml`): typecheck, lint, build on Admin changes
- **Backend CI** (`.github/workflows/backend-ci.yml`): typecheck, build on backend changes

## Backend deploy pipeline

From `.github/workflows/deploy.yml`:

- Trigger: push to `main` or `new-backend-testing`, or manual dispatch
- Applies Terraform (`infra/terraform`)
- Builds backend Docker image and pushes to ECR
- Registers ECS task definition revisions (API + workers)
- Runs Prisma migrations in ECS task
- Updates ECS services (API, transcode worker, cron worker)

## Terraform stack

`infra/terraform` provisions AWS resources including ECS, ECR, ALB, logs, and optional Route53/ACM/CloudFront.

---

## Troubleshooting

## Backend fails to start

- Confirm `DATABASE_URL` and DB reachability
- Ensure Prisma client is generated:
  - `npm run prisma:generate`
- Verify Redis is running if queue/worker features are used

## Migration/deploy issues

- Check Prisma migration state and DB permissions
- Ensure ECS task networking can reach private DB
- Validate required GitHub secrets (`AWS_ROLE_ARN`, `TERRAFORM_TFVARS`, etc.)

## CORS / frontend API access issues

- Ensure frontend origins and ports are correct (`3000` web, `3001` admin)
- Keep `APP_ORIGIN`/`ADMIN_APP_ORIGIN` aligned in backend env

## Worker/media processing issues

- Ensure `ffmpeg` is installed or `FFMPEG_PATH` is set
- Verify S3/IVS credentials and bucket configuration

## Health check mismatch warning

- Backend code exposes `GET /health`
- Terraform README mentions health check at `/api/health`
- Align this in infrastructure or app routes to avoid false unhealthy checks

---

## Contributor Guide

1. **Pick the target project** (`Wanzami`, `Admin`, `backend`, etc.)
2. **Install dependencies** in that project
3. **Run quality checks** before opening a PR
4. **Keep changes scoped** to the relevant app/service
5. **Update docs** when adding scripts, env vars, or workflows

### Suggested PR checklist

- [ ] Builds successfully
- [ ] Typecheck passes
- [ ] Lint passes (where available)
- [ ] Tests pass (where available)
- [ ] Env/config changes documented
- [ ] Migration implications documented (if Prisma schema changed)

### Branch/deploy awareness

- `main` and `new-backend-testing` trigger backend deploy workflow
- Be careful with infra/backend changes merged into those branches

---

## Quick Command Reference

```bash
# Backend
cd backend
npm ci
cp .env.example .env
npm run prisma:generate
npm run dev

# Web
cd ../Wanzami
npm ci
npm run dev

# Admin
cd ../Admin
npm ci
npm run dev -- -p 3001

# Backend quality
cd ../backend
npm run typecheck
npm run build
npm run test
```

If you want, this README can be expanded later with architecture diagrams, API endpoint catalog, and a single script to boot local services together.
