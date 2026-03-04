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

  # Required for ALBRequestCountPerTarget autoscaling + ALB/TG alarms
  alb_arn_suffix = join("/", slice(split("/", local.alb_arn), 1, length(split("/", local.alb_arn))))
  tg_arn_suffix  = join("/", slice(split("/", local.tg_arn), 1, length(split("/", local.tg_arn))))
}

# --------------------
# Task Definitions
# --------------------
resource "aws_ecs_task_definition" "backend" {
  family                   = "wanzami-backend-task"
  cpu                      = tostring(var.backend_task_cpu)
  memory                   = tostring(var.backend_task_memory)
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
  cpu                      = tostring(var.worker_task_cpu)
  memory                   = tostring(var.worker_task_memory)
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
  cpu                      = tostring(var.worker_task_cpu)
  memory                   = tostring(var.worker_task_memory)
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
  idle_timeout       = var.alb_idle_timeout_seconds
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
    path                = "/health"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200-299"
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
  count                              = var.use_existing_backend_service ? 0 : 1
  name                               = var.backend_service_name
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.backend.arn
  desired_count                      = var.backend_desired_count
  launch_type                        = "FARGATE"
  health_check_grace_period_seconds  = 90
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

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
  desired_count   = var.worker_transcode_desired_count
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
  desired_count   = var.worker_cron_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnets
    security_groups  = [var.ecs_sg_id]
    assign_public_ip = false
  }
}

# --------------------
# Backend autoscaling
# Works for both newly created and pre-existing ECS backend service.
# --------------------
resource "aws_appautoscaling_target" "backend_service" {
  count              = var.enable_backend_autoscaling ? 1 : 0
  max_capacity       = var.backend_autoscale_max_capacity
  min_capacity       = var.backend_autoscale_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${var.backend_service_name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "backend_cpu_target" {
  count              = var.enable_backend_autoscaling ? 1 : 0
  name               = "wanzami-backend-cpu-target"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend_service[0].resource_id
  scalable_dimension = aws_appautoscaling_target.backend_service[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend_service[0].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = var.backend_cpu_target_utilization

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    scale_in_cooldown  = var.backend_scale_in_cooldown_seconds
    scale_out_cooldown = var.backend_scale_out_cooldown_seconds
  }
}

resource "aws_appautoscaling_policy" "backend_memory_target" {
  count              = var.enable_backend_autoscaling ? 1 : 0
  name               = "wanzami-backend-memory-target"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend_service[0].resource_id
  scalable_dimension = aws_appautoscaling_target.backend_service[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend_service[0].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = var.backend_memory_target_utilization

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }

    scale_in_cooldown  = var.backend_scale_in_cooldown_seconds
    scale_out_cooldown = var.backend_scale_out_cooldown_seconds
  }
}

resource "aws_appautoscaling_policy" "backend_alb_request_target" {
  count              = var.enable_backend_autoscaling && var.enable_backend_alb_request_autoscaling ? 1 : 0
  name               = "wanzami-backend-alb-req-target"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend_service[0].resource_id
  scalable_dimension = aws_appautoscaling_target.backend_service[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend_service[0].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = var.backend_alb_request_target_per_target

    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${local.alb_arn_suffix}/${local.tg_arn_suffix}"
    }

    scale_in_cooldown  = var.backend_scale_in_cooldown_seconds
    scale_out_cooldown = var.backend_scale_out_cooldown_seconds
  }
}

# --------------------
# CloudWatch alarms (backend/API resilience)
# --------------------
resource "aws_cloudwatch_metric_alarm" "alb_5xx_high" {
  count               = var.enable_backend_alarms ? 1 : 0
  alarm_name          = "wanzami-alb-5xx-high"
  alarm_description   = "ALB 5XX errors are above threshold"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = var.alarm_alb_5xx_sum_threshold
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.alarm_sns_topic_arns
  ok_actions          = var.alarm_sns_topic_arns

  dimensions = {
    LoadBalancer = local.alb_arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "target_response_time_high" {
  count               = var.enable_backend_alarms ? 1 : 0
  alarm_name          = "wanzami-target-response-time-high"
  alarm_description   = "Backend target response time is above threshold"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = var.alarm_target_response_time_seconds
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.alarm_sns_topic_arns
  ok_actions          = var.alarm_sns_topic_arns

  dimensions = {
    LoadBalancer = local.alb_arn_suffix
    TargetGroup  = local.tg_arn_suffix
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
