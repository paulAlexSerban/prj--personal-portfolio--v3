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
}

module "static_site" {
  source = "../../modules/static-site"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name    = var.domain_name
  hosted_zone_id = var.hosted_zone_id
  tags           = local.tags

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
  # Quiz is an SPA - map 403/404 to index.html instead of a static 404 page.
  not_found_response_page = "/index.html"
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
