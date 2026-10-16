## Why

main carries the 0.30 platform, but its 17 GitHub workflows were written for the 0.27 platform and
none of them is green: lint fails on 44 errors, commitlint rejects the rebuild's merge commits,
the conformance Go step can't find `opus/opus.h`, a dashboard e2e test is stale, the contributors
bot crashes every run, two publish workflows build images that no longer exist (AMD, the
Asterisk-era Identity setup), the other publish workflows build different Dockerfiles than the
release archive, nothing publishes the gateway or the media node, and the release workflow `sed`s
a `compose.yaml` it would now break and never uploads the install archive.

## What Changes

- Eight workflows replace the seventeen (owner decision 2026-10-16):
  `pr-checks` (DCO, commitlint, lint), `ci` (node, go, python, dashboard, SDK install; jobs gated by
  paths), `conformance` (NATS suites on PRs, long suites nightly), `stack-smoke` (Compose install
  from the release archive, Helm lint/render/kubeconform, dev container build), `images`
  (reusable, multi-arch Docker Hub publish), `release` (dispatch only: npm, images, archive on a
  draft release, approval gate, publish), `site` (gh-pages deploy, docs broken links) and
  `live-providers` (dispatch only).
- **One image list**, `ops/release/images.json`, read by `ops/release/bundle` and by `images.yaml`,
  so the published images and the archive's `compose.yaml` can't drift. It lists medianode,
  gateway, autopilot, apiserver, dashboard (the bundle) plus identity (standalone, used by other
  products) and region-agent.
- `ops/release/smoke <version>`: the self-hoster's install (unpack, `fonoster-config init` and
  `check`, `docker compose up -d`) with a health wait, used by CI and runnable locally.
- The autopilot image is `fonoster/autopilot` everywhere (Helm values and the dev Compose files said
  `autopilot-session`).
- Code fixes so main goes green: lint errors (license headers, formatting, import order, the
  `@fonoster/voice/session` CommonJS shim), the stale Autopilot e2e test, a relaxed commitlint
  config.
- The README's generated contributors block becomes a contrib.rocks image; no bot commits to main.

## Capabilities

### Modified Capabilities

- `deployment` (add-platform): "Docker Compose and Helm are official targets" now says what CI
  actually checks (a Compose install that starts, a Helm chart that renders to valid manifests)
  and that a release passes a manual approval gate before it is published.

## Impact

- `.github/workflows/*` (17 removed or rewritten, 8 remain), `.github/workflows/README.md`.
- `ops/release/images.json`, `ops/release/bundle`, `ops/release/smoke`.
- `commitlint.config.cjs`, `eslint.config.mjs`, `mods/voice/examples/*`,
  `mods/autopilot/src/models/**`, `mods/dashboard/e2e/community.spec.ts`,
  `mods/dashboard/playwright.config.ts`, `README.md`, Helm values and the dev Compose files
  (autopilot image name).
- Owner actions: Docker Hub repositories for new images, the live-provider secrets, re-enabling
  the release workflow on GitHub.
