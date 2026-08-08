variable "domain_name" {
  description = "Public CDN hostname for shared content assets (e.g. assets.paulserban.eu)."
  type        = string
}

variable "bucket_name" {
  description = "Existing S3 bucket that holds content-pipeline output (must already exist; this module does not create it)."
  type        = string
}

variable "bucket_region" {
  description = "AWS region of the assets bucket (used to build the S3 website origin hostname)."
  type        = string
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID that owns domain_name."
  type        = string
}

variable "price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_100"
}

variable "minimum_protocol_version" {
  description = "Minimum TLS version CloudFront accepts from viewers."
  type        = string
  default     = "TLSv1.2_2021"
}

variable "tags" {
  description = "Tags applied to resources created by this module."
  type        = map(string)
  default     = {}
}
