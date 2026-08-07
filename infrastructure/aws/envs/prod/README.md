# Production environment - Route 53 -> CloudFront -> S3 (per-app)

Provisions **four** independent static-hosting stacks under the `paulserban.eu`
zone, plus a single GitHub Actions OIDC deploy role that can sync/invalidate all
of them. Production uses **live** content (private content-repo sync) and is
**public** (no HTTP Basic Auth).

```
paulserban.eu           -> CloudFront -> S3 (portfolio)
blog.paulserban.eu      -> CloudFront -> S3 (blog)
quiz.paulserban.eu      -> CloudFront -> S3 (quiz SPA)
news-feed.paulserban.eu -> CloudFront -> S3 (news)

ACM certs live in us-east-1 (DNS-validated against the shared hosted zone).

GitHub Actions (environment:production)
  -- OIDC token --> IAM role (gha-deploy-paulserban.eu)
                     -> s3:* on all four buckets
                     -> cloudfront:CreateInvalidation on all four distributions
```

Module code lives in [`../../modules/static-site`](../../modules/static-site)
and [`../../modules/github-oidc-deploy-role`](../../modules/github-oidc-deploy-role).
This directory wires four `static_site*` module instances (portfolio uses the
module name `static_site` for consistency with `envs/test` / `envs/stage`).

Each site still uses the CloudFront viewer-request function for Astro
directory-index rewrites (`trailingSlash: "always"`); Basic Auth is left
disabled (module default).

## Prerequisites

- Terraform >= 1.6.
- An AWS account with an existing **Route 53 public hosted zone for `paulserban.eu`**.
  Find its zone ID with:
    ```bash
    aws route53 list-hosted-zones-by-name --dns-name paulserban.eu
    ```
- The **test** environment OIDC provider already applied (`envs/test` with
  `create_oidc_provider = true`). Prod sets `create_oidc_provider = false` and
  looks up that existing provider - only one IAM OIDC provider for
  `token.actions.githubusercontent.com` can exist per AWS account.
- An AWS identity with permissions for S3, CloudFront, ACM, Route 53, and IAM
  (role only; OIDC provider already exists) for the one-off manual apply.
- Before the first apply, confirm the production CNAMEs are not already attached
  to another CloudFront distribution:
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
cd infrastructure/aws/envs/prod
cp terraform.tfvars.example terraform.tfvars   # fill in hosted_zone_id
terraform init
terraform plan
terraform apply
```

ACM DNS validation and CloudFront distribution creation can take 10-20 minutes on
first apply (longer when creating four stacks at once).

After `apply` succeeds, capture the outputs - CI needs them:

```bash
terraform output
```

## Wiring up CI (`.github/workflows/release.yaml`)

The `release` workflow does **not** run Terraform - it assumes this stack already
exists. After stage deploys succeed, it builds each app **root-relative** (`base: /`)
against **live** content (private content-repo sync; `content_source` defaults to
`live`) with production URLs baked in, then deploys the four dist folders in
parallel to their own buckets. Auth uses **GitHub OIDC** (short-lived credentials
via `sts:AssumeRoleWithWebIdentity`); there are no long-lived AWS access keys.

### Human approval gate

Create a GitHub **Environment** named `production-approval` and enable
**Required reviewers** on it (`Settings -> Environments -> production-approval
-> Protection rules`). The `approve-prod` job in `release.yaml` targets this
environment, so the workflow pauses after stage succeeds until a reviewer
approves. Deploy jobs use a separate `production` environment so you only
approve once (not once per app).

### Deploy environment

Configure a GitHub **Environment** named `production` with:

**Variables** (`Settings -> Environments -> production -> Variables`):

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

Also ensure the repo secret `CONTENT_REPO_TOKEN` is available so live content sync
can clone the private content repository during the build.

No AWS secrets are required. Each deploy job has `permissions: id-token: write` so
GitHub can mint an OIDC token; the IAM role trust policy only allows
`repo:paulAlexSerban/prj--personal-portfolio--v3:environment:production`.

### OIDC provider note

Only one IAM OIDC provider for `token.actions.githubusercontent.com` can exist per
AWS account. The **test** env creates it (`create_oidc_provider = true`). This prod
env defaults to `create_oidc_provider = false` and looks up that existing provider.
Do not flip it to `true` unless the test stack (and its provider) has been destroyed.

## Destroying

```bash
terraform destroy
```

Note this deletes the S3 buckets (must be empty - `terraform destroy` does not empty
them first), the CloudFront distributions/DNS records, and the GitHub Actions deploy
role. It does **not** delete the shared OIDC provider (prod did not create it).
