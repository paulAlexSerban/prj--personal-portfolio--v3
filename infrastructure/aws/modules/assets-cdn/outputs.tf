output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for the assets CDN."
  value       = aws_cloudfront_distribution.assets.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN for the assets CDN."
  value       = aws_cloudfront_distribution.assets.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront-assigned domain name (*.cloudfront.net)."
  value       = aws_cloudfront_distribution.assets.domain_name
}

output "assets_url" {
  description = "Public HTTPS base URL for content assets (matches ASSET_BASE_URL in the apps)."
  value       = "https://${var.domain_name}/assets"
}
