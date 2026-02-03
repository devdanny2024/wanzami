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
