variable "aws_region" {
  description = "Primary AWS region for the S3 bucket. CloudFront/ACM always use us-east-1 regardless of this value."
  type        = string
  default     = "eu-central-1"
}

variable "domain_name" {
  description = "Fully-qualified domain name for the portfolio (apex) stage site."
  type        = string
  default     = "stage.paulserban.eu"
}

variable "blog_domain_name" {
  description = "Fully-qualified domain name for the blog stage site."
  type        = string
  default     = "stage.blog.paulserban.eu"
}

variable "quiz_domain_name" {
  description = "Fully-qualified domain name for the quiz stage site."
  type        = string
  default     = "stage.quiz.paulserban.eu"
}

variable "news_domain_name" {
  description = "Fully-qualified domain name for the news-feed stage site."
  type        = string
  default     = "stage.news-feed.paulserban.eu"
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID for paulserban.eu. Find it with: aws route53 list-hosted-zones-by-name --dns-name paulserban.eu."
  type        = string
}

variable "github_org" {
  description = "GitHub organization or user that owns the repository."
  type        = string
  default     = "paulAlexSerban"
}

variable "github_repo" {
  description = "GitHub repository name (without the org prefix)."
  type        = string
  default     = "prj--personal-portfolio--v3"
}

variable "create_oidc_provider" {
  description = "Whether to create the IAM OIDC provider for GitHub Actions. Only one provider per URL can exist per AWS account; leave false so stage reuses the provider created by the test environment."
  type        = bool
  default     = false
}

variable "basic_auth_username" {
  description = "HTTP Basic Auth username for the CloudFront viewer-request function (shared across all four stage sites)."
  type        = string
  sensitive   = true
}

variable "basic_auth_password" {
  description = "HTTP Basic Auth password for the CloudFront viewer-request function (shared across all four stage sites)."
  type        = string
  sensitive   = true
}
