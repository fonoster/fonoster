## Context

Audit of main at da1d50cd5 (the 0.30 platform), 2026-10-16:

| Old workflow | State | Fate |
| --- | --- | --- |
| check-dco | ok | → pr-checks `dco` |
| check-commit-lint | fails: "Merge rebuild/x" commits, headers > 100, capitalized subjects | → pr-checks `commitlint`, relaxed config |
| check-lint-and-format | fails: 44 errors | → pr-checks `lint`, code fixed |
| unit-tests | ok | → ci `node` |
| dashboard-tests | fails: stale e2e test | → ci `dashboard`, test fixed |
| test-sdk-install | Node 18/21 are EOL | → ci `sdk-pack` + `sdk-install` (20/22/24) |
| conformance | Go step fails: no `opus/opus.h` | kept; libopus installed; Go and Python moved to ci |
| contributors | crashes every run | removed; README uses a contrib.rocks image |
| publish-amd | Asterisk AMD is gone | removed |
| publish-identity | separate workflow | removed; identity is an entry in images.json |
| publish-apiserver, publish-dashboard | build `mods/*/Dockerfile`, not the bundle's | removed; images.yaml builds the bundle's Dockerfiles |
| publish-autopilot | ok | removed; folded into images.yaml |
| (none) | gateway and medianode never published | images.yaml publishes them |
| release | `sed` breaks the new `compose.yaml`; no archive upload; runs on push | rewritten, dispatch only |
| tag-npm-packages | wrong input name (`branch` vs `tag`) | removed; `npm run release` already uses dist-tag latest |
| gh-pages | irrelevant `docs/**` path | → site `deploy` |
| live-providers | needs two secrets that don't exist | kept, dispatch only, fails fast without them |

Secrets that exist: NPM_TOKEN, DEPLOY_TOKEN (repo); GH_PAT, DOCKER_HUB_USERNAME,
DOCKER_HUB_PASSWORD (org).

## Goals / Non-Goals

Goals: every check that runs on a pull request can pass on main; one list of images; a release
that publishes what the install archive runs; nothing publishes on merge.

Non-goals: a Helm install in a cluster (kind) nightly; native arm64 runners; the turn-taking
corpus and load pass bars (still trends on shared runners).

## Decisions

- **Eight files, grouped by purpose, not by tool.** Each workflow has one reason to exist and
  says so in its header comment; `.github/workflows/README.md` lists them in one table.
- **Path gating with dorny/paths-filter inside one workflow** (`ci`, `stack-smoke`) instead of
  one workflow per job: one status check list, and a change to the workflow file itself runs
  every job.
- **`ops/release/images.json` is the image list.** `bundle: true` entries are the ones the
  archive's compose.yaml runs; the bundle script builds those, images.yaml builds all of them.
- **`ops/release/smoke` holds the smoke logic**, not the workflow: the same script runs locally
  (own project name, subnet and port base) and in CI.
- **QEMU for arm64** in images.yaml: one job per image, readable; slower than native runners
  with a manifest merge. Revisit if release builds get too slow.
- **release.yaml is dispatch only.** It keeps `npm run release` (lerna publish, dist-tag latest,
  version from `.scripts/next-release.sh`, so `Release-As:` still pins), the `release-approval`
  environment, and adds the archive upload. It never edits compose.yaml: the archive's
  `.env.example` carries `FONOSTER_VERSION`.
