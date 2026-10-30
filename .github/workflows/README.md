# Workflows

| Workflow | Purpose | Triggers | Secrets |
| --- | --- | --- | --- |
| `pr-checks.yaml` (PR Checks) | DCO sign-off (`@fonoster.com` exempt), eslint + prettier, Node build + mocha unit tests, Python SDK + runner, dashboard (typecheck, vitest, Playwright), SDK tarball install on Node 20/22/24; each build job runs only when its paths changed. **PR Checks passed** is the gate: it passes when every job passed or was skipped | pull requests; push to main; dispatch | none |
| `pr-title.yaml` (PR Title) | The PR title is a conventional commit (`commitlint.config.cjs`); PRs are squash merged, so the title is the commit on main | pull requests (opened, edited, new commits) | none |
| `conformance.yaml` | Conformance suites that need NATS; nightly: timing (T1), load (T2), replay (T3), Pipecat golden test | pull requests on the voice path; nightly 06:00 UTC; dispatch | none |
| `stack-smoke.yaml` | Builds the bundle images and archive (`ops/release/bundle`), installs it with Compose (`ops/release/smoke`); Helm lint, render and kubeconform per values file; dev container build | pull requests on ops/, Dockerfiles, compose.yaml, package files, .devcontainer/ (code in mods/ and go/ waits for nightly); nightly 05:00 UTC; dispatch | none |
| `images.yaml` | Builds and pushes `fonoster/<name>:<version>` (amd64 + arm64) for every entry in `ops/release/images.json` | called by release; dispatch | `DOCKER_HUB_USERNAME`, `DOCKER_HUB_PASSWORD` |
| `deploy.yaml` | Deploys a release to production with the playbook it ships (`fonoster/ansible`): `plan` (environment `production-prepare`, no credential) pins the tag and the archive SHA256 and lints the playbook; after approval in `production`, `apply` runs `ops/ansible/deploy-on-host.sh` over SSH, which prints the `--check --diff` and applies with the host's inventory (`/etc/fonoster/inventory`), and on failure `playbooks/rollback.yml`. Never touches the database | called by release; dispatch with a version (redeploy or move to a version), `host_role` to run the host role too | `DEPLOY_SSH_KEY` in `production`; variables `DEPLOY_HOST`, `DEPLOY_KNOWN_HOSTS` |
| `release.yaml` | Version (`ops/release/next-release.sh`), QA gate, npm publish (lerna, dist-tag latest), images, GitHub release (install archive, notes, QA report, dark and light release cards from `ops/release/release-card`) marked latest, then deploy | push to main (releasable commits only); dispatch retries a release that failed partway | `GH_PAT`, Docker Hub (via images); npm uses trusted publishing, no token |
| `site.yaml` | Deploys `site/` to GitHub Pages (fonoster.com); Mintlify broken-link check for `docs-site/` | push to main on site/; pull requests on docs-site/; dispatch | `GITHUB_TOKEN` only |
| `audit.yaml` (Audit) | `npm audit --omit=dev --audit-level=high`: fails when a shipped dependency has a high or critical advisory; dev tooling is only reported. Backs the README badge | pull requests and pushes to main that change package files; weekly (Mon 12:00 UTC); dispatch | none |

Live provider check (Deepgram, ElevenLabs; spends about a cent), by hand in the dev container:
`DEEPGRAM_API_KEY=… ELEVENLABS_API_KEY=… npm run live-check -w @fonoster/appbridge`.

Required checks on main: **PR Checks passed** and **conventional PR title**.

The image list lives in one place, `ops/release/images.json`: the bundle builds the entries marked
`bundle`, `images.yaml` publishes all of them. Nothing publishes on merge.
