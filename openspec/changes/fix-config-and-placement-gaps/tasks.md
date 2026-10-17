## 1. Placement

- [x] 1.1 Media nodes report their session limit in the heartbeat, and placement skips nodes at it
- [x] 1.2 Test: a node at its limit gets no new call; with every node at its limit, call creation fails with a capacity error
- [x] 1.3 The node refuses `room.create` (and INVITEs) at its limit with `at_capacity`; placement tries the next node, at most three
- [x] 1.4 `CreateCall` waits for a node to accept the room and fails with `RESOURCE_EXHAUSTED` when none does
- [x] 1.5 Call status on `calls.<ref>.events` from the media node, so `TrackCall` on any replica follows the call after the placing replica dies

## 2. Environment

- [ ] 2.1 Stop loading `.env` in `mods/common/src/envs.ts` and `mods/amd/src/envs.ts`; move any values still read there into service config
- [ ] 2.2 Remove Autopilot's `APISERVER_DATABASE_URL` fallback (`urlEnv`)
- [ ] 2.3 Remove the media node's `MEDIANODE_*` fallback
- [ ] 2.4 Release note for each removed fallback
