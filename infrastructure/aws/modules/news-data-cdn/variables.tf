variable "domain_name" {
  description = "Public CDN hostname for news JSON (e.g. news-data.paulserban.eu). Also used as the S3 bucket name unless bucket_name is set."
  type        = string
}

variable "bucket_name" {
  description = "Override for the S3 bucket name. Defaults to domain_name."
  type        = string
  default     = null
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID that owns domain_name."
  type        = string
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_100 = US/Canada/Europe only (cheapest)."
  type        = string
  default     = "PriceClass_100"
}

variable "minimum_protocol_version" {
  description = "Minimum TLS version CloudFront accepts from viewers."
  type        = string
  default     = "TLSv1.2_2021"
}

variable "tags" {
  description = "Tags applied to all resources created by this module."
  type        = map(string)
  default     = {}
}

variable "access_logging_bucket" {
  description = "S3 bucket domain name (e.g. my-bucket.s3.amazonaws.com) for CloudFront standard access logs. Null disables logging."
  type        = string
  default     = null
}

variable "access_logging_prefix" {
  description = "Prefix inside the access-log bucket for this distribution's logs. Defaults to domain_name/."
  type        = string
  default     = null
}
