# Wanzami Backend Scaling & High Availability

## Goals

- Avoid single points of failure for the API.
- Keep costs low but predictable.
- Make deployments repeatable (no manual SSH changes).
- Make recovery from instance issues a 5–10 minute operation.

## Current State (Dec 2025)

- Frontends (Wanzami + Admin) are deployed on Vercel.
- Backend (`wanzami-auth-service`) runs on a single EC2 instance.
- Redis and database run on the same instance.
- Media is in S3, with uploads driven from the Admin dashboard.

## Phase 1 – Hardening the Single Instance

**Why:** Minimal cost, improves operability immediately.

- **Elastic IP**
  - Attach an Elastic IP to the EC2 instance.
  - SSH and API DNS (duckdns) should always point to this Elastic IP.

- **Instance Access**
  - Give the instance an IAM role with `AmazonSSMManagedInstanceCore`.
  - Prefer AWS Systems Manager Session Manager over direct SSH.

- **Backups**
  - Enable daily EBS snapshots for the root volume.
  - If possible, store database data on a dedicated EBS volume and
    give that volume its own snapshot schedule.

- **Health Check**
  - Backend exposes `GET /api/health`.
  - CloudWatch or an external monitor hits this endpoint every minute
    and alerts on sustained 5xx or timeouts.

## Phase 2 – Low-Cost High Availability

Move from a single EC2 to a small, redundant setup:

- Two small EC2 instances in an Auto Scaling Group.
- One small RDS instance for the database.
- Optional: small ElastiCache Redis cluster.
- Application Load Balancer in front of the API.

### Components

1. **Application Load Balancer (ALB)**
   - Listens on port 80/443.
   - Targets: EC2 instances in an Auto Scaling Group on port 4000.
   - Health check: `/api/health`.

2. **Auto Scaling Group (ASG)**
   - Launch template uses an AMI (or base Ubuntu) with Docker installed.
   - User data script:
     ```bash
     #!/bin/bash
     docker pull <your-registry>/wanzami-api:latest
     docker run --restart=always --env-file /etc/wanzami.env -p 4000:4000 <your-registry>/wanzami-api:latest
     ```
   - Instance type: `t4g.small` (or `t4g.micro` if usage is light).
   - Desired capacity: 2, min: 2, max: 4.

3. **Database (RDS)**
   - Engine: PostgreSQL (or MySQL, to match the current schema).
   - Class: `db.t4g.micro`, single-AZ.
   - Automated backups: at least 7 days.
   - Security group allows inbound only from the app instances’ security group.

4. **Redis (optional)**
   - Engine: ElastiCache Redis.
   - Node type: `cache.t4g.micro`, single-AZ.
   - Used for queues and caching; configured in the app via env vars.

5. **Media**
   - Continue using S3 for video and images.
   - CloudFront sits in front for global delivery.

### Deployment Flow

1. Developer pushes to `main` on GitHub.
2. CI builds a Docker image for the backend and pushes it to ECR.
3. ASG launch template references the `:latest` tag.
4. To deploy:
   - Update the launch template version to the new image.
   - Perform a rolling instance refresh in the ASG (or use CodeDeploy).

### Operations Runbook

- **Instance unhealthy**
  - ALB health checks will stop routing to it.
  - ASG will replace failed instances automatically.

- **Database issues**
  - Use RDS automated backups for point-in-time restore.
  - For major upgrades, create a manual snapshot first.

- **Scaling**
  - Adjust ASG desired and max capacity for spikes.
  - If CPU is consistently > 70%, bump instance size or add more capacity.

### Cost Notes

- Start with the smallest classes:
  - `t4g.small` or `t4g.micro` for app instances.
  - `db.t4g.micro` for RDS.
  - `cache.t4g.micro` for ElastiCache if needed.
- Monitor usage for 1–2 months, then consider
  Reserved Instances or Savings Plans to reduce cost.

## Phase 3 – Future Enhancements

- Move app and workers to ECS Fargate for fully managed scaling.
- Add multi-AZ RDS for higher database availability.
- Add centralized logging and dashboards for latency and error rates.

