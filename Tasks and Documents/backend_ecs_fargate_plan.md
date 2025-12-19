# Backend on ECS Fargate – Implementation Plan

This plan moves the backend from a single SSH-managed EC2 instance to a container-based deployment on **ECS Fargate**, fronted by an ALB. It avoids direct SSH into app servers and gives clean, repeatable deployments.

The backend is now dockerised via `backend/Dockerfile`.

---

## 1. Build & Push Backend Image

**Local steps (from `backend/`):**

```bash
cd backend
docker build -t wanzami-backend:latest .
```

**Create ECR repo:**

- AWS Console → ECR → Create repository: `wanzami-backend` (private).

**Tag & push:**

```bash
AWS_ACCOUNT_ID=<your-account-id>
AWS_REGION=eu-north-1
ECR_REPO=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/wanzami-backend

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

docker tag wanzami-backend:latest ${ECR_REPO}:latest
docker push ${ECR_REPO}:latest
```

---

## 2. Create ECS Cluster and Task Definition

### 2.1 Cluster

- ECS → Clusters → **Create cluster** → `Networking only (Fargate)`.
  - Name: `wanzami-cluster`.
  - VPC: same VPC as current backend.
  - Subnets: at least two public subnets (for ALB + tasks).

### 2.2 Task definition (Fargate)

Create a new **Task Definition**:

- Launch type: **Fargate**.
- Task role:
  - IAM role with access to S3, Redis/ElastiCache (if needed), and CloudWatch Logs.
- Task size: start with `0.25 vCPU, 0.5GB` or `0.5 vCPU, 1GB`.
- Container:
  - Image: `${ACCOUNT_ID}.dkr.ecr.eu-north-1.amazonaws.com/wanzami-backend:latest`
  - Port mappings: container port **4000**, protocol TCP.
  - Env vars: all backend `.env` values (DB, JWT secrets, Paystack/Flutterwave, S3, Redis).
  - Logging: send to new CloudWatch Logs group (e.g. `/ecs/wanzami-backend`).

Health check (container):

- Command: `CMD-SHELL`
- Value: `curl -f http://localhost:4000/health || exit 1`
- Interval: 30s, timeout: 5s, retries: 3.

---

## 3. Application Load Balancer + ECS Service

### 3.1 Application Load Balancer

1. EC2 → Load Balancers → Create ALB:
   - Type: Application Load Balancer.
   - Scheme: Internet-facing.
   - Listeners: HTTP 80 (HTTPS 443 later).
   - VPC: same as ECS cluster; subnets: at least two public.
   - Security group: allows HTTP (80) from the internet.

2. Target group:
   - Type: IP (for Fargate).
   - Protocol: HTTP.
   - Port: 4000.
   - Health check path: `/health`.

### 3.2 ECS Service

Create an ECS **service** in `wanzami-cluster`:

- Launch type: Fargate.
- Task definition: the one created above.
- Desired tasks: start with **2**.
- Networking:
  - VPC: same as cluster.
  - Subnets: private or public (if private, ensure NAT for outbound).
  - Security group: allow inbound 4000 from ALB’s security group only.
- Load balancing:
  - Attach to the ALB and target group created above.

Autoscaling (optional initial config):

- Target tracking: scale on CPU 60–70%.
- Min tasks: 2, max: 4.

---

## 4. Cutover from EC2 to ECS

1. Once ECS service is healthy (target group shows **healthy** targets):
   - Note the ALB DNS name: e.g. `wanzami-backend-alb-123456.eu-north-1.elb.amazonaws.com`.

2. Update frontends (Vercel):
   - In **Wanzami** and **Admin** projects, change `AUTH_SERVICE_URL` to:
     - `https://<alb-dns-name>/api`
   - Redeploy both projects.

3. Smoke tests:
   - `https://<alb-dns-name>/health` → should return `{"status":"ok"}`.
   - Login, browse titles, play content, Admin uploads, etc.

4. Once stable:
   - Stop PM2 processes on the old EC2 backend (or stop the instance entirely).
   - Keep the EBS volume and snapshots as backup.

---

## 5. Handling Workers (Transcode + Cron)

Later, split workers into their own ECS services:

- **Transcode worker service**:
  - Same image, but command override: `node dist/worker/transcodeWorker.js`.
  - No load balancer; runs in private subnets.

- **Cron worker service**:
  - Command override: `node dist/worker/cron.js`.

Scale these separately based on queue depth and workload.

---

## 6. Future Enhancements

- Add HTTPS to the ALB via ACM (free TLS certs).
- Move Postgres to RDS and Redis to ElastiCache.
- Introduce IaC (CloudFormation or Terraform) to codify the cluster, task definitions, and ALB.

