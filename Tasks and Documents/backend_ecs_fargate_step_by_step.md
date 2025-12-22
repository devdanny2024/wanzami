# Backend ECS Fargate Migration – Step‑by‑Step Guide

## 0. Prerequisites

Before you start:

**On your laptop**

- Install Docker Desktop.
- Install and configure AWS CLI (`aws configure`) with your credentials and default region `eu-north-1`.

**In AWS**

- You already have the VPC and subnets from your current EC2 – we’ll reuse them.
- Note your AWS Account ID (top‑right in the AWS console).

Assume region `eu-north-1` everywhere.

---

## 1) Build the backend Docker image

On your machine:

1. Open a terminal in the project root:

   ```bash
   cd "C:\Users\soliu\Downloads\Wanzami TV\backend"
   ```

2. Build the image:

   ```bash
   docker build -t wanzami-backend:latest .
   ```

   This uses `backend/Dockerfile` and should finish without errors.

3. Quickly check it runs:

   ```bash
   docker run --rm -p 4000:4000 wanzami-backend:latest
   ```

   Then open `http://localhost:4000/health` → should return `{"status":"ok"}`.  
   Stop the container with `Ctrl+C`.

---

## 2) Create ECR repository & push image

### 2.1 Create ECR repo

In AWS console:

- Go to **ECR → Repositories**.
- Click **Create repository**.
- Name: `wanzami-backend`
- Visibility: **Private**
- Leave defaults, click **Create repository**.
- On the repo page, copy the URI, e.g.  
  `123456789012.dkr.ecr.eu-north-1.amazonaws.com/wanzami-backend`.

### 2.2 Login to ECR & push

In your terminal (PowerShell or Git Bash):

1. Set variables (replace `123456789012` with your real account id):

   ```bash
   setx AWS_ACCOUNT_ID 123456789012
   setx AWS_REGION eu-north-1
   ```

   Or just remember the values and plug them into the commands below.

2. Login Docker to ECR:

   ```bash
   aws ecr get-login-password --region eu-north-1 ^
     | docker login --username AWS --password-stdin 123456789012.dkr.ecr.eu-north-1.amazonaws.com
   ```

3. Tag the image:

   ```bash
   docker tag wanzami-backend:latest 123456789012.dkr.ecr.eu-north-1.amazonaws.com/wanzami-backend:latest
   ```

4. Push:

   ```bash
   docker push 123456789012.dkr.ecr.eu-north-1.amazonaws.com/wanzami-backend:latest
   ```

After this, ECR should show the `latest` image.

---

## 3) Create ECS Fargate cluster

In AWS console:

1. Go to **ECS → Clusters → Create cluster**.
2. Choose **“Networking only (Powered by AWS Fargate)”**.
3. Name: `wanzami-cluster`.
4. VPC: pick the VPC where your backend/EC2 lives (the one your DuckDNS instance uses).
5. Subnets: choose at least two public subnets in different AZs.
6. Click **Create**.

---

## 4) Create Task Definition (Fargate)

In ECS console:

1. Go to **Task definitions → Create new task definition**.
2. Launch type: **Fargate**.
3. Task definition name: `wanzami-backend-task`.

**Task role**

Create / choose an IAM role that can:

- Read S3 (your bucket),
- Talk to Redis/DB if needed (via security groups),
- Write to CloudWatch Logs.

**Task size**

- CPU: `0.5 vCPU`
- Memory: `1 GB` (you can adjust later).

**Add container**

- Container name: `wanzami-backend`.
- Image: `123456789012.dkr.ecr.eu-north-1.amazonaws.com/wanzami-backend:latest`
- Port mappings: container port **4000**, protocol **tcp**.
- Environment variables: click **Add environment variable** and copy values from your backend `.env`:
  - `PORT=4000`
  - `DATABASE_URL=...`
  - `JWT_ACCESS_SECRET=...`
  - `JWT_REFRESH_SECRET=...`
  - Paystack/Flutterwave/S3/Redis vars, etc.
- Logging:
  - Log driver: `awslogs`.
  - Log group: `/ecs/wanzami-backend` (create new).
  - Region: `eu-north-1`.
  - Stream prefix: `backend`.

**Container health check (optional but nice)**

- Command type: `CMD-SHELL`.
- Command: `curl -f http://localhost:4000/health || exit 1`
- Interval 30s, timeout 5s, retries 3.

Click **Create**.

---

## 5) Create Target Group & Application Load Balancer

### 5.1 Target group

In AWS console:

1. Go to **EC2 → Target groups → Create target group**.
2. Target type: **IP addresses**.
3. Name: `wanzami-backend-tg`.
4. Protocol: **HTTP**, Port: **4000**.
5. VPC: your main VPC.
6. Health checks:
   - Protocol: HTTP.
   - Path: `/health`.
7. Click **Create target group**.

> We don’t register targets manually; ECS will do it.

### 5.2 Application Load Balancer

1. EC2 → **Load balancers → Create load balancer → Application Load Balancer**.
2. Name: `wanzami-backend-alb`.
3. Scheme: **Internet-facing**.
4. IP type: IPv4.
5. Network mapping:
   - VPC: your main VPC.
   - Subnets: the same public subnets you used for the ECS cluster.
6. Security groups:
   - Create/choose one that allows **HTTP 80** from `0.0.0.0/0`.
7. Listeners:
   - HTTP :80 → forward to target group `wanzami-backend-tg`.
8. Click **Create load balancer**.

When it’s ready, note the DNS name, e.g.  
`wanzami-backend-alb-123456.eu-north-1.elb.amazonaws.com`.

---

## 6) Create ECS Service

In ECS console:

1. Go to **Clusters → wanzami-cluster → Services → Create**.
2. Compute options: **Fargate**.
3. Task definition: `wanzami-backend-task` (latest revision).
4. Service name: `wanzami-backend-service`.
5. Desired tasks: **2**.
6. Deployment type: **Rolling update**.

**Networking**

- VPC: your main VPC.
- Subnets: typically private subnets if you have NAT; otherwise use the same public subnets for now.
- Security group:
  - Allow inbound port **4000** from the **ALB security group only**.

**Load balancing**

- Load balancer type: **Application Load Balancer**.
- Select your ALB.
- Container to load balance: `wanzami-backend` on port `4000`.
- Target group: `wanzami-backend-tg`.

Click **Create service**.

Wait until the service shows **2 running tasks**, and in the Target group you see **2 healthy targets**.

Quick test in your browser:

```text
http://<alb-dns-name>/health
```

You should get `{"status":"ok"}`.

---

## 7) Point frontends to the ALB

Now that the backend is behind the ALB, update the frontends.

### 7.1 Wanzami (consumer app)

1. Vercel → Wanzami project → **Settings → Environment Variables**.
2. Set `AUTH_SERVICE_URL` (Production & Preview) to:

   ```text
   https://<alb-dns-name>/api
   ```

3. Save and trigger **Redeploy**.

### 7.2 Admin app

1. Vercel → Admin project → **Settings → Environment Variables**.
2. Set its `AUTH_SERVICE_URL` the same:

   ```text
   https://<alb-dns-name>/api
   ```

3. Save and **Redeploy**.

After deploys finish:

- Test `https://wanzami.vercel.app`:
  - Login, Home, Continue Watching, Title pages, Player.
- Test `https://wanzami-admin.vercel.app`:
  - Login, series/movies management, uploads.

Everything is now talking to ECS, not the old EC2.

---

## 8) Retire the old EC2 (when you’re happy)

Once you’ve used the site for a while and are confident:

- On the old backend EC2:
  - Stop PM2 processes, or just **stop the instance**:
    - EC2 → Instances → select → **Instance state → Stop**.
- Keep its volume & snapshots as safety backup for now.

If you want, you can move the Elastic IP to the ALB instead later, but that’s optional since Vercel talks directly to the ALB DNS.

---

## 9) Later: move workers (transcode + cron)

After the main API is stable:

Workers:
- Transcode worker: processes upload/transcode jobs, writes AssetVersions, updates statuses.
- Cron worker: runs scheduled jobs (popularity snapshots, guardrails, exports, embeddings/similarities, etc.).

Environment variables (same as API; use real endpoints/secrets):
```
PORT=4000
DATABASE_URL=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
DEVICE_LIMIT=4
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
APP_ORIGIN=...
ADMIN_APP_ORIGIN=...
S3_REGION=eu-north-1
S3_BUCKET=...
S3_ENDPOINT=
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
REDIS_URL=rediss://wanzami-cache-dbt2pq.serverless.use2.cache.amazonaws.com:6379
UPLOAD_MAX_CONCURRENCY=10
DOWNLOAD_MAX_CONCURRENCY=10
AWS_REGION=eu-north-1
AWS_DEFAULT_REGION=eu-north-1
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
```

A) Task definitions
- Clone `wanzami-backend-task` into two task defs:
  - `wanzami-worker-transcode`: same env, same image, override command `["node","dist/worker/transcodeWorker.js"]`.
  - `wanzami-worker-cron`: same env, same image, override command `["node","dist/worker/cron.js"]`.
- CPU/Memory: start 1 vCPU / 2–4 GB for transcode; 0.5 vCPU / 1–2 GB for cron (adjust as needed).
- Logging: CloudWatch log group `/ecs/wanzami-backend-workers`, stream prefix `worker`.

B) Services (one per worker)
- Launch type: Fargate; service names `wanzami-worker-transcode-svc`, `wanzami-worker-cron-svc`; desired count = 1.
- No load balancer.
- Networking: VPC `vpc-03582baa8f18a032b`; use private subnets (or public + public IP only if no NAT).
- Security group: allow outbound all; ensure Redis SG allows inbound 6379 from this SG; DB SG allows this SG on 5432; S3 is via public endpoint.
- Optional: set health check grace period to ~60s if startup is slow.

C) After validation
- Verify tasks stay healthy and logs are clean.
- Stop/remove PM2 workers on the old EC2 once these services are stable.

