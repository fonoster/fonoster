## Why

Auditing the specs against the code on 2026-10-17 found four places where the code breaks a
requirement that is right. The specs stay as they are; the code needs fixing (roadmap phases 3–4).

## What Changes

- **Placement:** `createNodeDirectory().pick()` skips only draining and stale media nodes, so a
  node at its session limit can still get calls (`mods/apiserver/src/outbound/createNodeDirectory.ts`).
- **Synchronous capacity error:** `CreateCall` published `calls.create` and returned a ref at once;
  with no node to place the call on, the failure only showed up later as `FAILED` on `TrackCall`.
  `calls.create` becomes a request: placement tries up to three nodes and `CreateCall` fails with
  `RESOURCE_EXHAUSTED` when none takes the call.
- **Call status tied to one replica:** `TrackCall` statuses were republished on `calls.track` by
  the replica that placed the call, from the room's events, so they stopped when that replica
  died. Statuses now travel on `calls.<ref>.events`: `TRYING` and placement failures from the
  placing replica, `call.progress`, `call.answered` and `room.ended` straight from the media node
  (`room.create` carries `callRef`).
- **`.env` in development:** `mods/common/src/envs.ts` and `mods/amd/src/envs.ts` load the
  repository `.env` when `NODE_ENV=development`.
- **Autopilot environment fallback:** Autopilot reads the control-plane database URL from
  `APISERVER_DATABASE_URL` when its config has none (`urlEnv` in `mods/autopilot/src/session/hosted.ts`).
- **Media node environment fallback:** the media node falls back to deprecated `MEDIANODE_*`
  variables (`go/medianode/cmd/medianode/main.go`).

## Capabilities

### Modified Capabilities

- `control-plane`: a node at its limit is skipped, the next node is tried (at most three),
  `CreateCall` fails at once with `RESOURCE_EXHAUSTED`, and call status survives the placing
  replica.
- `media-control`: heartbeats carry `maxRooms`; `room.create` beyond it gets `at_capacity`;
  `room.create` may carry `callRef`, and that room's call events also go to `calls.<callRef>.events`.
- `media-node`: a per-node room limit (`maxRooms`, 200 by default).
- `deployment`: a scenario that development mode reads no `.env` either.
- `service-config`: scenarios that Autopilot and the media node do not fall back to environment variables.

## Impact

- `mods/apiserver`, `mods/conformance`, `mods/common`, `mods/amd`, `mods/autopilot`, `go/medianode`.
  The apiserver and the media node must be upgraded together: an older node publishes no call
  events on `calls.<ref>.events`, so `TrackCall` would see only `TRYING`. Removing the
  fallbacks can break deployments that rely on them, so each removal needs a release note.
