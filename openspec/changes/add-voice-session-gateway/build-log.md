# Build log: add-voice-session-gateway

Decisions made during the build, and anything to review. Each entry can be reversed; the files
it touches are named.

## 2026-10-15 (overnight, owner asleep; decisions taken without review)

### B1. Session message schemas live in `@fonoster/common`

- `mods/common/src/session/schema.ts` holds one JSON Schema per message, written as TypeScript
  `as const` objects. TypeScript types are derived from them with `json-schema-to-ts`
  (`FromSchema`), so types cannot drift from the schemas (task 1.1).
- `mods/common/schema/session.v1.json` is exported from them (`npm run generate:session-schema`)
  for the Python SDK and other languages; a test fails while the export is stale.
- Why `common`: the SDK (`mods/voice`) and Autopilot already depend on it. Rejected: a new
  protocol package (one more package to release for ~400 lines); the gateway package (the SDK
  must not depend on the gateway).
- Python types are generated as TypedDicts into `python/fonoster-voice/src/fonoster/voice/messages.py`
  by `python/generate_messages.py` (no extra tool); a test fails while they are stale.

### B2. The gateway is a new package, `mods/gateway` (`@fonoster/gateway`)

- Own deployable (PL1), binary `fonoster-gateway`. It does not depend on `mods/apiserver`.
- The existing vendor STT/TTS adapters in `mods/apiserver/src/voice` are not moved yet: their
  interfaces (whole-utterance `Readable`, no cancel, no word timings) don't fit the streaming
  session. Only the `fake` adapters exist so far; porting Deepgram/ElevenLabs/Google/Azure to the
  new adapter interface is the next build step and pairs with `add-provider-registry`.

### B3. Nothing destructive yet

- `voice.proto` and `mods/apiserver/src/voice/**` stay (task 3.1 not started). Production calls
  still run through Asterisk and the apiserver; the gateway can only carry real calls once the Go
  media node exists. Until then the gateway runs against the fake media node in the conformance
  suite.

### B4. Local dependency links in this worktree

- This worktree's `node_modules` is a symlink to `fonoster-platform-refresh/node_modules`, whose
  `@fonoster/*` links point at that worktree's packages. `mods/gateway/node_modules/@fonoster/`
  holds symlinks to this worktree's `common`, `logger` and `conformance` (git-ignored). Packages
  are consumed through their `dist`, so rebuild `common` after changing it.

### B5. Inbound routing and app model come from the gateway YAML for now

- `GatewayConfig.apps` lists apps (ref, url, flavor, signing secret, speech defaults, audio format,
  numbers, fallback). A call routes to the app whose `numbers` include the dialed number, else to
  an app with no `numbers` (catch-all), else it is hung up and recorded as `call.unrouted`.
- Task 2.12 (the Application model in the apiserver database, synced to cells) is not done; this
  config is the stand-in the conformance suite needs.

### B6. Turn-taking runs for every native session

- Native sessions always run STT + the baseline Detector + Pacing. Twilio-flavor sessions never do
  (no Speech layer). An audio-only native app therefore still costs STT. Proposed follow-up: an app
  setting (`speech.listen: false`) or starting STT on the first Speech-layer command. Not decided.
- Baseline Detector: energy VAD (RMS > 700, 4 frames on, 10 frames off), eot rises from 0 to 1
  over the silence timeout (default 600 ms) after a final transcript. No backchannel
  classification: any caller speech over output is an interruption. Thresholds: prepare 0.5,
  commit 1.0. All provisional until add-turn-taking's open questions are settled.
- `turn.estimate` is sent at most every 100 ms to subscribers.

### B7. Output queue details the specs left open

- `speak` without `last` is treated as `last: true`; without `interruptible`, as `true`.
- Items without `id` get a gateway id (`gw-<callRef>-<n>`) so `output.*` can always carry one.
- Items dropped by `clear` or `preempt` before they started still get `output.interrupted` with
  `heardMs: 0` and `heardText: ""`, so no SDK promise is left hanging.
- A failed `speak` sends `error` (with `relatesTo`) and no `output.*` events.
- `heardText` uses provider word timings; without them, a proportional cut at a word boundary.
- Queue cap 120 s (design OQ2 proposal) → `queue_full`.
- The gateway sends a continuous RTP stream (silence when idle).

### B8. Outbound calls: control plane → `gateway.outbound`

- The control plane places the call on a node (`room.create`, `participant.dial`) and sends a NATS
  request on `gateway.outbound` (queue group `gateway-outbound`) with `{nodeId, roomRef, appRef,
  callRef?, from, to, metadata}`. The gateway watches the room and opens the app session on
  `call.answered`; other outcomes go to the call record only (VS13). Not yet covered by a scenario.

### B9. Twilio hang-up endpoint auth and routing (design OQ3)

- HTTP Basic with a single `accountSid` / `authToken` pair from the gateway config. Workspace
  credentials (per-workspace token) need the identity service; not done.
- The endpoint runs on every replica and forwards the hang-up over NATS to
  `gateway.calls.<callRef>`, answered only by the owning replica; no responder → 404 / 20404.

### B10. Not implemented yet

- 2.6: Opus (design OQ8 still open). μ-law 8 kHz and PCM16 at any rate work.
- Vendor adapters: Deepgram (STT, TTS) and ElevenLabs (TTS) exist now (see add-provider-registry
  PR3); Google and Azure do not.

### B11. Scenario format grew a `caller` step and `setup.media`

- `caller: {dtmf | hangup | audio}` lets the fake media node act as the caller mid-scenario, and
  `setup.media.dialOutcome` drives transfer and dial outcomes. The fakes harness also serves test
  media (`${media}/tone-<ms>.wav`). Additive to `fonoster.scenario.v1`.
- 36 scenarios (29 voice-session, 7 Twilio flavor) now pass against the gateway; breaking `clear`
  or barge-in makes the matching scenarios fail.

### B12. Listen-only sockets attach through app config (design OQ7)

- `apps[].listeners: [{url, tracks: inbound | outbound | both}]`, at most 4 per app. The gateway
  dials each one when the app's session starts, signed with the app's secret, one attempt (2 s);
  a failure is recorded (`listener.failed`) and the call continues.
- Listeners get `session.start`, every event the controlling app gets (except `turn.estimate`),
  and the chosen tracks as binary frames tagged with track id 1 (caller) or 2 (agent). Commands
  get `error` `read_only`; audio from a listener is dropped.
- Not done: attaching a listener to a running call through the API (needs the control plane).

### B13. T1 timing harness, first numbers (local laptop, not a dedicated runner)

- `repeatScenario` (conformance) runs a scenario N times and reports distributions;
  `mods/gateway/test/timing.test.ts` runs when `CONFORMANCE_TIMING_RUNS` is set and writes JSON
  reports to `CONFORMANCE_REPORT_DIR`.
- 100 runs, 2026-10-15: speak → first audio adds **p95 22 ms** after subtracting the fake TTS's
  200 ms (bar: 50 ms); most of it is waiting for the next 20 ms output tick. `clear` → silence
  **p95 1 ms** (bar: 40 ms).
- Not measured yet: caller audio → STT (the other half of T1). Needs the fake STT to timestamp
  frames against the fake media node's send times.
- `assert` steps accept `from: <label>` so time-based measurements can start at a named step.

### B14. Audio filters copied into the gateway

- `mods/apiserver/src/voice/filters` (chain, factory, aiCoustics) and its tests are copied to
  `mods/gateway/src/filters`, not moved: the apiserver still serves production calls until the
  cutover (task 3.1 removes its copy).
- `apps[].filters` (same `{name, options}` shape as today) build a chain per session. Filtered
  audio feeds STT and turn detection; the app and listeners get the unfiltered caller audio.
  A filter that cannot be created or started is recorded as `filter.failed` and the call goes on
  unfiltered.
- The chain starts asynchronously, so the first frames of a call can pass unfiltered while a
  model loads (the spec says "from the first frame"; buffering until ready is a possible
  follow-up).

### B15. Pipecat golden test passes

- `python/pipecat-golden/golden_bot.py` is a plain Pipecat 1.12.0 bot; nothing Fonoster-specific.
  Against the gateway it hears the caller, is heard, stops on `clear`, gets DTMF, and hangs up via
  `auto_hang_up` + `base_url` (Calls endpoint, 200) and via socket close. Runs only with
  `PIPECAT_PYTHON` set (it needs a Python with pipecat-ai).
- Pipecat detected our `start` message as Twilio with its own `parse_telephony_websocket`.

### B16. `record.note`: apps can annotate the call record

- New additive command `record.note { data }` (at most 16 KB of JSON): appended to the call record
  like every app message, no other effect; oversized notes get `error` `bad_message`. Added to the
  spec, the JSON Schemas, both SDKs (`session.note`) and Autopilot's recorder. Reason: Autopilot's
  per-turn traces had no way into the call record (rework-autopilot AP5).

### B17. First scale numbers (pass bar T2), laptop only

`npx tsx mods/gateway/scripts/scale.ts --calls N --seconds S` runs N concurrent calls through one
gateway **process** (its own event loop, i.e. one core), with the fakes in a separate driver
process. Every call speaks every 3 s and streams caller audio both ways. Apple M4 Pro, Node 22.17:

| Calls | Outbound RTP delivered | Caller audio to app | speak → output.started p95 | Gateway CPU p50 / p95 (one core = 100%) | RSS p95 |
| --- | --- | --- | --- | --- | --- |
| 10 | 99.99% | 99.7% | 25 ms | 12% / 38% | 143 MB |
| 100 | 99.98% | 99.97% | 23 ms | 39% / 54% | 230 MB |
| 250 | 99.97% | 99.96% | 22 ms | 70% / 79% | 173 MB |
| 400 | 99.98% | 99.96% | 23 ms | 94% / 99% | 188 MB |

The missing fraction is window edges, not drops. Caveats before trusting this for capacity: a
cloud vCPU is slower than an M4 core; the fakes do no real work (real STT/TTS adapters add TLS and
vendor framing); no audio filter ran (aiCoustics is CPU-heavy); calls were mostly idle between
speaks. Still, the TypeScript-gateway risk (platform risk table) looks small: T2 asks for 100 calls
on about 2 vCPU, and one core here holds about 4x that. The 10-replica, 1,000-call half of T2 and a
dedicated runner are still to do (conformance 3.10, 4.2).

## 2026-10-15 (morning, with the owner)

### B18. Speech starts on the first Speech-layer command (owner decision, replaces B6's "always")

- STT, filters and turn-taking start with the app's first `speak`, `play`, `subscribe` or
  `listen.update`; an empty `listen.update` just starts listening. The last 500 ms of caller audio
  are kept and fed to STT when it starts, so the first words are not lost. Both SDKs send an empty
  `listen.update` from `gather()` when nothing has started listening yet.
- Scenario `audio-only-no-stt` checks that an audio-only session opens no STT stream.

### B19. `record.note` is internal (owner decision)

- Kept in the protocol and both SDKs for Autopilot's traces, but removed from the public docs,
  marked internal in the SDKs, and reserved in the spec (it may change without a new protocol name).
