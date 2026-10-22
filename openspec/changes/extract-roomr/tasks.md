## 1. Roomr repository (done in fonoster/roomr)

- [x] 1.1 Create fonoster/roomr with the go/roomr history, module `github.com/fonoster/roomr`
- [x] 1.2 README with banner, docs (architecture, contract, integrate, configuration), llms.txt, AGENTS.md
- [x] 1.3 OpenSpec: redesign-roomr applied to the `roomr` and `media-control` specs, archived
- [x] 1.4 CI (Go with race detector, e2e against Routr and NATS, image build, spec validation, chart lint)
- [x] 1.5 Release workflow (tag, CI, multi-arch Docker Hub image, GitHub release with the protos)
- [x] 1.6 Helm chart (charts/roomr)
- [x] 1.7 Open node tasks filed as issues (7.13, 4.7, 3.8, 11.5)
- [x] 1.8 `fonoster/roomr-fake` (image, static binaries) and `@fonoster/roomr` (client, `/fake`, `/contract`), the contract suite run against the node and the fake in CI (fonoster/roomr#18, v0.2.0)
- [x] 1.9 First release v0.1.0 (image on Docker Hub); v0.2.0 with the fake and the npm package
- [x] 1.10 Pencil source for the banner (fonoster/roomr#16)
- [x] 1.11 Not moved (owner, 2026-10-22): Roomr's own e2e and contract suites prove the node; the ROM area and its TypeScript tooling are retired here (ids stay locked), and the AppBridge-through-a-node case becomes APB-031

## 2. Fonoster cut-over (after 1.8 and 1.9)

- [x] 2.1 `npm run sync:roomr`: copy the protos of the pinned `@fonoster/roomr` (its release's files) into mods/common/src/protos; the roomr client test fails on drift
- [x] 2.2 Pin the Roomr image by digest in ops/bundle (the devcontainer extends it), ops/rebuild, the cell and the Helm values
- [x] 2.2.1 Roomr publishes charts/roomr to oci://ghcr.io/fonoster/charts/roomr with each release (from v0.2.2), embeddable in a parent chart (existingConfigMap, templated env)
- [ ] 2.2.2 Fonoster's chart depends on it (owner, 2026-10-22: later, once the switch loses nothing: env is static in a subchart and a parent-rendered config does not restart pods); tracked as an issue
- [x] 2.3 Conformance: FakeRoomr, FakeSessionNode and RealMediaHarness run real nodes in roomr-fake (binary from the release, else the image); the integration cases and fault scripting go through its control API
- [x] 2.4 Release gate: the pinned Roomr release exists, passed Roomr's CI, and matches the bundle's pin; the release smoke runs the bundle with the real pinned image
- [x] 2.5 Delete go/roomr and the Go jobs in pr-checks, conformance and qa-proofs; no Go or libopus in Fonoster CI or the dev container
- [x] 2.6 Trim docs-site Roomr pages and CONTRIBUTING to link to fonoster/roomr; the dev container diagram redrawn. No compatibility table (owner, 2026-10-22): the bundle's pin and the release notes say which Roomr a release runs

## 3. Close out

- [ ] 3.1 Archive redesign-roomr here (node specs now live in fonoster/roomr)
- [ ] 3.2 Remove the old worktrees fonoster-roomr and fonoster-qa-roomr
- [ ] 3.3 Cluster-level tasks stay here: #1091, #1092, #1093, #1094, #1095
