## Why

Auditing the specs against the code on 2026-10-17 found four places where the code breaks a
requirement that is right. The specs stay as they are; the code needs fixing (roadmap phases 3–4).

## What Changes

- **Placement:** `createNodeDirectory().pick()` skips only draining and stale media nodes, so a
  node at its session limit can still get calls (`mods/apiserver/src/outbound/createNodeDirectory.ts`).
- **`.env` in development:** `mods/common/src/envs.ts` and `mods/amd/src/envs.ts` load the
  repository `.env` when `NODE_ENV=development`.
- **Autopilot environment fallback:** Autopilot reads the control-plane database URL from
  `APISERVER_DATABASE_URL` when its config has none (`urlEnv` in `mods/autopilot/src/session/hosted.ts`).
- **Media node environment fallback:** the media node falls back to deprecated `MEDIANODE_*`
  variables (`go/medianode/cmd/medianode/main.go`).

## Capabilities

### Modified Capabilities

- `control-plane`: a scenario that a node at its limit is skipped.
- `deployment`: a scenario that development mode reads no `.env` either.
- `service-config`: scenarios that Autopilot and the media node do not fall back to environment variables.

## Impact

- `mods/apiserver`, `mods/common`, `mods/amd`, `mods/autopilot`, `go/medianode`. Removing the
  fallbacks can break deployments that rely on them, so each removal needs a release note.
