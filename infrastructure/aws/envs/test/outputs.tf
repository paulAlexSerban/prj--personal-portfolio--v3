output "bucket_name" {
  value = module.static_site.bucket_name
}

output "cloudfront_distribution_id" {
  value = module.static_site.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  value = module.static_site.cloudfront_domain_name
}

output "site_url" {
  value = module.static_site.site_url
}

output "github_actions_role_arn" {
  description = "IAM role ARN for the deploy-test GitHub Actions workflow (set as AWS_DEPLOY_ROLE_ARN)."
  value       = module.github_oidc_deploy_role.role_arn
}
