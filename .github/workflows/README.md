# Workflows

| Workflow | Purpose | Triggers | Secrets |
| --- | --- | --- | --- |
| `pr-checks.yaml` | DCO sign-off (`@fonoster.com` exempt), conventional commits (`commitlint.config.cjs`), eslint + prettier | pull requests; push to main (lint only) | none |
| `ci.yaml` | Node build + mocha unit tests, Go Roomr node (gofmt, vet, `go test -race`, libopus), Python SDK + runner, dashboard (typecheck, vitest, Playwright), SDK tarball install on Node 20/22/24; each job runs only when its paths changed | pull requests; push to main; dispatch | none |
| `conformance.yaml` | Conformance suites that need NATS; nightly: timing (T1), load (T2), replay (T3), Pipecat golden test | pull requests on the voice path; nightly 06:00 UTC; dispatch | none |
| `stack-smoke.yaml` | Builds the bundle images and archive (`ops/release/bundle`), installs it with Compose (`ops/release/smoke`); Helm lint, render and kubeconform per values file; dev container build | pull requests on ops/, Dockerfiles, mods/, go/, .devcontainer/; nightly 05:00 UTC; dispatch | none |
| `images.yaml` | Builds and pushes `fonoster/<name>:<version>` (amd64 + arm64) for every entry in `ops/release/images.json` | called by release; dispatch | `DOCKER_HUB_USERNAME`, `DOCKER_HUB_PASSWORD` |
| `release.yaml` | Version (`ops/release/next-release.sh`), npm publish (lerna, dist-tag latest), images, install archive on a draft release, `release-approval` gate, publish | dispatch only | `GH_PAT`, `NPM_TOKEN`, Docker Hub (via images) |
| `site.yaml` | Deploys `site/` to GitHub Pages (fonoster.com); Mintlify broken-link check for `docs-site/` | push to main on site/; pull requests on docs-site/; dispatch | `GITHUB_TOKEN` only |
| `live-providers.yaml` | Live Deepgram/ElevenLabs check (spends a few cents) | dispatch only | `DEEPGRAM_API_KEY`, `ELEVENLABS_API_KEY` |

The image list lives in one place, `ops/release/images.json`: the bundle builds the entries marked
`bundle`, `images.yaml` publishes all of them. Nothing publishes on merge.
