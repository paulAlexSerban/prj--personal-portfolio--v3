# Test environment - Route 53 → CloudFront → S3

Provisions a single static-hosting stack for `test.paulserban.eu`, plus a
GitHub Actions OIDC deploy role so CI can sync to S3 and invalidate CloudFront
without long-lived AWS access keys:

```
Route 53 (A/AAAA alias) -> CloudFront (OAC + Basic Auth) -> S3 (private bucket)
                              ^
                        ACM cert (us-east-1, DNS-validated)
                        CloudFront Function (viewer-request HTTP Basic Auth)

GitHub Actions (environment:test)
  -- OIDC token --> IAM role (gha-deploy-test.paulserban.eu)
                     -> s3:ListBucket / GetObject / PutObject / DeleteObject
                     -> cloudfront:CreateInvalidation
```

The test site is gated by **HTTP Basic Auth** at CloudFront (viewer-request Function).
Set `basic_auth_username` / `basic_auth_password` in `terraform.tfvars` (gitignored).
Credentials are baked into the Function code at apply time — rotate by changing
tfvars and re-applying.
Module code lives in [`../../modules/static-site`](../../modules/static-site)
and [`../../modules/github-oidc-deploy-role`](../../modules/github-oidc-deploy-role).
This directory just wires them up with `test.paulserban.eu`-specific inputs.

## Prerequisites

- Terraform >= 1.6.
- An AWS account with an existing **Route 53 public hosted zone for `paulserban.eu`**.
  Find its zone ID with:
  ```bash
  aws route53 list-hosted-zones-by-name --dns-name paulserban.eu
  ```
- An AWS identity (user/role) with permissions for S3, CloudFront, ACM, Route 53,
  and IAM (OIDC provider + role) for the one-off manual apply.

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
first apply.

After `apply` succeeds, capture the outputs - CI needs them:

```bash
terraform output
```

## Wiring up CI (`.github/workflows/deploy-test.yaml`)

The `deploy-test` workflow does **not** run Terraform - it assumes this stack already
exists and only uploads the built site + invalidates the CloudFront cache. Auth uses
**GitHub OIDC** (short-lived credentials via `sts:AssumeRoleWithWebIdentity`); there
are no long-lived AWS access keys.

Configure a GitHub **Environment** named `test` with:

**Variables** (`Settings -> Environments -> test -> Variables`):

| Name                         | Value                                         | Source                     |
| ---------------------------- | --------------------------------------------- | -------------------------- |
| `AWS_REGION`                 | e.g. `us-east-1`                              | same as `aws_region` above |
| `S3_BUCKET_NAME`             | `terraform output bucket_name`                |                            |
| `CLOUDFRONT_DISTRIBUTION_ID` | `terraform output cloudfront_distribution_id` |                            |
| `AWS_DEPLOY_ROLE_ARN`        | `terraform output github_actions_role_arn`    |                            |

No AWS secrets are required. The workflow job has `permissions: id-token: write` so
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

Note this deletes the S3 bucket (must be empty - `terraform destroy` does not empty it
first), the CloudFront distribution/DNS records, and the GitHub Actions deploy role
(and OIDC provider, if this env created it).
