output "portfolio_bucket_name" {
  value = module.static_site.bucket_name
}

output "portfolio_cloudfront_distribution_id" {
  value = module.static_site.cloudfront_distribution_id
}

output "portfolio_site_url" {
  value = module.static_site.site_url
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
