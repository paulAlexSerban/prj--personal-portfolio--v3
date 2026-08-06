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

  # Local state for now (deliberate choice for the first test environment).
  # State is gitignored - see infrastructure/aws/envs/test/README.md before
  # running terraform on a second machine, and for the migration path to a
  # shared S3+DynamoDB backend once this env graduates past "test".
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
    Environment = "test"
    ManagedBy   = "terraform"
  }
}

# Portfolio stack (module name kept as static_site so existing state is not moved).
module "static_site" {
  source = "../../modules/static-site"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name         = var.domain_name
  hosted_zone_id      = var.hosted_zone_id
  tags                = local.tags
  basic_auth_enabled  = true
  basic_auth_username = var.basic_auth_username
  basic_auth_password = var.basic_auth_password
}

module "static_site_blog" {
  source = "../../modules/static-site"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name         = var.blog_domain_name
  hosted_zone_id      = var.hosted_zone_id
  tags                = local.tags
  basic_auth_enabled  = true
  basic_auth_username = var.basic_auth_username
  basic_auth_password = var.basic_auth_password
}

module "static_site_quiz" {
  source = "../../modules/static-site"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name         = var.quiz_domain_name
  hosted_zone_id      = var.hosted_zone_id
  tags                = local.tags
  basic_auth_enabled  = true
  basic_auth_username = var.basic_auth_username
  basic_auth_password = var.basic_auth_password
  # Quiz is an SPA - map 403/404 to index.html instead of a static 404 page.
  not_found_response_page = "/index.html"
}

module "static_site_news" {
  source = "../../modules/static-site"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name         = var.news_domain_name
  hosted_zone_id      = var.hosted_zone_id
  tags                = local.tags
  basic_auth_enabled  = true
  basic_auth_username = var.basic_auth_username
  basic_auth_password = var.basic_auth_password
}

module "github_oidc_deploy_role" {
  source = "../../modules/github-oidc-deploy-role"

  github_org           = var.github_org
  github_repo          = var.github_repo
  github_environment   = "test"
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
