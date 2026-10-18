## 1. Placement

- [x] 1.1 Media nodes report their session limit in the heartbeat, and placement skips nodes at it (`maxRooms` in `node.heartbeat`; `createNodeDirectory.ts` skips nodes at it)
- [x] 1.2 Test: a node at its limit gets no new call; with every node at its limit, call creation fails with a capacity error (`mods/apiserver/test/outbound/controlPlane.test.ts`: "no capacity: ... at its limit")
- [x] 1.3 The node refuses `room.create` (and INVITEs) at its limit with `at_capacity`; placement tries the next node, at most three (`TRY_NEXT` in `placeOutboundCall.ts`; the Go node refuses with `at_capacity`)
- [x] 1.4 `CreateCall` waits for a node to accept the room and fails with `RESOURCE_EXHAUSTED` when none does (`createCall.ts` maps a placement failure to `RESOURCE_EXHAUSTED`)
- [x] 1.5 Call status on `calls.<ref>.events` from the media node, so `TrackCall` on any replica follows the call after the placing replica dies (`callEventsSubject` in `mods/apiserver/src/envs.ts`, `CallEventsSubject` in `go/medianode/internal/node/node.go`)

## 2. Environment

- [x] 2.1 Stop loading `.env` in `mods/common/src/envs.ts` and `mods/amd/src/envs.ts`; move any values still read there into service config (`mods/common/src/envs.ts`, `mods/amd/src/envs.ts`; `deploymentRules.test.ts` "ignores a .env in development too")
- [x] 2.2 Remove Autopilot's `APISERVER_DATABASE_URL` fallback (`urlEnv`) (`mods/autopilot/src/session/hosted.ts` rejects `database.urlEnv`)
- [x] 2.3 Remove the media node's `MEDIANODE_*` fallback (`go/medianode/cmd/medianode/main.go` reads no `MEDIANODE_*`, only logs ignored ones)
- [x] 2.4 Release note for each removed fallback (`docs/release-notes-sessions.md`, PR #952)
