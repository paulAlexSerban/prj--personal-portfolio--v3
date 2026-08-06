# Test environment - Route 53 → CloudFront → S3 (per-app)

Provisions **four** independent static-hosting stacks under the `paulserban.eu`
zone, plus a single GitHub Actions OIDC deploy role that can sync/invalidate all
of them:

```
test.paulserban.eu           -> CloudFront (Basic Auth) -> S3 (portfolio)
test.blog.paulserban.eu      -> CloudFront (Basic Auth) -> S3 (blog)
test.quiz.paulserban.eu      -> CloudFront (Basic Auth) -> S3 (quiz SPA)
test.news-feed.paulserban.eu -> CloudFront (Basic Auth) -> S3 (news)

ACM certs live in us-east-1 (DNS-validated against the shared hosted zone).

GitHub Actions (environment:test)
  -- OIDC token --> IAM role (gha-deploy-test.paulserban.eu)
                     -> s3:* on all four buckets
                     -> cloudfront:CreateInvalidation on all four distributions
```

Module code lives in [`../../modules/static-site`](../../modules/static-site)
and [`../../modules/github-oidc-deploy-role`](../../modules/github-oidc-deploy-role).
This directory wires four `static_site*` module instances (portfolio keeps the
historical module name `static_site` so existing Terraform state is not moved).

Each site is gated by the same **HTTP Basic Auth** CloudFront Function. Set
`basic_auth_username` / `basic_auth_password` in `terraform.tfvars` (gitignored).

## Prerequisites

- Terraform >= 1.6.
- An AWS account with an existing **Route 53 public hosted zone for `paulserban.eu`**.
  Find its zone ID with:
  ```bash
  aws route53 list-hosted-zones-by-name --dns-name paulserban.eu
  ```
- An AWS identity with permissions for S3, CloudFront, ACM, Route 53, and IAM
  (OIDC provider + role) for the one-off manual apply.
- Before the first apply of the blog/quiz/news stacks, confirm those CNAMEs are
  not already attached to another CloudFront distribution:
  ```bash
  aws cloudfront list-distributions --query "DistributionList.Items[*].{Id:Id,Aliases:Aliases.Items}"
  ```

## State: local, on purpose (for now)

This environment intentionally uses **local Terraform state** (no backend block, so
state is written to `terraform.tfstate` next to these files). That file - along with
`.terraform/` and any real `terraform.tfvars` - is gitignored.

Trade-off: only apply from one machine/person at a time, and keep a backup of
`terraform.tfstate` somewhere safe (it is the only record of what was created). If this
environment grows beyond a single maintainer, or CI needs to run `terraform apply`
itself, migrate to a shared backend (S3 bucket + DynamoDB lock table) before that
happens - the `hashicorp/aws` provider version and module code here don't need to
change, only the `terraform { backend "s3" {...} }` block in `main.tf`.

## Usage (run manually, from your machine)

```bash
cd infrastructure/aws/envs/test
cp terraform.tfvars.example terraform.tfvars   # fill in hosted_zone_id + basic auth
terraform init
terraform plan
terraform apply
```

ACM DNS validation and CloudFront distribution creation can take 10-20 minutes on
first apply (longer when creating three new stacks at once).

After `apply` succeeds, capture the outputs - CI needs them:

```bash
terraform output
```

## Wiring up CI (`.github/workflows/deploy-test.yaml`)

The `deploy-test` workflow does **not** run Terraform - it assumes this stack already
exists. It builds each app **root-relative** (`base: /`) with cross-app absolute URLs,
then deploys the four dist folders in parallel to their own buckets. Auth uses
**GitHub OIDC** (short-lived credentials via `sts:AssumeRoleWithWebIdentity`); there
are no long-lived AWS access keys.

Configure a GitHub **Environment** named `test` with:

**Variables** (`Settings -> Environments -> test -> Variables`):

| Name                                   | Value                                                   | Source                     |
| -------------------------------------- | ------------------------------------------------------- | -------------------------- |
| `AWS_REGION`                           | e.g. `eu-central-1`                                     | same as `aws_region` above |
| `AWS_DEPLOY_ROLE_ARN`                  | `terraform output github_actions_role_arn`              |                            |
| `PORTFOLIO_S3_BUCKET_NAME`             | `terraform output portfolio_bucket_name`                |                            |
| `PORTFOLIO_CLOUDFRONT_DISTRIBUTION_ID` | `terraform output portfolio_cloudfront_distribution_id` |                            |
| `BLOG_S3_BUCKET_NAME`                  | `terraform output blog_bucket_name`                     |                            |
| `BLOG_CLOUDFRONT_DISTRIBUTION_ID`      | `terraform output blog_cloudfront_distribution_id`      |                            |
| `QUIZ_S3_BUCKET_NAME`                  | `terraform output quiz_bucket_name`                     |                            |
| `QUIZ_CLOUDFRONT_DISTRIBUTION_ID`      | `terraform output quiz_cloudfront_distribution_id`      |                            |
| `NEWS_S3_BUCKET_NAME`                  | `terraform output news_bucket_name`                     |                            |
| `NEWS_CLOUDFRONT_DISTRIBUTION_ID`      | `terraform output news_cloudfront_distribution_id`      |                            |

If you previously configured flat `S3_BUCKET_NAME` / `CLOUDFRONT_DISTRIBUTION_ID`
variables, rename them to the `PORTFOLIO_*` equivalents above.

No AWS secrets are required. Each deploy job has `permissions: id-token: write` so
GitHub can mint an OIDC token; the IAM role trust policy only allows
`repo:paulAlexSerban/prj--personal-portfolio--v3:environment:test`.

### OIDC provider note for later environments

Only one IAM OIDC provider for `token.actions.githubusercontent.com` can exist per
AWS account. This env creates it by default (`create_oidc_provider = true`). When
you add stage/prod later, set `create_oidc_provider = false` in those envs so they
look up the existing provider instead of trying to create a second one.

## Destroying

```bash
terraform destroy
```

Note this deletes the S3 buckets (must be empty - `terraform destroy` does not empty
them first), the CloudFront distributions/DNS records, and the GitHub Actions deploy
role (and OIDC provider, if this env created it).
