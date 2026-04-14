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
- Important: if `existing_db_instance_identifier` is used, Terraform already knows how to derive a fresh `DATABASE_URL` from the live RDS master secret. Prefer that path over hard-coding stale database credentials in tfvars or task env.
