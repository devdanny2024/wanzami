output "alb_dns" {
  value = aws_lb.alb.dns_name
}

output "cloudfront_domain" {
  value = var.media_bucket_name != "" ? aws_cloudfront_distribution.media[0].domain_name : ""
}

output "ecr_backend" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecr_worker_transcode" {
  value = aws_ecr_repository.worker_transcode.repository_url
}

output "ecr_worker_cron" {
  value = aws_ecr_repository.worker_cron.repository_url
}
