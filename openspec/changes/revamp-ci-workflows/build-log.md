# Build log: revamp-ci-workflows

Decisions taken while building, for the owner to review. Each can be reversed.

## 2026-10-16

### CI-B1. Lint fixed in the code, no new ignores

- `mods/voice/examples/*.ts` got the license header (their description comment stays right under
  it) and prettier formatting.
- `mods/voice/session.js` (the CommonJS alias kept for one release) is linted with the `.cjs` rules
  (`module`/`require` globals) by adding it to that block of `eslint.config.mjs`.
- Import order fixed in `mods/autopilot/src/models/evaluations/*` and `models/types.ts`.
- `npm run lint`: 0 errors (warnings unchanged: no-loops, no-explicit-any).

### CI-B2. The stale dashboard test was the nav label, not the data source

- The agent list still reads `Applications/ListApplications` (filtered to AUTOPILOT); the test
  clicked a link named "Agents", which now matches "SIP agents". It now clicks "Autopilot"
  (exact). No API mock change was needed.
- `playwright.config.ts` takes `E2E_PORT` (default 4174) so a shared host can run it.

### CI-B3. commitlint relaxed

- Merge commits are ignored (`^Merge `), `spec` is an allowed type (OpenSpec commits), and
  header length, subject case and body/footer line lengths are off. The type still drives
  `.scripts/next-release.sh`. Passes on the 409 commits of the 0.30 merge.

### CI-B4. One image list: ops/release/images.json

- Bundle images: medianode, gateway, autopilot, apiserver, dashboard (the Dockerfiles the bundle
  already used). Publish-only: identity (`mods/identity/Dockerfile`) and region-agent.
- Identity stays published (owner correction): QCobro and Proyecta run `fonoster/identity`
  standalone (identity-standalone-service / identity-multi-product).
- mcp is left out: `mods/mcp/Dockerfile` does not build (it copies `src/` and runs `npm install`
  with no package.json). Add it back once its Dockerfile is fixed.

### CI-B5. The autopilot image is fonoster/autopilot

- Helm values and `ops/rebuild/compose.yaml` / `ops/rebuild/cell/compose.yaml` said
  `autopilot-session`; the bundle and the published image are `fonoster/autopilot`. The config
  file name `autopilot-session.yaml` is unchanged.

### CI-B6. stack-smoke installs the release archive

- The compose job runs `ops/release/bundle 0.0.0-smoke` (images and archive) then
  `ops/release/smoke`, which installs it like a self-hoster, waits for a healthy apiserver and a
  200 from the dashboard through Envoy, and checks no service exited. Small RTP ranges (30 ports)
  keep Docker's port publishing fast.
- Helm: `helm lint --strict` and `helm template` with values.yaml, values-cloud.yaml and
  values-observability.yaml, piped to kubeconform 0.7.0 (`-strict -ignore-missing-schemas`,
  Kubernetes 1.30). No cluster install yet (design non-goal).
- The dev container image builds only when `.devcontainer/` changes, and nightly.

### CI-B7. Go jobs install libopus-dev

- `opus.go` links `-lopus` with cgo; Ubuntu's `libopus-dev` provides `opus/opus.h`. pkg-config
  and libopusfile are not needed. ci `go` runs gofmt, vet and `go test -race` with a NATS service
  (the e2e package uses it); conformance `suites` installs it too because the Go-node suites
  `go build` the media node.

### CI-B8. release.yaml is dispatch only

- Order: next-release.sh → `npm run release` (lerna publish, dist-tag latest; absorbs
  tag-npm-packages) → images.yaml with `latest: true` at the release commit → archive
  (`SKIP_IMAGES=1 ops/release/bundle <v>`) on a draft release → `release-approval` → publish.
- `Release-As: 0.30.0` (fce82c73a) still pins the first run's version.
- No push trigger, so merging this change publishes nothing. The workflow is disabled on GitHub;
  the owner re-enables it deliberately.

### CI-B9. Contributors: contrib.rocks image, no workflow

- Owner decision: contributors.yaml removed; the README's generated block (and its markers) is
  replaced by a contrib.rocks image linking to the contributors graph. No bot commits to main.
  (An earlier relay said to leave it; this decision supersedes it.)

### CI-B10. SDK install matrix

- Node 20, 22 and 24 with npm, plus yarn on 22; the installed package must `require` and export
  `Client`. Node 18 and 21 are EOL.
