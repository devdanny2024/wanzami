output "alb_dns" {
  value = local.alb_dns_name
}

output "cloudfront_domain" {
  value = var.media_bucket_name != "" ? aws_cloudfront_distribution.media[0].domain_name : ""
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
