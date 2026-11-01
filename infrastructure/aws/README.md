# Deprecated

Production, stage, and test hosting for the new AWS account is not provisioned from this directory.

The new account is managed in [`prj--portfolio-platform`](https://github.com/paulAlexSerban/prj--portfolio-platform):

- modules under `modules/terraform/` (`static-site`, `news-data-cdn`, `github-oidc-role`)
- stack `layers/05-workloads/terraform/static-sites`
- cutover runbook `_docs/02--plans/portfolio-cutover.md`

Keep this tree until the old account's stacks have been destroyed. Applying it against the new account will not work: state is local to whichever machine last applied it, the S3 bucket names are the public hostnames and are still taken by the old account, and `create_oidc_provider` assumes the provider was created here.

`deploy-prod.yaml` and `news-sync.yaml` read their AWS targets from GitHub Environment variables. Pointing those variables at the new account is what moves deploys. `deploy-stage.yaml` and `deploy-test.yaml` are unchanged and still target the old account.
