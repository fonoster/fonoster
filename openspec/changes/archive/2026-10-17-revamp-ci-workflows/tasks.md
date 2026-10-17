## 1. Code fixes (main goes green)

- [x] 1.1 Lint: license headers and prettier in `mods/voice/examples/*`, CommonJS globals for `mods/voice/session.js`, import order in `mods/autopilot/src/models/**`; `npm run lint` has 0 errors
- [x] 1.2 Dashboard e2e: the agent test opens Autopilot from its nav link (the list still reads applications); `E2E_PORT` overrides the preview port
- [x] 1.3 commitlint: merge commits skipped, `spec` type allowed, header length / subject case / line lengths not checked; passes on the 0.30 merge range (409 commits)

## 2. Image list and smoke

- [x] 2.1 `ops/release/images.json` (bundle + identity + region-agent); `ops/release/bundle` reads it
- [x] 2.2 `ops/release/smoke <version>`: unpack, init, check, up, apiserver healthy, dashboard 200, down
- [x] 2.3 Autopilot image named `fonoster/autopilot` in Helm values and the dev Compose files

## 3. Workflows

- [x] 3.1 `pr-checks.yaml`, `ci.yaml`, `conformance.yaml` (libopus where Go builds)
- [x] 3.2 `stack-smoke.yaml` (compose, helm + kubeconform, devcontainer)
- [x] 3.3 `images.yaml` (matrix from images.json, amd64+arm64), `release.yaml` (dispatch only, draft with archive, approval, publish)
- [x] 3.4 `site.yaml`, `live-providers.yaml`; remove the superseded workflows; `.github/workflows/README.md`
- [x] 3.5 README contributors block → contrib.rocks image; contributors workflow removed

## 4. Verification

- [x] 4.1 actionlint and shellcheck clean
- [x] 4.2 Each job's commands run locally (lint, unit, go with libopus on Linux, python, dashboard vitest + Playwright, helm + kubeconform, NATS suites, bundle + smoke)
- [x] 4.3 The pull request's CI run is green (coordinator)
- [x] 4.4 First release run after the owner re-enables `release.yaml` (owner) (moved to openspec/rc-checklist.md, 2026-10-17)
