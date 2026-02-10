output "alb_dns" {
  value = local.alb_dns_name
}

output "cloudfront_domain" {
  value = var.media_bucket_name != "" ? aws_cloudfront_distribution.media[0].domain_name : ""
}

output "cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "backend_service_name" {
  value = var.backend_service_name
}

output "worker_transcode_service_name" {
  value = var.worker_transcode_service_name
}

output "worker_cron_service_name" {
  value = var.worker_cron_service_name
}

output "taskdef_api_family" {
  value = aws_ecs_task_definition.backend.family
}

output "taskdef_worker_transcode_family" {
  value = aws_ecs_task_definition.worker_transcode.family
}

output "taskdef_worker_cron_family" {
  value = aws_ecs_task_definition.worker_cron.family
}

output "ecr_backend" {
  value = local.backend_repo_url
}

output "ecr_worker_transcode" {
  value = local.worker_transcode_repo_url
}

output "ecr_worker_cron" {
  value = local.worker_cron_repo_url
}
