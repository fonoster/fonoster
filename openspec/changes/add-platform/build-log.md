# add-platform build log

## 2026-10-15 (spec review rulings, with the owner)

A separate reviewer read every rebuild spec; the owner ruled on each finding one by one.

### PL-R1. Cells: metadata out, content stays

- Only the call-record index (call ref, app, time, duration, status, cost, size, location), config
  and health cross the leaf link; the dashboard reads content from the cell with a short-lived
  link. Private cells answer `GetCapabilities` locally. SIP traces removed from the cell contents.

### PL-R2. PL3 revised for new calls

- `call.incoming` and `gateway.outbound` use request and reply on a gateway queue group (claim in
  500 ms, one retry, then 503) instead of JetStream.

## 2026-10-15 (platform stream build)

### PL-B1. Images and build contexts

- Gateway and Autopilot session engine build from the repo root (`npm install --workspace`, only that package's workspace closure, then `tsc -b` per package, `npm prune --omit=dev`). `npm install`, not `npm ci`: the lockfile does not yet list the OTel packages now declared in `mods/common`.
- Media node builds from `go/medianode` (golang:1.25 to `distroless/static:nonroot`, static, trimmed). Images run as non-root.
- The Autopilot session engine had no entry; added `mods/autopilot/src/session/main.ts`: reads one YAML (`AUTOPILOT_SESSION_CONFIG`), serves one assistant over the session `VoiceServer`. Dockerfile is `mods/autopilot/Dockerfile.session` (the legacy `Dockerfile` is untouched).

### PL-B2. The node had no RTP range

- The node bound ephemeral UDP ports, so no firewall/Service range was possible. Added `-rtp-port-min/-max` (`MEDIANODE_RTP_PORT_MIN/MAX`); allocation is round-robin inside the range and fails when exhausted. Also exposed limits as flags/env (max duration, participants, media timeout, `MEDIANODE_DRAIN_WAIT`).
- SRTP/TLS is not in the node yet, so the "encryption switch" is documented as not shipped.

### PL-B3. TypeScript telemetry without exporter packages

- node_modules has `@opentelemetry/api`, `sdk-trace-base`, `sdk-trace-node`, `resources` but no OTLP exporter or metrics/logs SDK. `mods/common/src/telemetry.ts` therefore uses the trace SDK plus a small OTLP/HTTP JSON sender for traces, logs and metrics (counter, gauge). Those four packages are declared in `mods/common/package.json`; the lockfile needs a refresh on the next install.
- Enabled only by `OTEL_EXPORTER_OTLP_*` endpoints; otherwise nothing is loaded and every call is a no-op. Protocol is HTTP/JSON only (collector port 4318); gRPC is not offered.

### PL-B4. Go telemetry

- `go/medianode/internal/telemetry` uses the official SDK over OTLP/HTTP. Pinned to otel v1.38.0 (log v0.14.0): v1.47 needs Go 1.26. Logs go through `otelslog` and are teed with the JSON stderr handler.

### PL-B5. Correlation by call ref

- Gateway `Call` starts a `gateway.call` span and logs start/end with `fonoster.call_ref`; the node spans `medianode.call.incoming` and counts claim outcomes with the same attribute. Trace context is not yet carried across NATS, so one call has a span per service joined by `fonoster.call_ref`, not one parent trace. Propagating `traceparent` in media-control messages is left open.

### PL-B6. Compose and Helm shape

- `ops/rebuild/compose.yaml` is separate from the legacy root `compose.yaml` (which still carries Asterisk and InfluxDB). Observability is a Compose profile; services get `OTEL_EXPORTER_OTLP_ENDPOINT` from the environment, empty by default.
- The chart runs the media node as a StatefulSet on the host network (RTP range); node id is the pod name; drain grace seconds feed both `-drain-wait` and `terminationGracePeriodSeconds`. Gateway is a Deployment with a PDB. NATS, Routr and the rest are expected from their own charts.

## 2026-10-15 (stack stream: the whole platform on one machine)

### ST-B1. One command, one Compose file

- `ops/rebuild/stack up | seed | call | smoke | info | logs | ps | down | reset` drives
  `ops/rebuild/compose.yaml`, which now holds the control plane too: apiserver (embedded Identity),
  Envoy (the root `config/envoy.yaml`), dashboard, `appsync`, plus profiles `fakes` and `tools`
  (the caller bot). `up` renders configs, keys and generated secrets into `ops/rebuild/.local/`
  (git-ignored) and runs Compose with `--env-file .local/stack.env`.
- Host ports default to 16000-16999 (`ops/rebuild/stack.defaults`), project `rb-stack`, images
  `rb-stack/<service>:dev`, so it runs next to the legacy stack. The base Compose defaults
  (5060, 8449, ...) are unchanged for operators who run it alone.
- One network (`RB_NET`, default 10.216.16.0/24) with fixed addresses for Routr (.40), RTPEngine,
  the media node, the gateway and the caller bot (.41-.44); dynamic ones come from .128/25. The
  first choice (172.29.161.0/24) collided with the owner's existing 172.29.0.0/16 network.

### ST-B2. Images built from the workspace, not npm

- `mods/apiserver/Dockerfile` packs the apiserver and installs `@fonoster/*` from npm, which has no
  `@fonoster/callrecord` (404) and none of the rebuild code. Added
  `ops/rebuild/docker/apiserver.Dockerfile` (workspace closure, both Prisma clients, migrations at
  `/service/{core,identity}` for the existing entrypoint). Same for the dashboard
  (`ops/rebuild/docker/dashboard.Dockerfile`): the release image takes `@fonoster/sdk` 0.27.0 from
  npm, which predates GetCapabilities and fails its own check; ours builds the SDK's browser bundle
  from this checkout. The release Dockerfiles are untouched.
- The SDK's `tsc -b` alone leaves `dist/node/src/*`, so autopilot could not compile against it
  (`Cannot find module '@fonoster/sdk'`). Both the apiserver image and
  `mods/autopilot/Dockerfile.session` now run the SDK's postbuild move; the session Dockerfile also
  stops on a failed package (it ignored failures before).
- Gateway image: generates the apiserver Prisma client (with openssl in the builder, or Prisma
  picks the openssl 1.1 engine and fails at run time) so `appStore.source: database` works.

### ST-B3. No Asterisk needed to boot

- The apiserver waited for ARI and exited without it. New `mediaService.provider: none` skips ARI
  and the ARI call manager (the HTTP bridge and records API still start). Small and additive; the
  clean-break stream removes the ARI path anyway. The schema still requires the `asterisk` and
  `influxdb` blocks, so the rendered config fills them with unused values.

### ST-B4. Autopilot apps reach the hosted Autopilot: appsync (interim)

- The apiserver's CreateApplication does not write the session-app columns (url, flavor, signing
  secret, speech), and the hosted Autopilot reads assistants from a file. `ops/rebuild/appsync.cjs`
  runs in the apiserver image every 3 s: for every AUTOPILOT app it writes url
  `ws://autopilot:3000`, flavor native, the hosted Autopilot's single signing secret and speech
  defaults, and writes `{apps: {<ref>: {workspaceRef, assistant}}}` with each stored assistant
  converted to the strict session schema (VAD wait to patience, `provider/model` catalog id).
  Apps created in the dashboard therefore answer within seconds. Replace it with the apiserver
  writing the columns on create and an assistant source that reads the control plane.
- Found while wiring: the migration CLI gave each AUTOPILOT app its own random secret, but the
  hosted Autopilot verifies every session with one secret, so migrated Autopilot apps could never
  connect. New option `autopilotSigningSecret` (`--autopilot-secret-env`). Also
  `PrismaApplicationStore` wrote `speech` and `fallback` columns that do not exist; it now writes
  `speechVoice`, `speechLanguage`, `fallbackAppRef`, `fallbackMessage` (tests added).

### ST-B5. Media node registration and Routr addresses

- `MEDIANODE_TRANSPORT=tcp` made the node fail to start: the REGISTER client binds the SIP port
  before the TCP listener (`bind: address already in use`, restart loop). Inside the Docker network
  UDP works, so the stack uses UDP; the Go ordering bug is left for the media-node stream.
- Routr writes the first address of a `LOCALNETS` entry in Via/Record-Route for local peers. With
  `10.216.16.16/28` it wrote `10.216.16.16` (no such host), so ACK and BYE never reached the node
  and calls ran until the media timeout. The fixed addresses moved so the entry is
  `10.216.16.40/29`, whose first address is Routr itself. Outside peers (softphones) get
  `EXTERNAL_ADDRS` = the machine's LAN address, which both the host and the containers reach;
  RTPEngine advertises the same address.

### ST-B6. Fake providers as a service

- `mods/conformance/src/fakes/serve.ts` runs the fake TTS, STT and LLM on 7001-7003
  (`ops/rebuild/docker/fakes.Dockerfile`). The STT scripts two caller sentences (6 s, 16 s) so an
  Autopilot conversation moves; the LLM echoes. `FakeProvider.start` takes a host (default
  127.0.0.1, unchanged). Vendors switch on per key at `up`: `DEEPGRAM_API_KEY` (STT + default
  voice), `ELEVENLABS_API_KEY` (voices), `OPENAI_API_KEY` (registry adapter openai instead of fake
  under the same `openai/gpt-4o-mini` id). Keys pass by name, never into rendered files.

### ST-B7. MinIO image

- `minio/minio` (and quay.io) images are no longer pullable. The stack uses
  `bitnamilegacy/minio:2025.4.22`, which also creates the `records` bucket
  (`MINIO_DEFAULT_BUCKETS`).

### ST-B8. Bugs found on the live path

- Signature mismatch on every Autopilot session: the gateway signs the app URL as stored
  (`ws://autopilot:3000`), the VoiceServer checked `ws://autopilot:3000/` only. It now accepts
  both spellings for the root path (test added).
- The apiserver crashed (unhandled rejection) on every Routr call event when InfluxDB is absent:
  `writeApi.flush()` returns a promise that was never caught. Now logged as a warning.
- Cloak keys must be base64url (`[A-Za-z0-9-_]`) while the apiserver's check wants `[A-Za-z0-9+/]`;
  only keys without `+` or `/` satisfy both. The stack generates such keys; the two checks
  should agree.
- `Agents.listAgents` in the SDK fails to decode agents with credentials
  (`credentials.toObject is not a function`); the seed avoids it.

### ST-B9. Smoke test

- `ops/rebuild/stack smoke`: up, seed (retried while Routr starts, about a minute), one call from
  the caller bot (in the network) to `+17853178070@carrier.fonoster.local` through Routr (retried
  on 480 until the node registers), checks that the caller heard the app (about 6 s of audible
  audio: the greeting and an echo) and that a sealed call record for the app appears in the index
  (`call_records`, location `s3://records/`), then down. Passed 4 runs in a row.

### ST-B10. Not done / not verified

- A real softphone call from the host was not tried (no softphone here). The path is the one the
  doc describes (LAN address for Routr and RTPEngine); the caller bot covers SIP and media inside
  the network only.
- Not in the stack: the standalone Identity service (`mods/identity/Dockerfile`; the apiserver's
  embedded Identity with its own `fnidentity` database is used), outbound calls (CreateCall still
  goes through the ARI call manager, which is off), Helm for the control plane.

### ST-B11. After merging next (clean break, voices, SRTP node)

- `mediaService.provider: none` dropped: next removed `mediaService` and the ARI path altogether.
  The stack's `fonoster.yaml` no longer sets `mediaService` or `routr.engines` (numbers route to
  `sip:medianode@default` by default). Kept: the InfluxDB flush catch, the VoiceServer bare-URL
  fix (now in `mods/voice/src/VoiceServer.ts`), the migration fixes, the images.
- Images: after the clean break neither autopilot nor the apiserver depends on `@fonoster/sdk`, so
  the SDK build steps are gone from `mods/autopilot/Dockerfile` (renamed from `Dockerfile.session`)
  and the apiserver image. Autopilot's workspace closure no longer pulls `typescript`; its image
  installs with `--include-workspace-root`. Both stop on the first package that fails.
- The hosted Autopilot's registry is now rendered from `config/catalog-seed.yaml` (Deepgram,
  ElevenLabs, OpenAI, Groq). Without `OPENAI_API_KEY` the LLM providers get the fake adapter under
  the same ids. The gateway still runs without a registry (its providers config picks adapters).
- Smoke after the merge: passed (caller heard 6060 ms; record `completed`, `s3://records/`).
- Outbound CreateCall through the stack: the apiserver places it (room on the node, the gateway
  claims it, `participant.dial` through Routr) and a failed outbound record is indexed, but Routr
  answers 403 Forbidden. The node's INVITE has `From: <sip:+17853178070@<node IP>>` (the DOD
  number), so Routr resolves the caller to the Number, not the media-node Peer, and the routing
  direction is UNKNOWN (connect `access.js`). For PEER_TO_PSTN, From must be the Peer
  (`sip:medianode@default`) with the number in `X-Dod-Number`, and the node must answer Routr's
  digest challenge on INVITE. Left for the media-node and outbound owners.
  **Fixed** by add-media-node OB-B1: the node dials as the Peer with `X-DOD-Number` and answers
  the challenge; an SDK CreateCall through the stack is answered, the app talks and the record
  is `completed`.
- Test environment: sipnet's tests resolved `@fonoster/common` to the shared platform-refresh copy
  (old default peer AOR) and failed 3 tests. Fixed with the uncommitted worktree link
  `mods/sipnet/node_modules/@fonoster/common -> ../../../common`.

### RV-B4. A number links only applications of the caller's workspace
- `createNumber` and `updateNumber` pass the caller's access key id (`getAccessKeyIdFromCall`)
  to `checkNumberPreconditions`; the check looks the app up with `{ ref, accessKeyId }` and
  refuses (PERMISSION_DENIED) when the caller's workspace is unknown, since Prisma drops an
  undefined filter and would match any workspace's app.
- Tests: `mods/apiserver/test/utils/checkNumberPreconditions.test.ts`, sipnet createNumber.

### RV-B6. NATS is not a trust boundary yet
- Local stack: NATS (4222) and MinIO (API and console) are published on 127.0.0.1 only;
  `RB_NATS_BIND` / `RB_MINIO_BIND=0.0.0.0` opt in to all interfaces. MinIO has no default
  password any more: compose requires `MINIO_ROOT_PASSWORD`, which `ops/rebuild/stack` generates
  into `.local/stack.env`.
- Call-record index: an entry never changes an indexed record's non-null workspace
  (`accessKeyId`); an entry naming another workspace is logged and dropped.
- Record maintenance (gateway, `callrecord.<region>.maintenance`): the request must name a
  workspace and it must be the stored record's (`WorkspaceMismatchError` -> `forbidden`);
  `CallRecordWriter` checks whenever a caller names a workspace.
- Not done (tasks 4.1, 4.2): NATS users and subject ACLs per service; mTLS for the edge.
- Tests: apiserver records "never moves an indexed record to another workspace", callrecord
  "refuses maintenance that names another workspace", gateway records maintenance.

### RV-B13. Small review fixes
- Autopilot's `recordings.baseUrl` defaulted to the removed `/api/recordings` bridge and nothing
  reads it: the key stays accepted (older files load) with no default, and the example config no
  longer sets it.
- `UpdateApplication` regenerated a signing secret (an app that stopped being an Autopilot app)
  without returning it, so nobody could ever see it. `UpdateApplicationResponse` now carries
  `signing_secret` and `signing_secret_hint` (set only when generated; the shared Autopilot
  secret is never returned); SDK stubs regenerated for applications only, SDK
  `updateApplication` returns `UpdateApplicationResponse`.
