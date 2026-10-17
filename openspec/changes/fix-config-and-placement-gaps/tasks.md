## 1. Placement

- [ ] 1.1 Media nodes report their session limit in the heartbeat, and placement skips nodes at it
- [ ] 1.2 Test: a node at its limit gets no new call; with every node at its limit, call creation fails with a capacity error

## 2. Environment

- [x] 2.1 Stop loading `.env` in `mods/common/src/envs.ts` and `mods/amd/src/envs.ts`; move any values still read there into service config
- [x] 2.2 Remove Autopilot's `APISERVER_DATABASE_URL` fallback (`urlEnv`)
- [x] 2.3 Remove the media node's `MEDIANODE_*` fallback
- [x] 2.4 Release note for each removed fallback
