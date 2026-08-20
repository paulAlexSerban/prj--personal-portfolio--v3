terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = ">= 4.0"
    }
  }

  # Local state for now (deliberate choice, same as the test/stage environments).
  # State is gitignored - see infrastructure/aws/envs/prod/README.md before
  # running terraform on a second machine, and for the migration path to a
  # shared S3+DynamoDB backend once this env needs shared apply access.
}

provider "aws" {
  region = var.aws_region
}

# CloudFront + ACM require the certificate to live in us-east-1, regardless
# of which region the rest of the stack runs in.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

locals {
  tags = {
    Project     = "prj--personal-portfolio--v3"
    Environment = "prod"
    ManagedBy   = "terraform"
  }

  # Shared destination for CloudFront standard access logs across all six
  # distributions (site/blog/quiz/news-feed/news-data/assets).
  # Domain-prefixed keys keep logs queryable per distribution.
  cf_access_logs_bucket_name = "cf-access-logs.paulserban.eu"

  # Relative Route 53 names for Bing WMT CNAME checks. Apex stays
  # {hash} so it remains {hash}.paulserban.eu, not a doubled FQDN.
  bing_verification_relative_names = {
    for host in var.bing_site_verification_hosts :
    host => (
      host == var.domain_name
      ? var.bing_site_verification_cname_name
      : "${var.bing_site_verification_cname_name}.${trimsuffix(host, ".${var.domain_name}")}"
    )
  }
}

# ---------------------------------------------------------------------------
# Shared CloudFront access-log bucket (Phase 0 observability)
# ACL-based log delivery requires BucketOwnerPreferred, not BucketOwnerEnforced.
# ---------------------------------------------------------------------------

resource "aws_s3_bucket" "cf_access_logs" {
  bucket = local.cf_access_logs_bucket_name
  tags   = merge(local.tags, { Purpose = "cloudfront-access-logs" })
}

resource "aws_s3_bucket_public_access_block" "cf_access_logs" {
  bucket = aws_s3_bucket.cf_access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "cf_access_logs" {
  bucket = aws_s3_bucket.cf_access_logs.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "cf_access_logs" {
  depends_on = [aws_s3_bucket_ownership_controls.cf_access_logs]
  bucket     = aws_s3_bucket.cf_access_logs.id
  acl        = "log-delivery-write"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cf_access_logs" {
  bucket = aws_s3_bucket.cf_access_logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "cf_access_logs" {
  bucket = aws_s3_bucket.cf_access_logs.id

  rule {
    id     = "expire-access-logs"
    status = "Enabled"

    filter {}

    expiration {
      days = 60
    }
  }
}

module "static_site" {
  source = "../../modules/static-site"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name            = var.domain_name
  alternate_domain_names = [var.www_domain_name]
  hosted_zone_id         = var.hosted_zone_id
  tags                   = local.tags

  access_logging_bucket = aws_s3_bucket.cf_access_logs.bucket_domain_name
  access_logging_prefix = "${var.domain_name}/"

  # v2 blog lived under /blog on the apex; v3 moved it to blog.paulserban.eu.
  # Keep old forum/bookmark links working with a permanent redirect.
  # /assets on the apex redirects to the dedicated assets CDN (full path kept)
  # so previously deployed HTML keeps working until sites are rebuilt.
  redirect_rules = [
    {
      path_prefix   = "/blog"
      target_domain = var.blog_domain_name
    },
    {
      path_prefix   = "/assets"
      target_domain = var.assets_domain_name
      strip_prefix  = false
    }
  ]
}

module "static_site_blog" {
  source = "../../modules/static-site"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name    = var.blog_domain_name
  hosted_zone_id = var.hosted_zone_id
  tags           = local.tags

  access_logging_bucket = aws_s3_bucket.cf_access_logs.bucket_domain_name
  access_logging_prefix = "${var.blog_domain_name}/"
}

module "static_site_quiz" {
  source = "../../modules/static-site"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name    = var.quiz_domain_name
  hosted_zone_id = var.hosted_zone_id
  tags           = local.tags
  # Quiz is an SPA - map 403/404 to index.html with HTTP 200 for client routing.
  not_found_response_page = "/index.html"
  not_found_response_code = 200

  access_logging_bucket = aws_s3_bucket.cf_access_logs.bucket_domain_name
  access_logging_prefix = "${var.quiz_domain_name}/"
}

module "static_site_news" {
  source = "../../modules/static-site"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name    = var.news_domain_name
  hosted_zone_id = var.hosted_zone_id
  tags           = local.tags

  access_logging_bucket = aws_s3_bucket.cf_access_logs.bucket_domain_name
  access_logging_prefix = "${var.news_domain_name}/"
}

# News JSON CDN. Filled by .github/workflows/news-sync.yaml; the news-feed
# site fetches these files at runtime so RSS updates do not require a rebuild.
module "news_data_cdn" {
  source = "../../modules/news-data-cdn"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name    = var.news_data_domain_name
  hosted_zone_id = var.hosted_zone_id
  tags           = merge(local.tags, { Purpose = "news-json" })

  access_logging_bucket = aws_s3_bucket.cf_access_logs.bucket_domain_name
  access_logging_prefix = "${var.news_data_domain_name}/"
}

# Shared content media CDN. Bucket is owned/filled by content--paulserban.eu
# (npm run push:assets); this module only fronts it with CloudFront + DNS.
module "assets_cdn" {
  source = "../../modules/assets-cdn"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name    = var.assets_domain_name
  bucket_name    = var.assets_bucket_name
  bucket_region  = var.aws_region
  hosted_zone_id = var.hosted_zone_id
  tags           = local.tags

  access_logging_bucket = aws_s3_bucket.cf_access_logs.bucket_domain_name
  access_logging_prefix = "${var.assets_domain_name}/"
}

# Bing Webmaster Tools domain verification (IndexNow). Bing looks up
# {hash}.{host} CNAME verify.bing.com for the exact URL added in WMT
# (apex vs www vs a subdomain). This is a DNS check, not HTTP.
moved {
  from = aws_route53_record.bing_site_verification[0]
  to   = aws_route53_record.bing_site_verification["paulserban.eu"]
}

resource "aws_route53_record" "bing_site_verification" {
  for_each = var.bing_site_verification_cname_name == "" ? {} : local.bing_verification_relative_names

  zone_id = var.hosted_zone_id
  name    = each.value
  type    = "CNAME"
  ttl     = 300
  records = ["verify.bing.com"]
}

module "github_oidc_deploy_role" {
  source = "../../modules/github-oidc-deploy-role"

  github_org           = var.github_org
  github_repo          = var.github_repo
  github_environment   = "production"
  create_oidc_provider = var.create_oidc_provider
  role_name            = "gha-deploy-${var.domain_name}"

  s3_bucket_arns = [
    module.static_site.bucket_arn,
    module.static_site_blog.bucket_arn,
    module.static_site_quiz.bucket_arn,
    module.static_site_news.bucket_arn,
  ]
  cloudfront_distribution_arns = [
    module.static_site.cloudfront_distribution_arn,
    module.static_site_blog.cloudfront_distribution_arn,
    module.static_site_quiz.cloudfront_distribution_arn,
    module.static_site_news.cloudfront_distribution_arn,
  ]

  tags = local.tags
}

# Least-privilege role for the isolated news-sync workflow (GitHub Environment
# `news-data`). Can only write the news JSON bucket and invalidate its CDN -
# not the four site buckets.
module "github_oidc_news_sync_role" {
  source = "../../modules/github-oidc-deploy-role"

  github_org           = var.github_org
  github_repo          = var.github_repo
  github_environment   = "news-data"
  create_oidc_provider = false
  role_name            = "gha-news-sync-${var.domain_name}"

  s3_bucket_arns = [
    module.news_data_cdn.bucket_arn,
  ]
  cloudfront_distribution_arns = [
    module.news_data_cdn.cloudfront_distribution_arn,
  ]

  tags = local.tags

  depends_on = [module.github_oidc_deploy_role]
}
