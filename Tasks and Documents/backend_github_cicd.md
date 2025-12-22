# Backend CI/CD with GitHub Actions and ECS  
# Last updated: December 22, 2025

This guide shows how to set up GitHub Actions to build/push the backend image to ECR and deploy it to ECS (API + workers). It uses GitHub OIDC to assume an AWS IAM role—no long-lived AWS keys in GitHub.

---

## 1) Prerequisites
- ECS cluster/services already running in `us-east-2`:
  - API: service `wanzami-backend-service`, task def family `wanzami-backend-task`
  - Workers: services `wanzami-worker-transcode-svc`, `wanzami-worker-cron-svc`; task defs `wanzami-worker-transcode`, `wanzami-worker-cron`
- ECR repo: `807723313643.dkr.ecr.us-east-2.amazonaws.com/wanzami-backend`
- Env file (if used) stored in an S3 bucket in `us-east-2` and readable by the ECS task execution role
- GitHub repo (replace `<owner>/<repo>` below)

---

## 2) Create IAM role for GitHub OIDC
1. In AWS IAM, create a role (e.g., `github-actions-ecs`) with:
   - **Trusted entity:** Web identity → GitHub
   - **Condition:** Allow only your repo/branch, e.g.:
     ```
     repo:<owner>/<repo>:ref:refs/heads/main
     ```
2. Attach a policy allowing:
   - ECR: `ecr:GetAuthorizationToken`, `ecr:Batch*`, `ecr:PutImage`, `ecr:UploadLayerPart`, `ecr:DescribeRepositories`
   - ECS: `ecs:DescribeClusters`, `ecs:DescribeServices`, `ecs:DescribeTaskDefinition`, `ecs:RegisterTaskDefinition`, `ecs:UpdateService`
   - (Optional) S3 `s3:GetObject` on your env file in `us-east-2`
3. Note the role ARN (e.g., `arn:aws:iam::807723313643:role/github-actions-ecs`).

---

## 3) GitHub repo settings (Secrets/Variables)
In GitHub → Settings → Secrets and variables → Actions:

**Secrets**
- `AWS_ROLE_ARN` = your OIDC role ARN

**Variables**
- `AWS_REGION` = `us-east-2`
- `ECR_REPO` = `807723313643.dkr.ecr.us-east-2.amazonaws.com/wanzami-backend`
- `CLUSTER` = `wanzami-cluster`
- `SERVICE_API` = `wanzami-backend-service`
- `SERVICE_TRANSCODE` = `wanzami-worker-transcode-svc`
- `SERVICE_CRON` = `wanzami-worker-cron-svc`
- (Optional) `TASKDEF_API` = `wanzami-backend-task`
- (Optional) `TASKDEF_TRANSCODE` = `wanzami-worker-transcode`
- (Optional) `TASKDEF_CRON` = `wanzami-worker-cron`

---

## 4) Add workflow file
Create `.github/workflows/deploy.yml` in the repo:

```yaml
name: Deploy backend

on:
  push:
    branches: [main]

env:
  AWS_REGION: ${{ vars.AWS_REGION }}
  ECR_REPO: ${{ vars.ECR_REPO }}
  CLUSTER: ${{ vars.CLUSTER }}
  SERVICE_API: ${{ vars.SERVICE_API }}
  SERVICE_TRANSCODE: ${{ vars.SERVICE_TRANSCODE }}
  SERVICE_CRON: ${{ vars.SERVICE_CRON }}
  TASKDEF_API: ${{ vars.TASKDEF_API || 'wanzami-backend-task' }}
  TASKDEF_TRANSCODE: ${{ vars.TASKDEF_TRANSCODE || 'wanzami-worker-transcode' }}
  TASKDEF_CRON: ${{ vars.TASKDEF_CRON || 'wanzami-worker-cron' }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write   # for OIDC
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push image
        env:
          DOCKER_BUILDKIT: 1
        run: |
          IMAGE_TAG=${GITHUB_SHA}
          docker build -t $ECR_REPO:latest -t $ECR_REPO:$IMAGE_TAG ./backend
          docker push $ECR_REPO:latest
          docker push $ECR_REPO:$IMAGE_TAG

      - name: Update API task def and service
        run: |
          IMAGE="$ECR_REPO:${GITHUB_SHA}"
          TD=$(aws ecs describe-task-definition --task-definition $TASKDEF_API)
          UPDATED=$(echo "$TD" | jq --arg IMG "$IMAGE" '
            .taskDefinition
            | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)
            | .containerDefinitions[0].image = $IMG
          ')
          REV_ARN=$(echo "$UPDATED" | aws ecs register-task-definition --cli-input-json file:///dev/stdin --query 'taskDefinition.taskDefinitionArn' --output text)
          aws ecs update-service --cluster $CLUSTER --service $SERVICE_API --task-definition "$REV_ARN" --force-new-deployment

      - name: Update Transcode worker
        run: |
          IMAGE="$ECR_REPO:${GITHUB_SHA}"
          TD=$(aws ecs describe-task-definition --task-definition $TASKDEF_TRANSCODE)
          UPDATED=$(echo "$TD" | jq --arg IMG "$IMAGE" '
            .taskDefinition
            | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)
            | .containerDefinitions[0].image = $IMG
          ')
          REV_ARN=$(echo "$UPDATED" | aws ecs register-task-definition --cli-input-json file:///dev/stdin --query 'taskDefinition.taskDefinitionArn' --output text)
          aws ecs update-service --cluster $CLUSTER --service $SERVICE_TRANSCODE --task-definition "$REV_ARN" --force-new-deployment

      - name: Update Cron worker
        run: |
          IMAGE="$ECR_REPO:${GITHUB_SHA}"
          TD=$(aws ecs describe-task-definition --task-definition $TASKDEF_CRON)
          UPDATED=$(echo "$TD" | jq --arg IMG "$IMAGE" '
            .taskDefinition
            | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)
            | .containerDefinitions[0].image = $IMG
          ')
          REV_ARN=$(echo "$UPDATED" | aws ecs register-task-definition --cli-input-json file:///dev/stdin --query 'taskDefinition.taskDefinitionArn' --output text)
          aws ecs update-service --cluster $CLUSTER --service $SERVICE_CRON --task-definition "$REV_ARN" --force-new-deployment
```

Notes:
- This workflow swaps only the image in each task definition and registers a new revision; all other settings (env vars, ports, health checks, command overrides) stay unchanged.
- If you have multiple containers per task, adjust the `containerDefinitions` index.
- Ensure the env file (if used) is in a `us-east-2` bucket and the execution role can read it.

---

## 5) Developer onboarding checklist
- Add yourself to the GitHub repo.
- Ensure you have permission to assume the GitHub OIDC role (trust policy includes your repo/branch).
- Set repo Variables/Secrets as listed above.
- On merge to `main`, the workflow will:
  1) Build and push the image to ECR with tags `latest` and the commit SHA.
  2) Register new task def revisions (API, transcode, cron) with the new image.
  3) Update ECS services with `force-new-deployment`.
- To roll back, point the service to an earlier task definition revision from the ECS console or update the workflow to use a previous image tag.

---

## 6) Troubleshooting
- **OIDC/assume-role errors:** Verify `AWS_ROLE_ARN` and IAM trust policy for your repo/branch.
- **ECR push denied:** Confirm the role has ECR permissions and the repo exists.
- **Task fails after deploy:** Check CloudWatch Logs; ensure env vars and Redis/DB connectivity are correct; health checks pass.
- **Env file not loading:** Ensure the env file lives in `us-east-2` and the execution role has `s3:GetObject`.

