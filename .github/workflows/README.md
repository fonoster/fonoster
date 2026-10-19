# Workflows

| Workflow | Purpose | Triggers | Secrets |
| --- | --- | --- | --- |
| `pr-checks.yaml` (PR Checks) | DCO sign-off (`@fonoster.com` exempt), eslint + prettier, Node build + mocha unit tests, Go Roomr node (gofmt, vet, `go test -race`, libopus), Python SDK + runner, dashboard (typecheck, vitest, Playwright), SDK tarball install on Node 20/22/24; each build job runs only when its paths changed. **PR Checks passed** is the gate: it passes when every job passed or was skipped | pull requests; push to main; dispatch | none |
| `pr-title.yaml` (PR Title) | The PR title is a conventional commit (`commitlint.config.cjs`); PRs are squash merged, so the title is the commit on main | pull requests (opened, edited, new commits) | none |
| `conformance.yaml` | Conformance suites that need NATS; nightly: timing (T1), load (T2), replay (T3), Pipecat golden test | pull requests on the voice path; nightly 06:00 UTC; dispatch | none |
| `stack-smoke.yaml` | Builds the bundle images and archive (`ops/release/bundle`), installs it with Compose (`ops/release/smoke`); Helm lint, render and kubeconform per values file; dev container build | pull requests on ops/, Dockerfiles, compose.yaml, package files, .devcontainer/ (code in mods/ and go/ waits for nightly); nightly 05:00 UTC; dispatch | none |
| `images.yaml` | Builds and pushes `fonoster/<name>:<version>` (amd64 + arm64) for every entry in `ops/release/images.json` | called by release; dispatch | `DOCKER_HUB_USERNAME`, `DOCKER_HUB_PASSWORD` |
| `release.yaml` | Version (`.scripts/next-release.sh`), npm publish (lerna, dist-tag latest), images, install archive on a draft release, `release-approval` gate, publish | dispatch only | `GH_PAT`, Docker Hub (via images); npm uses trusted publishing, no token |
| `site.yaml` | Deploys `site/` to GitHub Pages (fonoster.com); Mintlify broken-link check for `docs-site/` | push to main on site/; pull requests on docs-site/; dispatch | `GITHUB_TOKEN` only |
| `live-providers.yaml` | Live Deepgram/ElevenLabs check (spends a few cents) | dispatch only | `DEEPGRAM_API_KEY`, `ELEVENLABS_API_KEY` |

Required checks on main: **PR Checks passed** and **conventional PR title**.

The image list lives in one place, `ops/release/images.json`: the bundle builds the entries marked
`bundle`, `images.yaml` publishes all of them. Nothing publishes on merge.
