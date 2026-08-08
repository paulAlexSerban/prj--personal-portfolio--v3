terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = ">= 5.0"
      configuration_aliases = [aws.us_east_1]
    }
  }
}

locals {
  cloudfront_name_prefix = replace(var.domain_name, ".", "-")
  # Existing bucket is public + website-enabled (content-repo push:assets). Use the
  # website endpoint as a custom origin so we do not overwrite that bucket policy.
  s3_website_origin = "${var.bucket_name}.s3-website.${var.bucket_region}.amazonaws.com"
}

# ---------------------------------------------------------------------------
# ACM certificate (us-east-1 for CloudFront), DNS-validated
# ---------------------------------------------------------------------------

resource "aws_acm_certificate" "assets" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"
  tags              = var.tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.assets.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id         = var.hosted_zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "assets" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.assets.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# ---------------------------------------------------------------------------
# CloudFront (immutable media CDN — no HTML error remapping)
# ---------------------------------------------------------------------------

resource "aws_cloudfront_response_headers_policy" "assets" {
  name    = "${local.cloudfront_name_prefix}-security-headers"
  comment = "HSTS, X-Content-Type-Options, Referrer-Policy for ${var.domain_name}"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    content_type_options {
      override = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
  }
}

resource "aws_cloudfront_distribution" "assets" {
  enabled         = true
  is_ipv6_enabled = true
  aliases         = [var.domain_name]
  price_class     = var.price_class
  comment         = "Shared content assets CDN for ${var.domain_name}"
  tags            = var.tags

  # No default_root_object / custom_error_response: missing objects stay real
  # 404s (avoids ORB from HTML-as-image on the apex site distribution).

  origin {
    domain_name = local.s3_website_origin
    origin_id   = "s3-website-${var.bucket_name}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "s3-website-${var.bucket_name}"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized
    response_headers_policy_id = aws_cloudfront_response_headers_policy.assets.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.assets.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = var.minimum_protocol_version
  }
}

# ---------------------------------------------------------------------------
# Route 53 alias -> CloudFront (overwrite dead v2 CF alias if present)
# ---------------------------------------------------------------------------

resource "aws_route53_record" "assets_a" {
  zone_id         = var.hosted_zone_id
  name            = var.domain_name
  type            = "A"
  allow_overwrite = true

  alias {
    name                   = aws_cloudfront_distribution.assets.domain_name
    zone_id                = aws_cloudfront_distribution.assets.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "assets_aaaa" {
  zone_id         = var.hosted_zone_id
  name            = var.domain_name
  type            = "AAAA"
  allow_overwrite = true

  alias {
    name                   = aws_cloudfront_distribution.assets.domain_name
    zone_id                = aws_cloudfront_distribution.assets.hosted_zone_id
    evaluate_target_health = false
  }
}
