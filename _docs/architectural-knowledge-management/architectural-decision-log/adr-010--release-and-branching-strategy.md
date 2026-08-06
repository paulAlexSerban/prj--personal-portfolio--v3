# ADR-010: Release, Branching, and CI/CD Strategy

## Status: Accepted (2026-07-27)

## Context

The monorepo already uses conventional commits (commitlint + commitizen), an empty
Changesets scaffold, and a continuous **dev** deploy to GitHub Pages on every push
to `main`. stage and production hosting are not chosen yet; an earlier AWS
S3/CloudFront plan is explicitly **not** being implemented. We need a clear
branching model, semantic versioning for private packages, and GitHub Actions
pipelines that can promote a build through **dev → stage → production** without
baking in a specific host.

## Decision

### Branching (trunk-based)

- Single long-lived branch: **`main`**.
- Short-lived feature branches (`feat/…`, `fix/…`, `chore/…`, …) merge via PR.
- No `develop`, `release/*`, or `hotfix/*` branches. Hotfixes are normal PRs into
  `main` and follow the same promotion path.
- **Dev** = continuous deployment of every `main` push (existing
  `.github/workflows/deploy-dev.yaml` → GitHub Pages).
- **stage / production** = promoted only when a Changesets **Version Packages**
  PR is merged (version bump + tags), not on every commit.

### Versioning (Changesets, internal-only)

- Use **Changesets** for per-package SemVer bumps and changelogs.
- All workspace packages are `private: true`. Nothing is published to npm.
- CI tags via `npx @changesets/cli tag` (git tags `pkg-name@version` only).
- `.changeset/config.json` sets `privatePackages: { version: true, tag: true }`
  and `baseBranch: main`.
- Contributors run `pnpm release:add` on PRs that change versioned packages; CI
  checks for a changeset (`pnpm release:status`).

### Pipelines (GitHub Actions)

| Workflow | Trigger | Role |
| -------- | ------- | ---- |
| `ci.yaml` | PR + push to `main` | Format, typecheck, test, migrate; PR changeset check |
| `deploy-dev.yaml` | Push to `main` | Continuous dev deploy (GitHub Pages) — unchanged |
| `release.yaml` | Push to `main` | Changesets Version PR **or** tag + stage → prod promotion |
| `_build-site.yaml` | `workflow_call` | Reusable ingest → build → merge into `_site/` artifact |

Release promotion rules:

1. Pending changesets → open/update **Version Packages** PR (no stage/prod deploy).
2. Version PR merge → `changeset tag` → build once → deploy **stage** (placeholder).
3. Same **site-bundle** artifact promoted to **production** (GitHub Environment
   approval gate; placeholder deploy until a host is chosen).

### GitOps practices

- Git (commits + tags) is the only deploy trigger — no click-ops deploys.
- GitHub Environments (`stage`, `production`, existing `github-pages`) hold
  future secrets/vars and protection rules.
- Promote the built artifact; do not rebuild for production.
- Versions, changelogs, and tags live in git for auditability.

## Consequences

- Stage/prod deploy steps are stubs until a hosting provider is selected; only
  the build/package path is production-ready.
- Manual GitHub setup is required: branch protection on `main` (required checks
  `quality`, `changeset-check`), Environments `stage` and `production` (prod
  with required reviewers).
- Draft ADRs that assumed Turbo + Cloudflare Pages for CI/CD/hosting are
  superseded for release/branching; hosting remains TBD.

## Supersedes (draft)

- `_drafts/adr-000--ci-cd.md` (Turbo + Cloudflare Pages deploy sketches) — for
  branching/release/CI structure only; hosting remains undecided.

## See also

- Workflows: `.github/workflows/{ci,release,deploy-dev,_build-site}.yaml`
- Changesets: `.changeset/`
- Scripts: `pnpm release:add|status|version|tag`
