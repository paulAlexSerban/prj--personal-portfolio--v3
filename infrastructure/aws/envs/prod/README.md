# Production environment - Route 53 -> CloudFront -> S3 (per-app)

Provisions **four** independent static-hosting stacks under the `paulserban.eu`
zone, plus a shared **assets CDN** for content-pipeline media, plus a **news JSON
CDN** for the RSS cache, plus GitHub Actions OIDC roles (site deploy + news-sync).
Production uses **live** content (private content-repo sync) and is
**public** (no HTTP Basic Auth).

```
paulserban.eu           -> CloudFront -> S3 (portfolio)
www.paulserban.eu       -> same CloudFront distribution as the apex
blog.paulserban.eu      -> CloudFront -> S3 (blog)
quiz.paulserban.eu      -> CloudFront -> S3 (quiz SPA)
news-feed.paulserban.eu -> CloudFront -> S3 (news HTML shell)
news-data.paulserban.eu -> CloudFront -> S3 (RSS JSON, fetched by the news site at runtime)
assets.paulserban.eu    -> CloudFront -> S3 website (existing assets.paulserban.eu bucket)

ACM certs live in us-east-1 (DNS-validated against the shared hosted zone).
The apex certificate includes `www.paulserban.eu` as a SAN. Adding that SAN
reissues the cert and updates the portfolio distribution; Route 53 overwrites
any leftover v2 `www` alias so it targets the same CloudFront as the apex.

GitHub Actions (environment:production)
  -- OIDC token --> IAM role (gha-deploy-paulserban.eu)
                     -> s3:* on all four site buckets
                     -> cloudfront:CreateInvalidation on all four distributions

GitHub Actions (environment:news-data)
  -- OIDC token --> IAM role (gha-news-sync-paulserban.eu)
                     -> s3:* on the news-data bucket only
                     -> cloudfront:CreateInvalidation on the news-data distribution
```

Content images/icons are written by `content--paulserban.eu` (`npm run push:assets`)
into the existing `assets.paulserban.eu` bucket. Apps load them from
`https://assets.paulserban.eu/assets/...` — site deploys never touch that bucket.

News JSON is written by `.github/workflows/news-sync.yaml` (daily RSS fetch) into
the `news-data.paulserban.eu` bucket. The news-feed site fetches
`https://news-data.paulserban.eu/*.json` in the browser, so new headlines do not
require a site rebuild. Site deploys never touch that bucket.

Module code lives in [`../../modules/static-site`](../../modules/static-site),
[`../../modules/news-data-cdn`](../../modules/news-data-cdn),
[`../../modules/assets-cdn`](../../modules/assets-cdn),
and [`../../modules/github-oidc-deploy-role`](../../modules/github-oidc-deploy-role).
This directory wires four `static_site*` module instances (portfolio uses the
module name `static_site` for consistency with `envs/test` / `envs/stage`).

Each site still uses the CloudFront viewer-request function for Astro
directory-index rewrites (`trailingSlash: "always"`); Basic Auth is left
disabled (module default).

The news-data distribution uses a custom cache policy (`minTTL 0`, `defaultTTL 300`,
`maxTTL 3600`) plus origin `Cache-Control` and a post-sync invalidation so clients
do not keep stale JSON. CORS is `Access-Control-Allow-Origin: *` so GitHub Pages
and localhost can fetch the same files.

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

## Wiring up CI (`.github/workflows/deploy-prod.yaml`)

The `Deploy PRODUCTION` workflow does **not** run Terraform - it assumes this
stack already exists. On `workflow_dispatch` it waits for human approval, then
builds each app **root-relative** (`base: /`) against **live** content (private
content-repo sync; `content_source` defaults to `live`) with production URLs
baked in, then deploys each selected app's dist to its own bucket as soon as
that build finishes (uncheck apps on dispatch to skip them; a one-app run does
not update the others). Auth uses **GitHub OIDC** (short-lived credentials via
`sts:AssumeRoleWithWebIdentity`); there are no long-lived AWS access keys.

Production is independent of staging: you can deploy prod without a prior stage
run.

### Human approval gate

Create a GitHub **Environment** named `production-approval` and enable
**Required reviewers** on it (`Settings -> Environments -> production-approval
-> Protection rules`). The `approve-prod` job in `deploy-prod.yaml` targets this
environment, so the workflow pauses at the start until a reviewer approves.
Deploy jobs use a separate `production` environment so you only approve once
(not once per app).

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

### News-data environment (`.github/workflows/news-sync.yaml`)

The news-sync workflow is **isolated** from site deploys: it does not trigger CI,
release, or Pages. Create a GitHub **Environment** named `news-data` with **no**
required reviewers, and set:

**Variables** (`Settings -> Environments -> news-data -> Variables`):

| Name                                   | Value                                                   | Source                     |
| -------------------------------------- | ------------------------------------------------------- | -------------------------- |
| `AWS_REGION`                           | e.g. `eu-central-1`                                     | same as `aws_region` above |
| `AWS_DEPLOY_ROLE_ARN`                  | `terraform output github_actions_news_sync_role_arn`    |                            |
| `NEWS_DATA_S3_BUCKET_NAME`             | `terraform output news_data_bucket_name`                |                            |
| `NEWS_DATA_CLOUDFRONT_DISTRIBUTION_ID` | `terraform output news_data_cloudfront_distribution_id` |                            |

Also create an empty `news-cache` branch once (the workflow will push cache
commits there, never to `main`):

```bash
git checkout --orphan news-cache
git rm -rf .
git commit --allow-empty -m "chore(news): seed news-cache branch"
git push origin news-cache
git checkout main
```

The news-data IAM role trust policy only allows
`repo:paulAlexSerban/prj--personal-portfolio--v3:environment:news-data`.

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
and news-sync roles. It does **not** delete the shared OIDC provider (prod did not create it).
