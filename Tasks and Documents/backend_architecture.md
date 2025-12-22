# Wanzami Backend Architecture  
# Last updated: December 22, 2025

This document describes the architecture for the Wanzami backend across compute, networking, data, observability, and deployment workflows. It complements the AWS configuration guide.

---

## 1. High-Level Overview
- **Frontend clients:** Consumer app (Vercel), Admin app (Vercel) call the backend via ALB.
- **Backend:** Node.js/Express API on ECS Fargate (us-east-2), exposed through an internet-facing ALB.
- **Workers:** Two background workers on ECS Fargate (transcode and cron) without load balancers.
- **Data:** PostgreSQL (primary DB), Valkey Serverless (Redis-compatible cache) in us-east-2, media in S3 (eu-north-1).
- **CI/CD:** Manual build/push to ECR; service updates via ECS task definition revisions.
- **Observability:** CloudWatch Logs for API and workers; ALB target health checks; ECS deployment circuit breaker.

---

## 2. Traffic Flow
1. Client → ALB (HTTP :80) `wanzami-backend-alb-*.us-east-2.elb.amazonaws.com`
2. ALB forwards to target group `wanzami-backend-tg` (HTTP:4000).
3. ECS service `wanzami-backend-service` tasks receive traffic on port 4000.
4. API calls DB (PostgreSQL) and cache (Valkey), and reads/writes media to S3 in eu-north-1.

---

## 3. Compute Components

### API (ECS Fargate)
- Service: `wanzami-backend-service`
- Task def: `wanzami-backend-task`
- Health check: container uses `wget -qO- http://localhost:4000/health || exit 1`; TG health path `/health`.
- Scaling: fixed desired count (2); can add autoscaling later.

### Workers (ECS Fargate, no ALB)
- **Transcode worker:** Command `node dist/worker/transcodeWorker.js`; handles upload/transcode jobs, updates AssetVersion/UploadJob states.
- **Cron worker:** Command `node dist/worker/cron.js`; scheduled jobs (popularity snapshots, guardrails, exports, embeddings/similarities).
- Desired count: 1 each (can scale horizontally if needed).

### Containers
- Image: `807723313643.dkr.ecr.us-east-2.amazonaws.com/wanzami-backend:latest`
- Build: Node 20 Alpine; Prisma client generated at build; TypeScript compiled to `dist`.

---

## 4. Networking and Security
- VPC: `vpc-03582baa8f18a032b` (172.31.0.0/16)
- ALB: internet-facing, in public subnets across at least two AZs.
- Services/Workers: recommended in private subnets with NAT; if no NAT, use public subnets + public IP.
- Security groups:
  - ALB SG: inbound 80 from world; outbound all.
  - API SG: inbound 4000 from ALB SG; outbound all.
  - Workers SG: outbound all; no inbound needed.
  - Valkey SG: inbound 6379 from API/Worker SGs.
  - DB SG: inbound 5432 from API/Worker SGs.

---

## 5. Data Layer

### PostgreSQL
- Primary relational store for users, sessions, titles, episodes, assets, events, audit logs.
- Access via Prisma client; connection string in `DATABASE_URL`.
- SG must allow inbound 5432 from ECS tasks.

### Valkey (Redis-compatible)
- Endpoint: `rediss://wanzami-cache-dbt2pq.serverless.use2.cache.amazonaws.com:6379`
- Used for caching, queues, and transient data (upload jobs, session-like operations).
- TLS required; SG allows 6379 from ECS task SGs.

### S3
- Media bucket: `wanzami-bucket` in `eu-north-1`.
- Stores media assets, exports, and file uploads.
- Cross-region access from `us-east-2`; set `S3_REGION=eu-north-1` and provide keys.
- Performance note: cross-region adds latency/egress; keep if acceptable or consider replication.

### Env File
- ECS env-file feature requires S3 object in same region as cluster. Copy `.env` to a `us-east-2` bucket (e.g., `s3://<us-east-2-bucket>/wanzami_assets/.env`) and grant `ecsTaskExecutionRole` `s3:GetObject`.
- Media bucket can remain in `eu-north-1`.

---

## 6. Application Concerns
- **Routing:** All API routes under `/api`; health at `/health`.
- **Auth:** JWT access/refresh with secrets from env; device limits enforced via env (`DEVICE_LIMIT`).
- **Uploads/Transcode:** Workers manage upload jobs, generate renditions, and update asset status in DB.
- **Cron:** Scheduled maintenance/jobs (popularity, guardrails, exports, embeddings, similarities).
- **Logging:** CloudWatch log groups separated for API and workers.
- **CORS:** Allowed origins include consumer/admin apps; fallback allows all (can tighten later).

---

## 7. Deployment Model
- Build image locally → push to ECR → create new task definition revision → update ECS service.
- Rolling update with circuit breaker and rollback enabled.
- Min/Max running tasks 100%/200% for API.
- Health checks drive rollback; grace period recommended (60s).

---

## 8. Configuration and Secrets
- Prefer AWS Secrets Manager/SSM for secrets (JWTs, DB, SMTP, S3 keys).
- Env variables (API and workers):
  - `PORT`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
  - `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`, `DEVICE_LIMIT`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
  - `APP_ORIGIN`, `ADMIN_APP_ORIGIN`
  - `S3_REGION`, `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
  - `REDIS_URL` (Valkey `rediss://...`)
  - `UPLOAD_MAX_CONCURRENCY`, `DOWNLOAD_MAX_CONCURRENCY`, `FFMPEG_PATH`
  - `AWS_REGION`, `AWS_DEFAULT_REGION`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

---

## 9. Observability and Health
- ALB → Target Group health `/health`
- Container health (API): `wget -qO- http://localhost:4000/health || exit 1`
- Logs: CloudWatch `/ecs/wanzami-backend` and `/ecs/wanzami-backend-workers`
- Suggested alarms: TG UnhealthyHostCount, ECS DeploymentFailed, high 5xx rates.

---

## 10. Failure Modes and Recovery
- **Health check flaps:** Verify Redis/DB connectivity, correct `REDIS_URL`, SG rules, and health check command; redeploy with grace period.
- **MODULE_NOT_FOUND in workers:** Ensure command uses `node dist/worker/...js` and image contains `dist`.
- **ECR auth issues:** Ensure IAM permissions for `ecr:GetAuthorizationToken`; re-login and push.
- **Env file load fails:** Ensure env file exists in a `us-east-2` bucket and exec role has `s3:GetObject`.
- **Cross-region S3 performance:** Expect added latency/egress; consider replication if needed.

---

## 11. Security Posture
- SG least privilege: ALB open on 80; service port only from ALB SG; Redis/DB only from ECS SGs.
- Secrets: store in Secrets Manager/SSM; avoid baking secrets into images.
- TLS: ALB currently HTTP; consider adding HTTPS listener with ACM cert and redirect 80→443.
- Redis: use TLS (`rediss://`).

---

## 12. Scaling Considerations
- API: increase vCPU/Memory and desired count; consider autoscaling on CPU/latency.
- Workers: scale transcode horizontally for job throughput; cron usually 1 instance.
- S3: consider cross-region replication if media egress/latency becomes an issue.
- Cache/DB: monitor and scale Valkey and DB instance accordingly.

---

## 13. Runbooks (Summary)
- **API unhealthy:** Check TG health → CloudWatch logs → verify env/Redis/DB/SG → redeploy.
- **Worker errors:** Check `/ecs/wanzami-backend-workers` logs; verify command and env; ensure Redis/DB access.
- **Cannot load env file:** Verify object in `us-east-2` and exec role permission.
- **ALB no response:** Confirm SG inbound 80, correct listener/target port (4000), tasks healthy.

---

## 14. Future Enhancements
- Add HTTPS listener and redirect HTTP to HTTPS.
- Migrate env secrets to Secrets Manager/SSM parameter references in task defs.
- Add autoscaling policies for API and workers.
- Consider bringing media closer (replication or move to us-east-2) if latency/cost requires.
- Add CloudWatch alarms and dashboards for health/throughput/error rates.

