variable "aws_region" { type = string }
variable "vpc_id" { type = string }
variable "public_subnets" { type = list(string) }
variable "private_subnets" { type = list(string) }
variable "alb_sg_id" { type = string }
variable "ecs_sg_id" { type = string }
variable "ecs_execution_role_name" { type = string }
variable "ecs_task_role_name" { type = string }
variable "env_vars" { type = map(string) }

# Allow renaming resources if prior partial creates exist
variable "backend_tg_name" {
  type    = string
  default = "wanzami-backend-tg"
}

variable "backend_service_name" {
  type    = string
  default = "wanzami-backend-service"
}

variable "worker_transcode_service_name" {
  type    = string
  default = "wanzami-worker-transcode-svc"
}

variable "worker_cron_service_name" {
  type    = string
  default = "wanzami-worker-cron-service"
}

# Skip ECS service creation if they already exist (useful after partial applies without state)
variable "use_existing_backend_service" {
  type    = bool
  default = false
}

variable "use_existing_worker_transcode_service" {
  type    = bool
  default = false
}

variable "use_existing_worker_cron_service" {
  type    = bool
  default = false
}

# Reuse existing resources if they were already created (e.g. after a partial apply)
variable "use_existing_ecr" {
  type    = bool
  default = false
}

variable "use_existing_log_groups" {
  type    = bool
  default = false
}

variable "use_existing_alb" {
  type    = bool
  default = false
}

variable "use_existing_target_group" {
  type    = bool
  default = false
}

# Optional: API domain + Route53
variable "api_domain" {
  type    = string
  default = ""
}

variable "api_zone_id" {
  type    = string
  default = ""
}

# Optional: Media bucket + CloudFront
variable "media_bucket_name" {
  type    = string
  default = ""
}

# --------------------
# Scaling & performance tuning
# --------------------
variable "backend_task_cpu" {
  type    = number
  default = 1024
}

variable "backend_task_memory" {
  type    = number
  default = 2048
}

variable "worker_task_cpu" {
  type    = number
  default = 512
}

variable "worker_task_memory" {
  type    = number
  default = 1024
}

variable "backend_desired_count" {
  type    = number
  default = 1
}

variable "worker_transcode_desired_count" {
  type    = number
  default = 1
}

variable "worker_cron_desired_count" {
  type    = number
  default = 1
}

variable "enable_backend_autoscaling" {
  type    = bool
  default = true
}

variable "backend_autoscale_min_capacity" {
  type    = number
  default = 1
}

variable "backend_autoscale_max_capacity" {
  type    = number
  default = 4
}

variable "backend_cpu_target_utilization" {
  type    = number
  default = 40
}

variable "backend_memory_target_utilization" {
  type    = number
  default = 50
}

variable "enable_backend_alb_request_autoscaling" {
  type    = bool
  default = true
}

variable "backend_alb_request_target_per_target" {
  type    = number
  default = 200
}

variable "backend_scale_in_cooldown_seconds" {
  type    = number
  default = 300
}

variable "backend_scale_out_cooldown_seconds" {
  type    = number
  default = 30
}

variable "enable_backend_alarms" {
  type    = bool
  default = true
}

variable "alarm_sns_topic_arns" {
  type    = list(string)
  default = []
}

variable "alarm_alb_5xx_sum_threshold" {
  type    = number
  default = 25
}

variable "alarm_target_response_time_seconds" {
  type    = number
  default = 2
}

variable "alb_idle_timeout_seconds" {
  type    = number
  default = 60
}
