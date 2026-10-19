# Facts for the Hacking Fonoster pages (revamp-developer-experience, 2026-10-16)

From the rebuild/devx final report (DX-B1…B13 in openspec/changes/archive/2026-10-17-revamp-developer-experience/build-log.md).
Verify against code before drafting with /ps:docs.

- Prerequisites: Docker + VS Code with Dev Containers, or a Codespace, or `npx @devcontainers/cli`.
  A regular clone, NOT a git worktree.
- Open: "Reopen in Container" (CLI: `npx @devcontainers/cli up --workspace-folder .`). First open takes several
  minutes; ends printing the dashboard URL and owner login. Then `npm run dev`.
- What opening does: `initializeCommand` (on the host, shell + Docker only) builds the workspace image and, first
  time, runs `fonoster-config init` from source in a throwaway node:22-alpine to fill `.dev/`. Deps from
  `.devcontainer/compose.yaml` (extends ops/bundle/compose.yaml): nats, postgres, routr, rtpengine, minio, envoy,
  plus nats-test and a fonoster_test DB. The workspace takes the Roomr node's fixed address and the service
  names, so bundle Envoy routes and configs work unchanged. Fake speech/LLM providers on by default.
- Commands: `dev` (all, prefixed logs) · `dev:apiserver` (migrations + seed once, then tsx watch) ·
  `dev:appbridge`, `dev:autopilot` (tsx watch) · `dev:roomr` (go build + restart on .go change; a failed build
  keeps the running node) · `dev:dashboard` (Vite :3030) · `dev:fakes` (fake TTS/STT/LLM :7001–7003) ·
  `dev:config` (re-render .dev/, keeps secrets) · `dev:info` (URL + owner login).
- Host ports: dashboard + API http://localhost:8449; SIP 5060; RTP 10000–10999; MinIO 9000/9001 and NATS 4222 on
  127.0.0.1. Override with `FONOSTER_DEV_<NAME>` before the first open.
- Config/secrets: `.dev/.env` (secrets, host IP), `.dev/config/` (service files, keys), overrides in
  `.dev/overlay/<service>.yaml`. All git-ignored.
- Tests: `npm test` (uses nats-test + fonoster_test via compose env) · `npm test -w @fonoster/dashboard` ·
  `cd go/roomr && go test -race ./...`.
- Verified by the agent: deps healthy; `npm run dev` → migrations, catalog, roomr peer, dashboard 200; SDK
  login + seed; two SIP calls to an Autopilot app (6 s audio, record completed); appbridge reload ~2 s on save; .go
  save rebuilds roomr; Vite HMR and /sip WS through Envoy; npm test 1679/0; Go race; dashboard 290.
  NOT verified: Talk to agent in a real browser, Playwright e2e.
- Problems: LAN IP changed → edit HOST_IP in .dev/.env and rebuild the container · real vendor key → per
  workspace in the dashboard, or overlay + key in .dev/.env then `dev:config` · don't commit the post-create diffs
  in mods/identity/src/generated and mods/identity-client/proto (FIX: should not dirty the tree).
- Removed: compose.dev.yaml, .env.example.dev, devcontainer-lock.json, .scripts/check-preconditions.sh,
  .scripts/gen-keypair.sh, root scripts start:*/stop:services/db:*/generate:keypair/pretest, nodemon config.
  CI: publish-apiserver lost its SDK integration steps (they ran on compose.dev.yaml) — needs a new home.
