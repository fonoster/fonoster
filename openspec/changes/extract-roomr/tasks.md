## 1. Roomr repository (done in fonoster/roomr)

- [x] 1.1 Create fonoster/roomr with the go/roomr history, module `github.com/fonoster/roomr`
- [x] 1.2 README with banner, docs (architecture, contract, integrate, configuration), llms.txt, AGENTS.md
- [x] 1.3 OpenSpec: redesign-roomr applied to the `roomr` and `media-control` specs, archived
- [x] 1.4 CI (Go with race detector, e2e against Routr and NATS, image build, spec validation, chart lint)
- [x] 1.5 Release workflow (tag, CI, multi-arch Docker Hub image, GitHub release with the protos)
- [x] 1.6 Helm chart (charts/roomr)
- [x] 1.7 Open node tasks filed as issues (7.13, 4.7, 3.8, 11.5)
- [ ] 1.8 `fonoster/roomr-fake` (image and npm client) and the shared contract suite (fonoster/roomr#13, #15)
- [ ] 1.9 First release v0.1.0 (image on Docker Hub)
- [ ] 1.10 Pencil source for the banner and diagrams (fonoster/roomr#14)
- [ ] 1.11 Move the ROM node cases and their TypeScript tooling (NatsFaultProxy, GoNodeDriver, VirtualSip, rtp, sip, mixMinus, RealMediaHarness, RoomrSuiteHarness) to Roomr

## 2. Fonoster cut-over (after 1.8 and 1.9)

- [ ] 2.1 `npm run sync:roomr`: vendor the protos from a Roomr tag into mods/common/src/protos, with a drift check in CI
- [ ] 2.2 Pin the Roomr image by digest in compose.yaml, ops/bundle, the devcontainer and Helm; the umbrella chart depends on charts/roomr
- [ ] 2.3 Conformance: replace FakeRoomr and FakeSessionNode with the fake image; keep the integration cases (controller and AppBridge against the fake) and fault scripting through its control API
- [ ] 2.4 Release gate: require the pinned Roomr version's QA report; keep one real-image smoke
- [ ] 2.5 Delete go/roomr and the Go jobs in pr-checks, conformance and qa-proofs; no Go or libopus in Fonoster CI
- [ ] 2.6 Trim docs-site Roomr pages and CONTRIBUTING to link to fonoster/roomr; compatibility table in both READMEs

## 3. Close out

- [ ] 3.1 Archive redesign-roomr here (node specs now live in fonoster/roomr)
- [ ] 3.2 Remove the old worktrees fonoster-roomr and fonoster-qa-roomr
- [ ] 3.3 Cluster-level tasks stay here: #1091, #1092, #1093, #1094, #1095
