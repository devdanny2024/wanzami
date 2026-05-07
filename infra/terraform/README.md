# Wanzami EU-North-1 Infrastructure (Terraform)

This Terraform config provisions:
- ECR repos (backend + workers)
- ECS cluster + task definitions + services
- ALB + target group + HTTP/HTTPS listeners
- CloudWatch log groups
- Optional Route53 + ACM for api domain
- Optional S3 + CloudFront for media CDN
- SSM Parameter Store entries for environment variables
- Backend container health check now depends on `/health`, which verifies database connectivity before reporting healthy

## Prereqs
- AWS credentials configured for the new account
- IAM roles created:
  - ecsTaskExecutionRole
  - ecsTaskRole
- VPC + subnets already created
- Security groups:
  - wanzami-alb-sg
  - wanzami-ecs-sg

## Setup
1) Copy the example tfvars:
```
cp terraform.tfvars.example terraform.tfvars
```
2) Fill in secrets in `terraform.tfvars` (DO NOT COMMIT).
3) Optional: set `api_domain` + `api_zone_id` for Route53 + ACM.
4) Optional: set `media_bucket_name` for S3 + CloudFront.

## Apply
```
terraform init
terraform apply -auto-approve
```

## Outputs
- ALB DNS
- CloudFront domain (if enabled)
- ECR repo URLs

## Notes
- ECS services default to 0.25 vCPU / 512 MB.
- Backend listens on port 4000 and health check hits /api/health.
- HTTPS listener is only created if api_domain is set.
- Secrets are stored in SSM Parameter Store (plaintext). For higher security, use Secrets Manager.
- Permanent DB fix: when `existing_db_instance_identifier` is set, ECS tasks now receive `DB_HOST` / `DB_PORT` / `DB_NAME` as regular env vars and `DB_USER` / `DB_PASSWORD` directly from the live RDS master secret at task start. Do not hard-code `DATABASE_URL` into task definitions, tfvars, or checked-in JSON artifacts.
- S3 playback fix: use `S3_BUCKET = wanzami-media-eu-576393818319` for the eu-north-1 account and do not inject static `S3_ACCESS_KEY` / `S3_SECRET_KEY` into ECS task env. Let the ECS task role provide credentials.
- Secret rotation fix: Terraform also provisions an EventBridge -> Lambda hook that forces a new ECS deployment for the backend and workers after `PutSecretValue`, `UpdateSecret`, or `RotationSucceeded` events on the DB secret, so rotated credentials are picked up automatically.
- Important: the EventBridge rule uses Secrets Manager events delivered via CloudTrail. Make sure management events are being delivered to EventBridge in this AWS account.
