## Why

An outbound call's voice application is dispatched the moment the far end answers, with no
knowledge of *what* answered. A live person and a voicemail greeting look identical to the
application until it has already started talking. Downstream products (e.g. QCobro's AI-voice
collections) need that classification *before* the conversation starts so they can decide
whether to proceed, leave a message, or hang up.

PR #889 (`feat/voice-amd`) delivers this with an in-process ONNX classifier. That is the better
long-term detector, but it carries a 33 MB model committed to git, a new `onnxruntime-node`
dependency in the apiserver, a hand-written Whisper feature extractor, and no accuracy evaluation
against real telephony audio yet. It will be a while before it can merge, and we need the signal
in production now.

This change ships **the same contract, backed by Asterisk's built-in `AMD()` application**.

## What Changes

- **`AMD()` in the dialplan on outbound calls.** `[local-ctx-common]` runs `AMD()` between
  `MixMonitor` and `Stasis`, gated on an `AMD_ENABLED` channel variable that only the apiserver
  sets, and only at originate time. The verdict lands in `AMDSTATUS` / `AMDCAUSE` before the
  channel enters Stasis.
- **Thresholds in `asterisk/config/amd.conf`**, read by `app_amd`. `total_analysis_time` is 4000 ms
  rather than the Asterisk sample's 5000 to bound the dispatch delay.
- **A new `amd` field on `VoiceRequest`.** `CreateSessionRequest` gains an `Amd` message —
  `status` (`AMD_STATUS_UNSPECIFIED` | `HUMAN` | `MACHINE` | `VOICEMAIL` | `IVR` | `UNKNOWN`),
  `confidence`, `detector`, `latency_ms` — byte-identical to PR #889 so that PR rebases onto this
  one as a no-op and narrows to "swap the detector".
- **`AMDCAUSE` is persisted onto the call's CDR** (InfluxDB `cdr` measurement: `amdStatus`,
  `amdConfidence`, `amdDetector`, `amdLatencyMs`, `amdCause`) for offline threshold tuning.
- **One global, off-by-default env**, `APISERVER_AMD_ENABLED`.

This change delivers the *signal* only. How a voice application reacts to `req.amd` (hang up,
leave a message, drive DTMF) is left to the application and is out of scope.

## Capabilities

### New Capabilities

- `answering-machine-detection`: An optional, fail-open classification of the answerer of an
  outbound call, delivered on the session request and the call's CDR before the voice application
  is dispatched.

## Impact

- **`asterisk/`**: `config/extensions.conf` gains two priorities; new `config/amd.conf`. Requires a
  release of the `fonoster/asterisk:20` image. The dialplan is **inert** unless `AMD_ENABLED` is
  set, so the new image is behaviourally identical to the old one and the apiserver and media
  server can be released in either order.
- **`mods/common`**: `voice.proto` `CreateSessionRequest` gains field 12 (`Amd amd`) and a new
  `Amd` message; the hand-written `VoiceClientConfig` type gains `amd?`. `voice.proto` is
  runtime-loaded, so no proto codegen runs for the voice path.
- **`mods/apiserver`**: new `voice/amd/mapAsteriskAmd.ts`, two `ChannelVar` entries, two extra
  `getChannelVar` reads in `createCreateVoiceClient`, one originate variable in `runCallManager`,
  an `amdResultCache` bridged into `createInfluxDbPub`, and one env. No new dependency.
- **Behavioural impact when enabled**: outbound app dispatch is delayed until `AMD()` decides, up
  to `total_analysis_time` (4 s). `AMD()` returns as soon as it decides, so the typical case is
  well under that. Zero impact when `APISERVER_AMD_ENABLED` is unset.
- **Out of scope**: any application-level reaction to `req.amd`; inbound-call AMD (the channel is
  not answered at `[local-ctx-common]` time); per-call enable via `CreateCallRequest`; exposing the
  verdict through the `GetCall`/`ListCalls` gRPC responses (it lands in InfluxDB only).
