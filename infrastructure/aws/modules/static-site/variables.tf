variable "domain_name" {
  description = "Fully-qualified domain name the site is served at (e.g. test.paulserban.eu). Also used as the S3 bucket name unless bucket_name is set."
  type        = string
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID that owns domain_name (e.g. the zone for paulserban.eu)."
  type        = string
}

variable "bucket_name" {
  description = "Override for the S3 bucket name. Defaults to domain_name, which is unique enough for a real domain."
  type        = string
  default     = null
}

variable "default_root_object" {
  description = "Default object CloudFront serves for the root of the distribution."
  type        = string
  default     = "index.html"
}

variable "not_found_response_page" {
  description = "Path (served from the bucket) returned for 403/404 responses, so client-side routed apps still get a 200."
  type        = string
  default     = "/404.html"
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_100 = US/Canada/Europe only (cheapest), suitable for a test environment."
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

variable "basic_auth_enabled" {
  description = "If true, attach a CloudFront Function that requires HTTP Basic Auth on every viewer request."
  type        = bool
  default     = false
}

variable "basic_auth_username" {
  description = "HTTP Basic Auth username. Required when basic_auth_enabled is true."
  type        = string
  default     = null
  sensitive   = true
}

variable "basic_auth_password" {
  description = "HTTP Basic Auth password. Required when basic_auth_enabled is true."
  type        = string
  default     = null
  sensitive   = true
}

variable "redirect_rules" {
  description = "Path-prefix redirects issued by the viewer-request function, e.g. old /blog links to the blog.* subdomain."
  type = list(object({
    path_prefix   = string
    target_domain = string
    permanent     = optional(bool, true)
    # When true (default), /blog/foo -> https://blog.../foo. When false, keep the
    # full URI (e.g. /assets/images/x -> https://assets.../assets/images/x).
    strip_prefix  = optional(bool, true)
  }))
  default = []
}
