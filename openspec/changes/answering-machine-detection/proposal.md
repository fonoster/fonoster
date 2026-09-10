## Why

An outbound call's voice application is dispatched the moment the far end answers, with no
knowledge of *what* answered. A live person, a voicemail greeting, and an IVR menu all look
identical to the application until it has already started talking. Downstream products
(e.g. QCobro's AI-voice collections) need that classification *before* the conversation
starts so they can decide whether to proceed, leave a message, navigate a menu, or hang up.

Fonoster has no answering-machine detection today. `CreateSessionRequest` (`VoiceRequest`)
carries no such field, and nothing taps the early call audio for classification.

## What Changes

- **A short AMD probe on outbound calls.** After media is established and before the voice
  application is dispatched, the apiserver buffers the first few seconds of inbound audio and
  classifies it. The probe is time-bounded and always fail-open: any error or timeout yields
  `UNKNOWN` and the call proceeds unchanged.
- **A new `amd` field on `VoiceRequest`.** `CreateSessionRequest` gains an `Amd` message —
  `status` (`AMD_STATUS_UNSPECIFIED` | `HUMAN` | `MACHINE` | `VOICEMAIL` | `IVR` | `UNKNOWN`),
  `confidence`, `detector`, `latency_ms`. Absent / `UNSPECIFIED` when the probe did not run.
- **In-process classification.** A small ONNX model (whisper-tiny encoder + classifier head,
  ~8M params, from `AbijahKaj/whisper-telephony-amd`) plus a pure-JS re-implementation of
  Whisper's feature extractor run inside the apiserver via `onnxruntime-node` — the same
  runtime `@fonoster/autopilot` already uses for Silero VAD. No sidecar, no network hop, no
  extra deploy unit. The model files are bundled with `@fonoster/apiserver` and swappable via
  `APISERVER_AMD_MODEL_PATH`; a future Asterisk `AMD()` or paid provider can replace the
  `classify` seam.
- **The verdict is persisted onto the call's CDR** (InfluxDB `cdr` measurement:
  `amdStatus`, `amdConfidence`, `amdDetector`, `amdLatencyMs`) for offline analysis.
- **Global, off-by-default configuration** via `APISERVER_AMD_*` env vars.

This change delivers the *signal* only. How a voice application reacts to `req.amd`
(hang up, leave a message, drive DTMF) is left to the application and is out of scope.

## Capabilities

### New Capabilities

- `answering-machine-detection`: An optional, fail-open probe that classifies the answerer of
  an outbound call from its early audio and delivers the verdict on the session request and
  the call's CDR, before the voice application is dispatched.

## Impact

- **`mods/common`**: `voice.proto` `CreateSessionRequest` gains field 12 (`Amd amd`) and a new
  `Amd` message; the hand-written `VoiceClientConfig`/`VoiceRequest` type gains `amd?`.
  `voice.proto` is runtime-loaded, so no proto codegen runs for the voice path.
- **`mods/apiserver`**: new `voice/amd/` (`featureExtractor` + `AmdModel` + `runAmdProbe`), a
  call in `VoiceClientImpl.connect()` between speech-handler setup and gRPC dispatch, an
  `amdResultCache` bridged into `createInfluxDbPub`, `onnxruntime-node` promoted to a direct
  dependency, an `amd-model/` directory added to the published `files`, and five `AMD_*` envs.
- **Behavioural impact when enabled**: outbound app dispatch is delayed by up to the probe
  timeout (~3–4 s of early media, dominated by audio collection; feature extraction +
  inference are tens of milliseconds). Zero impact when `APISERVER_AMD_ENABLED` is unset.
- **Out of scope**: any application-level reaction to `req.amd`; inbound-call AMD (the
  channel is not answered at probe time); per-call enable via `CreateCallRequest`; exposing
  the verdict through the `GetCall`/`ListCalls` gRPC responses (it lands in InfluxDB only);
  streaming early-exit classification.
