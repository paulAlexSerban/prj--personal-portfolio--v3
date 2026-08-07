variable "aws_region" {
  description = "Primary AWS region for the S3 bucket. CloudFront/ACM always use us-east-1 regardless of this value."
  type        = string
  default     = "eu-central-1"
}

variable "domain_name" {
  description = "Fully-qualified domain name for the portfolio (apex) production site."
  type        = string
  default     = "paulserban.eu"
}

variable "blog_domain_name" {
  description = "Fully-qualified domain name for the blog production site."
  type        = string
  default     = "blog.paulserban.eu"
}

variable "quiz_domain_name" {
  description = "Fully-qualified domain name for the quiz production site."
  type        = string
  default     = "quiz.paulserban.eu"
}

variable "news_domain_name" {
  description = "Fully-qualified domain name for the news-feed production site."
  type        = string
  default     = "news-feed.paulserban.eu"
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
  description = "Whether to create the IAM OIDC provider for GitHub Actions. Only one provider per URL can exist per AWS account; leave false so prod reuses the provider created by the test environment."
  type        = bool
  default     = false
}
