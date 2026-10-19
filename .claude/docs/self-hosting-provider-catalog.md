# Docs checkpoint — self-hosting-provider-catalog

Started: 2026-10-19
Current stage: 7 — Wire (lead wires docs.json)

**Purpose:** An operator who runs Fonoster learns to add models and voices to the catalog, phase one
out (deprecate, then retire) without breaking workspaces, and keep installs on one catalog. They
also learn what deprecation does for workspaces and where keys come from.

**Diátaxis type:** how-to
**Reader:** self-hosters (Compose)

**Placement:** new `self-hosting/provider-catalog` · nav group `Operate` (Self-hosting tab)

**Sources:**
- `mods/common/src/registry/cli.ts`, `Registry.ts`, `workspaceKeys.ts`
- `mods/apiserver/src/core/applyCatalog.ts`, `mods/apiserver/src/index.ts` (catalog.file on start)
- `ops/bundle/config/catalog.yaml`, `fonoster.example.yaml`, `gateway.example.yaml`, `autopilot.example.yaml`, `ops/bundle/compose.yaml`
- `mods/apiserver/Dockerfile` (cli.js path in the image), `mods/autopilot/src/session/hosted.ts` (key layering)
- `openspec/specs/provider-registry/spec.md`, `docs/operators/registry.md`
- `mods/appbridge/src/session/Call.ts` (noteCatalogUse), `mods/dashboard/src/session/streams.tsx` (warnings)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | |
| 4 | Assets | pending | `provider-catalog/lifecycle` queued |
| 5 | Draft | done | |
| 6 | Proof | done | curl 200 on :3334 |
| 7 | Wire | pending | lead |

## Unverified
- The `registry()` shell function (`docker compose exec -T apiserver … node /work/mods/common/dist/registry/cli.js`) was not run live; paths come from the Dockerfile and package.json bin.
- `plan|apply -f /dev/stdin < file` through `docker compose exec -T` (stdin attached) not run live.
- Sample outputs are built from the code's print formats, not captured.

## Decision log
- 2026-10-19 — Run the tool inside the apiserver container (Postgres isn't published in Compose; the image has the CLI and the generated Prisma client).
- 2026-10-19 — Warn that `config/catalog.yaml` re-applies on every start and reverts CLI deprecations; tell readers to `export` back to the file.
- 2026-10-19 — Impact example uses a voice deprecation: a clean STT/LLM model move prints no line at all (see open questions).
- 2026-10-19 — Platform vs workspace keys kept short; details deferred to `self-hosting/providers`.
