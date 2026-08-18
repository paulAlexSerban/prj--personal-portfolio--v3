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

variable "www_domain_name" {
  description = "www hostname served by the same CloudFront distribution as domain_name."
  type        = string
  default     = "www.paulserban.eu"
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

variable "assets_domain_name" {
  description = "Fully-qualified domain name for the shared content assets CDN."
  type        = string
  default     = "assets.paulserban.eu"
}

variable "assets_bucket_name" {
  description = "Existing S3 bucket that holds content-pipeline asset output (not created by this stack)."
  type        = string
  default     = "assets.paulserban.eu"
}

variable "news_data_domain_name" {
  description = "Fully-qualified domain name for the news JSON CDN (RSS cache files)."
  type        = string
  default     = "news-data.paulserban.eu"
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID for paulserban.eu. Find it with: aws route53 list-hosted-zones-by-name --dns-name paulserban.eu."
  type        = string
}

variable "bing_site_verification_cname_name" {
  description = "Host label for Bing Webmaster Tools CNAME verification. Creates {name}.{host} -> verify.bing.com for each bing_site_verification_hosts entry. Empty string skips the records."
  type        = string
  default     = "2ec0a14cd64662ec65477e7a2a2751e4"
}

variable "bing_site_verification_hosts" {
  description = "Parent hostnames Bing may query as {cname_name}.{host}. Include apex and www because Bing properties are often the www URL."
  type        = list(string)
  default = [
    "paulserban.eu",
    "www.paulserban.eu",
    "blog.paulserban.eu",
    "news-feed.paulserban.eu",
  ]
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
