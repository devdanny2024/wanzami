terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# --------------------
# ECR
# --------------------
data "aws_ecr_repository" "backend" {
  count = var.use_existing_ecr ? 1 : 0
  name  = "wanzami-backend"
}

data "aws_ecr_repository" "worker_transcode" {
  count = var.use_existing_ecr ? 1 : 0
  name  = "wanzami-worker-transcode"
}

data "aws_ecr_repository" "worker_cron" {
  count = var.use_existing_ecr ? 1 : 0
  name  = "wanzami-worker-cron"
}

resource "aws_ecr_repository" "backend" {
  count                = var.use_existing_ecr ? 0 : 1
  name                 = "wanzami-backend"
  image_scanning_configuration { scan_on_push = true }
  force_delete         = true
}

resource "aws_ecr_repository" "worker_transcode" {
  count                = var.use_existing_ecr ? 0 : 1
  name                 = "wanzami-worker-transcode"
  image_scanning_configuration { scan_on_push = true }
  force_delete         = true
}

resource "aws_ecr_repository" "worker_cron" {
  count                = var.use_existing_ecr ? 0 : 1
  name                 = "wanzami-worker-cron"
  image_scanning_configuration { scan_on_push = true }
  force_delete         = true
}

# --------------------
# CloudWatch Logs
# --------------------
data "aws_cloudwatch_log_group" "backend" {
  count = var.use_existing_log_groups ? 1 : 0
  name  = "/ecs/wanzami-backend"
}

data "aws_cloudwatch_log_group" "worker_transcode" {
  count = var.use_existing_log_groups ? 1 : 0
  name  = "/ecs/wanzami-worker-transcode"
}

data "aws_cloudwatch_log_group" "worker_cron" {
  count = var.use_existing_log_groups ? 1 : 0
  name  = "/ecs/wanzami-worker-cron"
}

resource "aws_cloudwatch_log_group" "backend" {
  count             = var.use_existing_log_groups ? 0 : 1
  name              = "/ecs/wanzami-backend"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "worker_transcode" {
  count             = var.use_existing_log_groups ? 0 : 1
  name              = "/ecs/wanzami-worker-transcode"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "worker_cron" {
  count             = var.use_existing_log_groups ? 0 : 1
  name              = "/ecs/wanzami-worker-cron"
  retention_in_days = 14
}

# --------------------
# ECS Cluster
# --------------------
resource "aws_ecs_cluster" "main" {
  name = "wanzami-cluster"
}

# --------------------
# SSM Parameters (Env Vars)
# --------------------
resource "aws_ssm_parameter" "env" {
  for_each  = var.env_vars
  name      = "/wanzami/${each.key}"
  type      = "String"
  value     = each.value
  overwrite = true
}

# --------------------
# IAM Roles (existing)
# --------------------
data "aws_iam_role" "ecs_execution" {
  name = var.ecs_execution_role_name
}

data "aws_iam_role" "ecs_task" {
  name = var.ecs_task_role_name
}

locals {
  backend_env = [
    for k, v in var.env_vars : {
      name  = k
      value = v
    }
  ]
  backend_repo_url = var.use_existing_ecr ? data.aws_ecr_repository.backend[0].repository_url : aws_ecr_repository.backend[0].repository_url
  worker_transcode_repo_url = var.use_existing_ecr ? data.aws_ecr_repository.worker_transcode[0].repository_url : aws_ecr_repository.worker_transcode[0].repository_url
  worker_cron_repo_url = var.use_existing_ecr ? data.aws_ecr_repository.worker_cron[0].repository_url : aws_ecr_repository.worker_cron[0].repository_url
  backend_log_group = var.use_existing_log_groups ? data.aws_cloudwatch_log_group.backend[0].name : aws_cloudwatch_log_group.backend[0].name
  worker_transcode_log_group = var.use_existing_log_groups ? data.aws_cloudwatch_log_group.worker_transcode[0].name : aws_cloudwatch_log_group.worker_transcode[0].name
  worker_cron_log_group = var.use_existing_log_groups ? data.aws_cloudwatch_log_group.worker_cron[0].name : aws_cloudwatch_log_group.worker_cron[0].name
  alb_arn = var.use_existing_alb ? data.aws_lb.alb[0].arn : aws_lb.alb[0].arn
  tg_arn  = var.use_existing_target_group ? data.aws_lb_target_group.backend[0].arn : aws_lb_target_group.backend[0].arn
  alb_dns_name = var.use_existing_alb ? data.aws_lb.alb[0].dns_name : aws_lb.alb[0].dns_name
  alb_zone_id  = var.use_existing_alb ? data.aws_lb.alb[0].zone_id : aws_lb.alb[0].zone_id
}

# --------------------
# Task Definitions
# --------------------
resource "aws_ecs_task_definition" "backend" {
  family                   = "wanzami-backend-task"
  cpu                      = "256"
  memory                   = "512"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = data.aws_iam_role.ecs_execution.arn
  task_role_arn            = data.aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${local.backend_repo_url}:latest"
      essential = true
      portMappings = [
        { containerPort = 4000, hostPort = 4000, protocol = "tcp" }
      ]
      environment = local.backend_env
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = local.backend_log_group
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "worker_transcode" {
  family                   = "wanzami-worker-transcode"
  cpu                      = "256"
  memory                   = "512"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = data.aws_iam_role.ecs_execution.arn
  task_role_arn            = data.aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "worker-transcode"
      image     = "${local.worker_transcode_repo_url}:latest"
      essential = true
      environment = local.backend_env
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = local.worker_transcode_log_group
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "worker_cron" {
  family                   = "wanzami-worker-cron"
  cpu                      = "256"
  memory                   = "512"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = data.aws_iam_role.ecs_execution.arn
  task_role_arn            = data.aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "worker-cron"
      image     = "${local.worker_cron_repo_url}:latest"
      essential = true
      environment = local.backend_env
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = local.worker_cron_log_group
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

# --------------------
# ALB + Target Group
# --------------------
data "aws_lb" "alb" {
  count = var.use_existing_alb ? 1 : 0
  name  = "wanzami-backend-alb"
}

resource "aws_lb" "alb" {
  count              = var.use_existing_alb ? 0 : 1
  name               = "wanzami-backend-alb"
  load_balancer_type = "application"
  subnets            = var.public_subnets
  security_groups    = [var.alb_sg_id]
}

data "aws_lb_target_group" "backend" {
  count = var.use_existing_target_group ? 1 : 0
  name  = var.backend_tg_name
}

resource "aws_lb_target_group" "backend" {
  count    = var.use_existing_target_group ? 0 : 1
  name     = var.backend_tg_name
  port     = 4000
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/api/health"
    interval            = 30
    healthy_threshold   = 2
    unhealthy_threshold = 2
    matcher             = "200"
  }
}

resource "aws_lb_listener" "http" {
  count             = var.use_existing_alb ? 0 : 1
  load_balancer_arn = local.alb_arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = local.tg_arn
  }
}

data "aws_lb_listener" "http_existing" {
  count             = var.use_existing_alb ? 1 : 0
  load_balancer_arn = local.alb_arn
  port              = 80
}

resource "aws_lb_listener_rule" "api_forward" {
  count        = var.use_existing_alb ? 1 : 0
  listener_arn = data.aws_lb_listener.http_existing[0].arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = local.tg_arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# HTTPS listener + ACM cert
resource "aws_acm_certificate" "api" {
  count             = var.api_domain != "" ? 1 : 0
  domain_name       = var.api_domain
  validation_method = "DNS"
}

resource "aws_route53_record" "api_cert_validation" {
  for_each = var.api_domain != "" ? {
    for dvo in aws_acm_certificate.api[0].domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  } : {}

  zone_id = var.api_zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.value]
}

resource "aws_acm_certificate_validation" "api" {
  count                   = var.api_domain != "" ? 1 : 0
  certificate_arn         = aws_acm_certificate.api[0].arn
  validation_record_fqdns = [for r in aws_route53_record.api_cert_validation : r.fqdn]
}

resource "aws_lb_listener" "https" {
  count             = var.api_domain != "" ? 1 : 0
  load_balancer_arn = local.alb_arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-Res-PQ-2025-09"
  certificate_arn   = aws_acm_certificate_validation.api[0].certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = local.tg_arn
  }
}

# Route53 A record for API
resource "aws_route53_record" "api" {
  count   = var.api_domain != "" ? 1 : 0
  zone_id = var.api_zone_id
  name    = var.api_domain
  type    = "A"

  alias {
    name                   = local.alb_dns_name
    zone_id                = local.alb_zone_id
    evaluate_target_health = true
  }
}

# --------------------
# ECS Services
# --------------------
resource "aws_ecs_service" "backend" {
  count           = var.use_existing_backend_service ? 0 : 1
  name            = var.backend_service_name
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnets
    security_groups  = [var.ecs_sg_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = local.tg_arn
    container_name   = "backend"
    container_port   = 4000
  }
}

resource "aws_ecs_service" "worker_transcode" {
  count           = var.use_existing_worker_transcode_service ? 0 : 1
  name            = var.worker_transcode_service_name
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker_transcode.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnets
    security_groups  = [var.ecs_sg_id]
    assign_public_ip = false
  }
}

resource "aws_ecs_service" "worker_cron" {
  count           = var.use_existing_worker_cron_service ? 0 : 1
  name            = var.worker_cron_service_name
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker_cron.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnets
    security_groups  = [var.ecs_sg_id]
    assign_public_ip = false
  }
}

# --------------------
# S3 + CloudFront (media)
# --------------------
resource "aws_s3_bucket" "media" {
  count  = var.media_bucket_name != "" ? 1 : 0
  bucket = var.media_bucket_name
}

resource "aws_cloudfront_distribution" "media" {
  count = var.media_bucket_name != "" ? 1 : 0

  enabled             = true
  default_root_object = ""

  origin {
    domain_name = aws_s3_bucket.media[0].bucket_regional_domain_name
    origin_id   = "media-s3"
  }

  default_cache_behavior {
    target_origin_id       = "media-s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
