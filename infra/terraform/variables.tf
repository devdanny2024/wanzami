variable "aws_region" { type = string }
variable "vpc_id" { type = string }
variable "public_subnets" { type = list(string) }
variable "private_subnets" { type = list(string) }
variable "alb_sg_id" { type = string }
variable "ecs_sg_id" { type = string }
variable "ecs_execution_role_name" { type = string }
variable "ecs_task_role_name" { type = string }
variable "env_vars" { type = map(string) }

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
