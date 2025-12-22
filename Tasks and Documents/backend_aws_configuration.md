# Wanzami Backend AWS Configuration  
# Last updated: December 22, 2025

This document captures the complete AWS configuration for the Wanzami backend running on Amazon ECS Fargate. It is intended as an operational reference for engineers and on-call responders.

---

## 1. Environments and Regions
- **Primary runtime:** `us-east-2`
- **Object storage:** Media bucket in `eu-north-1` (`wanzami-bucket`)
- **Cache:** Valkey Serverless in `us-east-2` (`wanzami-cache-dbt2pq.serverless.use2.cache.amazonaws.com:6379`, TLS via `rediss://`)
- **Container registry:** ECR repo `807723313643.dkr.ecr.us-east-2.amazonaws.com/wanzami-backend`

---

## 2. Compute: ECS Fargate

### Cluster
- Name: `wanzami-cluster`
- Launch type: Fargate only
- Network mode: `awsvpc`

### Services
1) **API service**
   - Name: `wanzami-backend-service`
   - Task def: `wanzami-backend-task` (rev ≥ 4)
   - Desired count: 2
   - Health check grace: 60s (recommended)
   - Load balancer: ALB `wanzami-backend-alb`, HTTP :80 → TG `wanzami-backend-tg` on port 4000, health path `/health`
   - Security groups:
     - ALB SG: inbound 80 from `0.0.0.0/0`; outbound all
     - Service SG: inbound 4000 from ALB SG; outbound all
   - Subnets: public or private with NAT (current ALB is internet-facing)

2) **Transcode worker**
   - Name: `wanzami-worker-transcode-svc`
   - Task def: `wanzami-worker-transcode`
   - Command: `node dist/worker/transcodeWorker.js`
   - Desired count: 1
   - No load balancer
   - SG: outbound all; inbound not required; Redis SG allows 6379 from this SG; DB SG allows 5432 from this SG
   - Subnets: private preferred (or public + public IP if no NAT)

3) **Cron worker**
   - Name: `wanzami-worker-cron-svc`
   - Task def: `wanzami-worker-cron`
   - Command: `node dist/worker/cron.js`
   - Desired count: 1
   - Networking/SG same as transcode worker

### Task sizes (starting points)
- API: 0.5 vCPU / 1–3 GB
- Transcode: 1 vCPU / 2–4 GB
- Cron: 0.5 vCPU / 1–2 GB
(Adjust via new task def revisions if needed.)

### Logging
- API log group: `/ecs/wanzami-backend` (prefix `backend`)
- Worker log group: `/ecs/wanzami-backend-workers` (prefix `worker`)
- Region: `us-east-2`
- Execution role: `ecsTaskExecutionRole` with CloudWatch logs and ECR pull

---

## 3. Container Images (ECR)
- Repository: `wanzami-backend`
- URI: `807723313643.dkr.ecr.us-east-2.amazonaws.com/wanzami-backend`
- Tagging: `latest` used; digest pinned for stability: `sha256:71041d7a18c29121d4947aa74ff555a41fa755ee035859170adcbeadef47079b`
- Push steps (PowerShell):
  ```powershell
  aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 807723313643.dkr.ecr.us-east-2.amazonaws.com
  docker tag wanzami-backend:latest 807723313643.dkr.ecr.us-east-2.amazonaws.com/wanzami-backend:latest
  docker push 807723313643.dkr.ecr.us-east-2.amazonaws.com/wanzami-backend:latest
  ```

---

## 4. Networking

### VPC
- VPC: `vpc-03582baa8f18a032b` (`172.31.0.0/16`)
- ALB subnets: public subnets in at least two AZs (us-east-2a, us-east-2b)
- Services: use private subnets if NAT is present; otherwise public with public IP

### Security Groups
- **ALB SG (`sg-0d6c860e3c7462d03`)**: inbound TCP 80 from `0.0.0.0/0`; outbound all
- **API/Worker SG**: inbound 4000 only from ALB SG (API only); outbound all
- **Valkey SG**: allow inbound 6379 from API/Worker SG
- **DB SG**: allow inbound 5432 from API/Worker SG

---

## 5. Data Stores

### PostgreSQL
- `DATABASE_URL=postgresql://wanzami:password@<db-host>:5432/wanzami`
- Ensure SG rules permit traffic from ECS service/worker SG.

### Valkey (Redis-compatible)
- Endpoint: `rediss://wanzami-cache-dbt2pq.serverless.use2.cache.amazonaws.com:6379`
- TLS required (`rediss://`)
- SG inbound 6379 from ECS service/worker SG.

### S3
- Media bucket: `wanzami-bucket` (region `eu-north-1`)
- App config:
  - `S3_REGION=eu-north-1`
  - `S3_BUCKET=wanzami-bucket`
  - `S3_ENDPOINT=` (leave blank unless using a custom endpoint)
  - Credentials provided via env/secrets
- Cross-region access: ECS tasks in `us-east-2` access media in `eu-north-1`; expect cross-region latency/egress costs.

### Env file for ECS
- ECS env-file must reside in `us-east-2`. Copy `.env` to a `us-east-2` bucket (e.g., `s3://<us-east-2-bucket>/wanzami_assets/.env`) and grant `ecsTaskExecutionRole` `s3:GetObject` on that object. The media bucket can remain in `eu-north-1`.

---

## 6. Environment Variables (apply to API and workers)
```
PORT=4000
DATABASE_URL=postgresql://wanzami:password@<db-host>:5432/wanzami
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
DEVICE_LIMIT=4
SMTP_HOST=smtp.zoho.com
SMTP_PORT=465
SMTP_USER=mail@wanzami.tv
SMTP_PASS=...
SMTP_FROM=Wanzami <mail@wanzami.tv>
APP_ORIGIN=https://wanzami.vercel.app
ADMIN_APP_ORIGIN=https://wanzami-admin.vercel.app
S3_REGION=eu-north-1
S3_BUCKET=wanzami-bucket
S3_ENDPOINT=
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
REDIS_URL=rediss://wanzami-cache-dbt2pq.serverless.use2.cache.amazonaws.com:6379
UPLOAD_MAX_CONCURRENCY=10
DOWNLOAD_MAX_CONCURRENCY=10
FFMPEG_PATH=
AWS_REGION=eu-north-1
AWS_DEFAULT_REGION=eu-north-1
GOOGLE_CLIENT_ID=306551457195-vssk5g58mjf3r1roo2qob1ftaj541488.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://wanzami.vercel.app/oauth/google/callback
```
(Use Secrets Manager/SSM for sensitive values; override REDIS_URL if using a different cache endpoint.)

---

## 7. Health Checks
- API container health check: `CMD-SHELL, wget -qO- http://localhost:4000/health || exit 1`
- Target group health: HTTP `/health`, port 4000, interval 30s, timeout 5s, healthy/unhealthy threshold 2–3
- Service health check grace period: 60s recommended

---

## 8. Deployments and Rollbacks
- Deployment controller: ECS rolling update with circuit breaker and rollback enabled.
- Min/Max running tasks: 100% / 200% for API.
- To push a new app build:
  1. Build and push new image to ECR (tag `latest` or a version tag).
  2. Create new task definition revision pointing to the tag.
  3. Update the service to the new revision (optionally force new deployment).
- To fix health check failures: verify Redis/DB connectivity, env vars, SG rules, and health check command; adjust grace period; redeploy.

---

## 9. Observability and Logs
- CloudWatch Logs:
  - `/ecs/wanzami-backend` (API)
  - `/ecs/wanzami-backend-workers` (transcode, cron)
- Check health via target group status and `/health` on the ALB.
- Consider adding CloudWatch Alarms on target group UnhealthyHostCount and ECS deployment failures.

---

## 10. Access and IAM
- `ecsTaskExecutionRole`: ECR pull, CloudWatch Logs, and `s3:GetObject` to the us-east-2 env file object.
- Task role: add only if app needs AWS APIs (S3, etc.); scope to least privilege.
- ALB/Target SGs scoped to required sources only (80 from world to ALB; 4000 only from ALB SG to service).

---

## 11. Known Pitfalls / Gotchas
- ECS env-file must be in the same region as the cluster (put a copy of `.env` in us-east-2).
- Health check in alpine images should use `wget`, not `curl`.
- Redis/Valkey must use `rediss://` endpoint and SG must allow 6379 from ECS SGs.
- Port mapping must be 4000:4000 on the API task; workers should have no port mapping.
- Cross-region S3 for media adds latency/egress; keep media in eu-north-1 but be aware of cost.

---

## 12. Runbooks (Quick)
- **API down / TG unhealthy:** Check CloudWatch logs for connection errors; verify REDIS_URL/DB URL; SG rules; health check command; redeploy with correct task def.
- **Workers failing MODULE_NOT_FOUND:** Ensure command is `node dist/worker/...js` and `dist` exists in the image.
- **ECR auth errors:** Ensure IAM user/role has `ecr:GetAuthorizationToken`; re-login and push.
- **Cannot pull env file:** Ensure the file is in us-east-2 and exec role has `s3:GetObject`.

