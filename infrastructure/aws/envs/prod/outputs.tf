output "cf_access_logs_bucket_name" {
  description = "Shared S3 bucket receiving CloudFront standard access logs (all six distributions)."
  value       = aws_s3_bucket.cf_access_logs.bucket
}

output "cf_access_logs_bucket_arn" {
  description = "ARN of the CloudFront access-log bucket (used by observability-hub IAM)."
  value       = aws_s3_bucket.cf_access_logs.arn
}

output "portfolio_bucket_name" {
  value = module.static_site.bucket_name
}

output "portfolio_cloudfront_distribution_id" {
  value = module.static_site.cloudfront_distribution_id
}

output "portfolio_site_url" {
  value = module.static_site.site_url
}

output "portfolio_www_url" {
  description = "www hostname that aliases to the same CloudFront distribution as portfolio_site_url."
  value       = "https://${var.www_domain_name}"
}

output "blog_bucket_name" {
  value = module.static_site_blog.bucket_name
}

output "blog_cloudfront_distribution_id" {
  value = module.static_site_blog.cloudfront_distribution_id
}

output "blog_site_url" {
  value = module.static_site_blog.site_url
}

output "quiz_bucket_name" {
  value = module.static_site_quiz.bucket_name
}

output "quiz_cloudfront_distribution_id" {
  value = module.static_site_quiz.cloudfront_distribution_id
}

output "quiz_site_url" {
  value = module.static_site_quiz.site_url
}

output "news_bucket_name" {
  value = module.static_site_news.bucket_name
}

output "news_cloudfront_distribution_id" {
  value = module.static_site_news.cloudfront_distribution_id
}

output "news_site_url" {
  value = module.static_site_news.site_url
}

output "assets_cloudfront_distribution_id" {
  value = module.assets_cdn.cloudfront_distribution_id
}

output "assets_url" {
  description = "Public HTTPS base for content assets (ASSET_BASE_URL in the apps)."
  value       = module.assets_cdn.assets_url
}

output "github_actions_role_arn" {
  description = "IAM role ARN for the release.yaml production deploy jobs (set as AWS_DEPLOY_ROLE_ARN on the production GitHub Environment)."
  value       = module.github_oidc_deploy_role.role_arn
}

output "news_data_bucket_name" {
  description = "S3 bucket holding RSS cache JSON (set as NEWS_DATA_S3_BUCKET_NAME on the news-data GitHub Environment)."
  value       = module.news_data_cdn.bucket_name
}

output "news_data_cloudfront_distribution_id" {
  description = "CloudFront distribution ID for news JSON (set as NEWS_DATA_CLOUDFRONT_DISTRIBUTION_ID on the news-data GitHub Environment)."
  value       = module.news_data_cdn.cloudfront_distribution_id
}

output "news_data_url" {
  description = "Public HTTPS base for news JSON (PUBLIC_NEWS_DATA_URL in the news-feed site)."
  value       = module.news_data_cdn.news_data_url
}

output "github_actions_news_sync_role_arn" {
  description = "IAM role ARN for news-sync.yaml (set as AWS_DEPLOY_ROLE_ARN on the news-data GitHub Environment)."
  value       = module.github_oidc_news_sync_role.role_arn
}
