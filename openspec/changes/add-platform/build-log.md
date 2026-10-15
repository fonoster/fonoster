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

## 2026-10-15 (finish stream: the stack with real voices)

### FN-B1. appsync removed: everything reads the control plane

- The stack's apiserver sets `apps.autopilotUrl: ws://autopilot:3000` and
  `apps.autopilotSigningSecret`, so Autopilot apps point at the hosted Autopilot on create. The
  hosted Autopilot reads assistants, the catalog and workspace vendor keys from the apiserver's
  database (`source: database`, refresh 5 s); the gateway reads apps, the catalog
  (`registry.source: database`) and workspace keys (`workspaceKeys.enabled`) from it too.
  `ops/rebuild/appsync.cjs`, its service, volume and test are gone, as is the rendered
  `registry.json`.
- `up` loads `ops/rebuild/config/catalog-seed.yaml` into the registry tables with
  `fonoster-registry apply --store database`, run in the apiserver container (idempotent).
- The autopilot image now generates a Prisma client from the apiserver schema with
  `prisma-field-encryption` (installed aside in `/opt/db` and merged into `node_modules`, so the
  workspace install is untouched).
- Without a platform LLM key, the catalog stays real and the hosted Autopilot points that
  provider's endpoint at the fake LLM with a dummy credential (instead of rewriting adapters to
  `fake`). A workspace key for a keyless provider would still reach the fake; fine locally.
- The seed writes the assistant in the session schema (catalog model id, `hints: [Fonoster]`),
  sets `speech.sttModel: deepgram/nova-3`, and updates the app on every run so its model and voice
  follow the keys present. The smoke test waits 4 s after seeding: the gateway and the hosted
  Autopilot cache apps for 3 s, and one run failed silent when the seed had just switched the
  voice from ElevenLabs (no key any more) back to Deepgram. Smoke passed 3 times with the fakes.
- Local only: in this worktree the root `@fonoster/sdk` link points at the shared checkout's SDK
  (which drops `speech.sttModel`), so a git-ignored `ops/rebuild/node_modules/@fonoster/sdk` link
  to this checkout's SDK was used. A normal checkout resolves its own SDK.

### FN-B2. createCall status stream from the media node's room events

- TrackCall listened on `calls.track`, which nothing published since ARI left. The outbound
  placement (`runOutboundCalls`) now publishes TRYING, subscribes to
  `media.<node>.events.<room>` once the room exists and maps `call.progress` (ringing → PROGRESS,
  busy → BUSY, no_answer → NOANSWER, failed → FAILED), `call.answered` → ANSWER, and `room.ended`
  → a final message that closes the stream; a failed placement publishes FAILED.
- The SDK subscribes after CreateCall returns, so TrackCall keeps statuses of untracked calls for
  2 minutes and replays them. Live: TRYING, PROGRESS (+51 ms), ANSWER (+620 ms), stream closed
  when the callee hung up.

### FN-B3. callee_hangup in the record

- The gateway mapped every media `reason` to the session's `caller_hangup`. The app still gets
  `caller_hangup` (spec), but the record's `call.ended` keeps `callee_hangup`
  (`recordEndReason`). Live: outbound record `completed / callee_hangup`.

### FN-B4. Partial trunk updates

- UpdateTrunk passed the request straight to Routr, which needs name and inbound URI (proto3
  sends ""). sipnet now fills blank name, inbound URI, URIs and credential/ACL refs from the
  current trunk. Clearing URIs or refs through an update is therefore not possible (recreate);
  `sendRegister` is not merged (false is a real value). Live: rename without inboundUri works.

### FN-B5. Groq retired Llama 3.3 70B; default model is gpt-oss-120b

- `groq/llama-3.3-70b-versatile` answered HTTP 404 (Groq's model list no longer has it). The
  catalog adds `groq/openai/gpt-oss-120b` and `groq/openai/gpt-oss-20b` and marks Llama retired
  with gpt-oss-120b as replacement. With `GROQ_API_KEY` the demo app uses gpt-oss-120b; else
  `openai/gpt-4o-mini` (fake without a key; the OpenAI key has no credit, so OpenAI is untested).
- Catalog ids allowed one slash (`provider/name`); hosted model names have their own
  (`openai/gpt-oss-120b`), so the registry now accepts `provider/a/b` (the provider is the first
  segment, as the gateway and Autopilot already split it). `apply` had let the seed through; the
  add checks (catalog-seed test) caught it.

### FN-B6. TTS "stalled" on long replies

- `streamingPost` used one 3 s timeout for the whole body, which is read at playback pace, so
  replies longer than ~3 s were cut with "Deepgram TTS stalled". The timeout now bounds the wait
  for the response and for each next chunk (test added).

### FN-B7. Real voices on the stack, turn latency

- `ops/rebuild/stack ask` (new, `ops/rebuild/ask.cjs`): the caller bot dials through Routr, waits
  for the greeting, says `mods/gateway/scripts/fixtures/question-fonoster.wav` ("What is
  Fonoster?"), measures end of question → first audible answer, saves `heard.wav` and, with
  `RB_TRANSCRIBE=1`, transcribes it with Deepgram.
- Groq gpt-oss-120b + Deepgram nova-3 (hint Fonoster) + Aura-2 thalia, PCMU: turn latency
  1515 ms and 1536 ms; heard: "...Fonoster provides cloud based telephony services, like voice,
  SMS, and call center tools..." twice (sensible). ElevenLabs Sarah: 1334 ms, same quality. The
  agent's own pronunciation of "Fonoster" comes back from transcription as
  "Fodestar"/"Phonoster" (TTS, not recognition).
- Keys go in `ops/rebuild/.local/vendor.env` (`DEEPGRAM_API_KEY`, `ELEVENLABS_API_KEY`,
  `GROQ_API_KEY`, `OPENAI_API_KEY`); `RB_DEFAULT_VOICE` / `RB_DEFAULT_MODEL` override the demo
  app's catalog ids. Documented in docs/try-the-new-platform.md.

### FN-B8. Agents "Talk": call this number (no WebRTC)

- The media node speaks plain SIP/RTP (no DTLS or ICE), and Routr would send a browser agent's
  call to a trunk, not to the app, so the drawer no longer places a WebRTC test call (old
  test-token path). It lists the numbers linked to the agent's app with copy buttons, links to
  Numbers when there is none, and points to a softphone on the local stack. In-browser calls wait
  for WebRTC on the media path.

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

## 2026-10-15 (helm stream: the cloud side in the chart, secret://, observability)

### HE-B1. One chart, three values files; control plane off by default
- `ops/rebuild/helm/fonoster-rebuild` now has apiserver (+ migrations Job), Envoy, dashboard,
  NATS (+ the region hub), dev-grade Postgres and MinIO, and the observability profile.
- Defaults still install only the data plane (gateway, media nodes; opt-in Autopilot and region
  agent), so the private-cell Helm install in `docs/operators/private-region.md` is unchanged.
  `values-cloud.yaml` turns on the whole platform (mirrors `ops/rebuild/compose.yaml`);
  `values-observability.yaml` adds the profile.
- Identity stays embedded in the apiserver, as in the stack: no separate deployable.
- Routr and RTPEngine stay external (their own charts); `values-cloud.yaml` expects Routr at
  `routr:5060` / `routr:51907`.
- NATS, Postgres and MinIO are small in-chart StatefulSets (`nats.deploy`, `postgres.deploy`,
  `minio.deploy`), not subchart dependencies: no `helm dependency update` / Chart.lock or network
  at render time, and Bitnami's images are legacy now (ST-B7). Single replica, for trying the
  platform; production points `nats.url` and the Secrets' URLs at managed services.
- Region templates changed only in wiring: the NATS URL helper, common env (OTLP, POD_NAMESPACE,
  FONOSTER_SECRETS_DIR) and optional `secretMounts`.

### HE-B2. `secret://` references (D8)
- `resolveSecretRefs` in `@fonoster/common` (config/resolveSecretRefs.ts): a string value that is
  exactly `secret://env/NAME`, `secret://file/<absolute path>` or
  `secret://k8s/[<namespace>/]<secret>#<key>` is replaced at startup. k8s references read the
  mounted Secret at `<FONOSTER_SECRETS_DIR>/<secret>/<key>` (default `/var/run/fonoster/secrets`);
  services never call the Kubernetes API (no RBAC needed). A namespace other than POD_NAMESPACE is
  refused. Files lose one trailing newline.
- Applied by `loadServiceConfig` (apiserver, Identity) after `${VAR}` interpolation and before
  validation, and by the gateway, hosted Autopilot and region agent loaders. Errors name the key
  path and the reference, never the value.
- The chart mounts each Secret listed in a service's `secretMounts` at that path; values-cloud.yaml
  holds only references (the deployment suite fails on any secret-looking key that is not one).

### HE-B3. Migrations Job and `--migrate-only` / `--skip-migrations`
- The apiserver entrypoint gained `--migrate-only` (core + Identity migrations, seed, exit) and
  `--skip-migrations`. The chart runs a Job `<release>-apiserver-migrate-<revision>` per revision
  (no Helm hook: a post-install hook would deadlock with `--wait`, a pre-install hook runs before
  the in-chart Postgres exists).
- `--skip-migrations` replicas poll `prisma migrate status` for both schemas (every 5 s, up to
  15 min) before serving: `main()` reads tables at once (password storage migration, owner upsert)
  and would otherwise die silently. Verified on a throwaway Postgres: status exits 1 with pending
  migrations, 0 after deploy.
- `apiserver.migrations.job: false` keeps the Compose behaviour (each replica migrates).

### HE-B4. Gateway RTP address in Kubernetes
- The chart's gateway advertised `0.0.0.0` to the media node (rtp.host without advertiseHost). New
  gateway key `rtp.advertiseHostEnv` (env var holding the address, like `database.urlEnv`); the
  chart sets it to `POD_IP` (downward API) unless `rtp.advertiseHost` is given.
- `gateway.yaml` is now merged (user config + chart's `nats` and `rtp`) instead of concatenated,
  which produced duplicate keys when values set `rtp`.

### HE-B5. Helm merges maps: `workspaceSecrets: { cellSecrets: null }`
- values-cloud.yaml's Autopilot `workspaceSecrets: { source: database }` merged with the default
  `{ cellSecrets: ... }` and the hosted config refused both keys. Found by the deployment suite;
  values-cloud.yaml nulls `cellSecrets`.

### HE-B6. Deployment suite (part of task 1.4)
- `mods/conformance/test/deployment.test.ts` (skips without `helm`): lint for default, cloud +
  observability and private-cell values; render checks; no raw secrets; the rendered
  `fonoster.yaml`, `gateway.yaml`, `autopilot-session.yaml` and `region-agent.yaml` load through
  each service's own loader with Secrets mounted in a temp dir; the chart's copies of
  `config/envoy.yaml` and the observability configs (`files/`) must equal the Compose ones.
- Not done for 1.4: nightly e2e on Compose and Helm, the release gate, `.env` ignored.
- Finding: `mods/common/src/envs.ts` still loads the repository `.env` when
  `NODE_ENV=development` (contradicts "no .env"); left as is, it only affects dev runs.

### HE-B7. No cluster smoke install
- No kind, k3d or minikube on this machine (helm 4.2.2 and kubectl only), so no smoke install; the
  chart is covered by lint, template and the loader checks above. The images
  (`fonoster/apiserver`, `dashboard`, `gateway`, `autopilot-session`, `medianode`) are the stack's
  (`ops/rebuild/docker/*`, `mods/*/Dockerfile`) and are not published.

### HE-B8. Telemetry for the apiserver, region agent and registry utility (task 2.5)
- `Telemetry` gains `startSpan(name, attrs, parent?)` and `traceparent(callRef)`; `startCall` takes
  an optional parent traceparent. Each instance uses its provider's tracer (not the global one), so
  a second `initTelemetry` in one process still exports.
- apiserver: `initTelemetry("fonoster-apiserver")`, a gRPC interceptor (first in the chain, so
  refused calls count) with an `apiserver.grpc` span and `fonoster.apiserver.grpc.requests`
  (method, status); call-record indexing has an `apiserver.records.index` span and
  `fonoster.apiserver.records.indexed` (outcome). Compose passes OTEL to the apiserver now.
- `fonoster-registry`: `registry.command` span and `fonoster.registry.commands` (command,
  outcome), flushed before exit. Region agent: telemetry on `run`.
- OTLP settings stay the standard `OTEL_*` environment (PL-B3), not a key in each YAML.

### HE-B9. Trace propagation over NATS headers
- W3C `traceparent` header: media node → gateway on `call.incoming` (the gateway's `gateway.call`
  span is its child), gateway → media node on every media-control command (`medianode.command`
  span, Go `telemetry.Extract/Traceparent/StartSpan`), gateway → apiserver on a record's index entry.
- The index entry carries it only while the call span is open; records are usually sealed after
  the call ends, so that link is mostly absent. Not propagated: apiserver → gateway (outbound
  placement, hangup), webhook dispatch, region relay.
- Default profile end to end (Compose, project `rb-helm-obs`): a call span with a propagated
  child, a log and a counter sent to the collector came back from Tempo
  (`{ span.fonoster.call_ref = "<ref>" }`, both spans in one trace), Loki (`fonoster_call_ref`) and
  Prometheus (`fonoster_gateway_calls_total`). The Helm profile is render-tested only.

### HE-B10. package-lock.json needs a refresh on a clean checkout
- Not refreshed (shared node_modules). Changes to package.json files since eb40a4a9b that the
  lockfile lacks (this stream added none):
  - new workspace `mods/region-agent` (@fonoster/region-agent): `@fonoster/callrecord`,
    `@fonoster/common`, `@fonoster/logger`, `@prisma/client ^6.19.1`, `@routr/sdk ^2.13.20`,
    `nats ^2.25.0`, `prisma-field-encryption ^1.6.0`, `yaml ^2.9.0`, `zod ^3.25.76`
  - `mods/apiserver`: + `@fonoster/callrecord`, `nkeys.js ^1.1.0`, bin
    `fonoster-region-hub-setup`; − `@deepgram/sdk`, `@google-cloud/speech`,
    `@google-cloud/text-to-speech`, `ari-client`, `@types/ari-client`, `elevenlabs`,
    `microsoft-cognitiveservices-speech-sdk`, `pick-port`, `wait-port`, `wavefile`
  - `mods/common`: + `@opentelemetry/api ^1.9.0`, `@opentelemetry/resources ^1.30.1`,
    `@opentelemetry/sdk-trace-base ^1.30.1`, `@opentelemetry/sdk-trace-node ^1.30.1`
  - `mods/callrecord`: + `@aws-sdk/client-s3 ^3.958.0`
  - `mods/gateway`: + `@prisma/client ^6.19.1`, `prisma-field-encryption ^1.6.0`
  - `mods/autopilot`: − `@fonoster/sdk`, `moment`, `onnxruntime-node`, `uuid`
  - `mods/voice`: − `@fonoster/identity`, `@grpc/grpc-js`, `deepmerge`, `grpc-health-check`,
    `pb-util`, `zod`, `zod-validation-error`; bin `fonoster` removed
  - root `package.json`: scripts only.
- Refresh: `rm -rf node_modules && npm install` on a clean checkout, commit `package-lock.json`.
  Go: no new modules (`otel/propagation` and `sdk/trace/tracetest` are in modules already required).

## 2026-10-15 (audit stream)

### AU-B1. Task lists checked against the code

- Ticked with evidence (noted on each line): conformance 2.5, 3.5, 3.7, 3.8, 3.9; rework-autopilot 5.3;
  add-turn-taking 3.1; add-call-record 7.2; add-platform 2.1, 2.2, 2.4.
- Partial notes added: conformance 3.4, 3.6, 3.10; voice-session-gateway 1.2, 2.6; turn-taking 1.5, 2.2;
  provider-registry 3.1; call-record 7.3; webhooks 3.3; platform 1.1, 1.2, 1.5, 2.3; private-regions 1.3.
- Left open on purpose (needs real calls, dedicated runners, the owner or unbuilt work): conformance
  3.11, 4.2; rework-autopilot 1.4, 8.2, 8.3; provider-registry 4.2, 5.1 to 5.5; call-record 7.4;
  media-node 3.2, 4.3; platform 1.3, 1.4, 2.6, 2.7, 4.1, 4.2; private-regions 4.3, 4.5, 5.9.
## 2026-10-15 (harden stream: NATS users, mTLS, session registry)

### HD-B1. NATS users and subject permissions per service (task 4.1)
- Plain `authorization { users }` in the main and cell NATS, not operator/JWT mode: the services
  are ours and fixed, and the region hub keeps its own operator mode (per-cell users,
  `region.<ref>.>`), untouched.
- One permission file per service, `ops/rebuild/config/nats-permissions/<service>.conf`
  (apiserver, gateway, medianode, routr, region-agent), each defining `<SERVICE>_PERMISSIONS`;
  the main NATS includes apiserver/gateway/medianode/routr, the cell's gateway/medianode/routr/
  region-agent, the chart (`nats.auth`) the services the release runs (Routr always). NATS
  refuses unreferenced variables, hence a file per service rather than one shared file.
- Who may publish what: only nodes `media.*.heartbeat`, `media.*.events.*` and
  `gateway.incoming`; only gateways `callrecord.sealed`, `registry.used`, `gateway.heartbeat`,
  `gateway.calls.*`, `cell.workspacekeys.get`; only the apiserver `calls.create`, `calls.track`,
  `gateway.outbound`, `callrecord.*.maintenance`; `media.*.commands` from gateways and the
  apiserver; `webhooks.events` from gateways and nodes; Routr `routr.>`; the region agent
  `region.>`. Responders use `allow_responses`; everyone may subscribe to `_INBOX.>`.
- Autopilot has no NATS connection, so no user. No Routr subscription beyond `_INBOX.>`.
- Credentials: `nats: { url, user, password }` in fonoster.yaml, gateway.yaml and
  region-agent.yaml (`natsConnectOptions` in @fonoster/common), password
  `secret://env/NATS_<SERVICE>_PASSWORD`; the media node `MEDIANODE_NATS_USER/PASSWORD` (Go
  `secretref`, same reference forms as the TS resolver). Routr's user is in its URL
  (`nats://routr:<pw>@nats:4222`; EdgePort uses jnats, which reads URL user info; not verified
  against a live Routr here), hence hex passwords.
- Stack: `ops/rebuild/stack` generates `NATS_{APISERVER,GATEWAY,MEDIANODE,ROUTR}_PASSWORD` into
  `.local/stack.env` (appended to older files). Compose requires them (`:?`). Cell: four entries
  in `cell.env`. Helm: `nats.auth.enabled` (on in values-cloud.yaml) + Secret
  `fonoster-nats-users`; services get `NATS_<USER>_PASSWORD` from it.
- Open: `_INBOX.>` is shared, so a compromised service can read others' replies (per-service
  inbox prefixes would close it); per-node users (a node impersonating another node) not done.
- Tests: `mods/conformance/test/natsPermissions.test.ts` (opt-in `NATS_ACL_TEST=docker`) runs the
  checked-in main and cell configs in Docker: anonymous and wrong password refused; every flow
  works (media-control both ways, claims, index entries, catalog use, webhooks, maintenance,
  Routr events, BYO keys); 11 forged publishes and 4 subscriptions refused (e.g. a gateway
  cannot publish `media.n1.heartbeat`, a node cannot publish `callrecord.sealed` or
  `calls.create`, Routr cannot send media-control); KV writes only under each owner's prefix,
  nobody may delete the bucket. Deployment suite: chart users, env and permission copies.
  Go writes under ACLs were checked once by hand (nodes.* accepted, calls.* refused).

### HD-B2. Mutual TLS between Routr and the media nodes (task 4.2)
- `MEDIANODE_TLS_CLIENT_CA`: the TLS listener requires and verifies a client certificate signed
  by that CA (`tls.RequireAndVerifyClientCert`); `go/medianode/internal/edgetls` builds the
  configs. With a CA set the node also presents its certificate when it dials or registers over
  TLS. Cert, key and CAs are file paths or `secret://` references whose value is the PEM.
- The trusted-source allowlist (RV-B7) stays on as an extra check. Off by default locally; Helm
  `medianode.tls` (`enabled`, `listen`, `secret` with tls.crt/tls.key/ca.crt, `mutual`) and
  `medianode.trustedSources`. Routr's client certificate is Routr's config (not in this repo).
- Tests: e2e `TestMutualTLSAcceptsTheEdge`, `TestMutualTLSRefusesClientsWithoutAValidCertificate`
  (no certificate, foreign CA), `TestEdgeTLSValidation`; `secretref` unit tests.

### HD-B3. Session registry in JetStream KV (task 2.3; add-media-node 3.2)
- One bucket, `fonoster_sessions` (history 1, max age 15 s), keys `nodes.<id>`, `rooms.<ref>`
  (media node), `calls.<ref>`, `gateways.<ref>` (gateway). Entries are leases: owners rewrite
  them (node every heartbeat, rooms every 5 s, gateway every 5 s) and delete them on a clean
  exit; a crashed owner's entries expire. Key-prefix ownership is what the NATS permissions
  enforce (HD-B1). Separate buckets per kind were not needed: one TTL fits all.
- The node writes room entries itself (inbound and outbound), so the spec's "the control plane
  records the room-to-node mapping" is met by the owner of the room, not the apiserver.
- Placement: the apiserver's node directory reads `nodes.` at start and watches it, using each
  entry's write time (so a stale entry of a crashed node is not offered), and keeps heartbeats
  for immediacy; a restarted replica places calls at once. Without JetStream every service warns
  and keeps heartbeats only (the shared test NATS has no JetStream). Clock skew between the NATS
  server and the apiserver shifts staleness; fine on one host or with NTP.
- `Sessions` in @fonoster/common (openSessions, SessionLeases, watchSessions, getSession; type
  imports from `nats` only); Go `internal/registry` (async single writer, never blocks media).
  `MEDIANODE_SESSION_REGISTRY=false` turns the node's writes off. Gateway option
  `sessions: false | <bucket>`.
- Not done: "No capacity" (at-limit nodes) is still only draining; apiserver hangup through the
  registry (the gateway's hangup endpoint covers it).
- Tests (JetStream, `CONFORMANCE_JETSTREAM_URL`): Go `TestWriterPutsDeletesAndEntriesExpire`,
  e2e `TestNodeWritesTheSessionRegistry`; apiserver "places a call at once after a restart, from
  nodes in the registry", lease expiry; gateway `sessions.test.ts`.

## 2026-10-15 (evals stream: Compose default, ClickHouse)

### EV-B3. The rebuild stack is the Compose default; ClickHouse is profile `analytics` (2.7)

- Verified first: the root `compose.yaml` was still the legacy production stack (0.26.0 images,
  InfluxDB, autoheal, no gateway or media node; Asterisk already gone). `ops/rebuild/compose.yaml`
  has no Asterisk and no InfluxDB, NATS runs JetStream (`config/nats.conf`), and leaf nodes come
  through the `regions` hub (`nats-regions`, 7422).
- Root `compose.yaml` is now only an `include` of `ops/rebuild/compose.yaml` (project directory
  `ops/rebuild`, so its relative paths resolve as before): `docker compose up` from the root runs
  the platform. `ops/rebuild/stack` still calls `ops/rebuild/compose.yaml` directly, unchanged.
  Checked with `docker compose config` both ways.
- `compose.dev.yaml` is now self-contained (the legacy base merged in): the developer services
  for running the TS services from source (`npm run start:services`, the dev container, the
  apiserver publish workflow), all switched to `-f compose.dev.yaml`. NATS there now runs with
  `-js` (the gateway's session registry needs JetStream). InfluxDB stays only in this dev file,
  because the apiserver's legacy call listing still reads it unless `listCallsFromIndex` is set
  (leftover for whoever removes that path; the platform stack lists from the record index).
- ClickHouse: `clickhouse/clickhouse-server:24.8` (the version LO-B6 tested), profile `analytics`,
  database `fonoster`, HTTP on `RB_CLICKHOUSE_PORT` host-only, its own volume. No default password
  (RV-B6): empty means the image allows no network access. The gateway gets `CLICKHOUSE_USER` /
  `CLICKHOUSE_PASSWORD`; `ops/rebuild/stack` generates the password into stack.env and, when
  `RB_PROFILES` contains `analytics`, adds `callRecord.analytics.clickhouse` to gateway.yaml.
  Verified the container's auth setup with the sink's own tests (`clickhouse.test.ts` against a
  throwaway `rb-evals-clickhouse`, 3 passing). Not brought up inside the full stack here.
- Helm: the chart runs no ClickHouse (point the gateway at a managed one); new
  `gateway.analyticsSecret` maps a Secret's `user`/`password` to the two variables (render and
  lint checked, deployment suite green).
- Left as is: the release workflow still seds image tags in the root `compose.yaml`; with the
  include it finds none and reports "already up to date" (the stack builds or takes `RB_TAG`).
