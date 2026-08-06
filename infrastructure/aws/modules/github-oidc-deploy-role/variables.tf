variable "github_org" {
  description = "GitHub organization or user that owns the repository."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name (without the org prefix)."
  type        = string
}

variable "github_environment" {
  description = "GitHub Environment name that is allowed to assume this role (e.g. test)."
  type        = string
}

variable "create_oidc_provider" {
  description = "Whether to create the IAM OIDC provider for token.actions.githubusercontent.com. Only one provider per URL can exist per AWS account; set to false when a later environment reuses an existing provider."
  type        = bool
  default     = true
}

variable "role_name" {
  description = "Name of the IAM role GitHub Actions will assume."
  type        = string
}

variable "s3_bucket_arns" {
  description = "ARNs of the S3 buckets the role may sync into."
  type        = list(string)
}

variable "cloudfront_distribution_arns" {
  description = "ARNs of the CloudFront distributions the role may invalidate."
  type        = list(string)
}

variable "tags" {
  description = "Tags applied to IAM resources created by this module."
  type        = map(string)
  default     = {}
}
