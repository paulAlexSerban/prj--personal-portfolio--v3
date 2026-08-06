output "role_arn" {
  description = "ARN of the IAM role GitHub Actions assumes to deploy."
  value       = aws_iam_role.deploy.arn
}

output "oidc_provider_arn" {
  description = "ARN of the GitHub Actions IAM OIDC provider (created or looked up)."
  value       = local.oidc_provider_arn
}
