# Design

## Where the probe runs

The call-answered → app-dispatch path for an outbound call:

```
runCallManager  ari.channels.originate(PJSIP/routr/...)      // far end answers -> dialplan -> Stasis
  -> VoiceDispatcher.handleStasisStart
     -> createCreateVoiceClient            // channel vars -> VoiceClientConfig
     -> VoiceClientImpl.connect()
          1. authHandler.checkAuthorization()
          2. Promise.all([setupAudioSocket, setupExternalMedia])   // <-- inbound audio starts here
          3. new SpeechHandler(...)
          3b. AMD PROBE  <-- inserted here
          4. grpcHandler.setupGrpcClient()  // voice.write({request}) -> app handler runs
```

`connect()` is `await`ed by `handleStasisStart`, and step 4 is deliberately last (opening
the session immediately starts the application). Inserting `await runAmdProbe(...)` at 3b
therefore delays dispatch cleanly, with no race, and whatever is written to `config.amd`
rides along in the existing `voice.write({ request: config })` — `GrpcClientHandler` holds
the same `config` object reference.

Audio at 3b is `slin16` (16 kHz mono, 16-bit LE PCM), delivered as `"data"` Buffers on
`transcriptionsStream` — the same stream the Silero VAD in `mods/autopilot` consumes.
Attaching a listener is non-destructive (EventEmitter fan-out); STT does not start until a
`gather` verb, which is after the app runs.

## Outbound only

At `handleStasisStart` an **inbound** channel has not been answered (`Answer()` is a verb the
app issues later), so there is no useful early audio. The probe runs only when
`config.callDirection === TO_PSTN`. Inbound AMD would require answering earlier and is out of
scope.

## Fail-open contract

`runAmdProbe` never throws and never blocks past `AMD_TIMEOUT_MS`. Every failure mode —
model file missing or corrupt, inference error, no audio captured, confidence below
`AMD_MIN_CONFIDENCE` — resolves to `{ status: UNKNOWN }`. The call is dispatched exactly as
it is today; only `req.amd.status` differs.

## Contract shape

`Amd` is a message (not a bare enum) so confidence/detector/latency travel with the verdict
for observability and so a consumer can apply its own confidence policy. Enum value names
(`HUMAN`, `VOICEMAIL`, …) are used verbatim as the hand-written TS enum's string values so
the object round-trips through `@grpc/proto-loader` (`enums: String`). `voice.proto` is
loaded at runtime; the hand-written `VoiceClientConfig` in `mods/common` is the type kept in
sync by hand (as it already is for every other field).

## CDR persistence

The voice path and the CDR writer share one Node process. A process-local
`amdResultCache` (`createPerCallCache`, the same mechanism `createInfluxDbPub` already uses
for `refByCallId`) carries the verdict, keyed by `callRef`. `createInfluxDbPub` reads it
right after it resolves the `ref` tag and adds `amdStatus` / `amdConfidence` / `amdDetector`
/ `amdLatencyMs` fields to the point, which pivot-merge into the existing CDR record. For
outbound (API-originated) calls `callRef` equals the CDR `ref` tag, so the lookup is direct.
The verdict is **not** added to `CallDetailRecord` in `calls.proto`, so it is queryable in
InfluxDB/Flux for analysis but not returned by `GetCall`/`ListCalls` — extending the gRPC
surface can be a follow-up.

## Classifier — in-process, not a sidecar

Fonoster already runs ONNX inference in-process: `@fonoster/autopilot` depends on
`onnxruntime-node` and commits `.onnx` model files. AMD reuses that rather than adding a
container:

- **Model.** `AbijahKaj/whisper-telephony-amd` (whisper-tiny encoder + classifier head, ~8M
  params, Apache-2.0, classes human/voicemail/ivr/answering-machine). The HF repo ships
  safetensors only, so it is converted once to ONNX (`torch.onnx.export`, weights embedded,
  ~33 MB) and committed at `mods/apiserver/amd-model/` (`model.onnx`, `mel_filters.bin`,
  `meta.json`), the same pattern autopilot uses for Silero. `onnxruntime-node` becomes a
  direct dependency of `@fonoster/apiserver` (pinned to autopilot's version) and
  `amd-model/` is added to the published `files`.
- **Feature extraction.** `featureExtractor.ts` is a pure-JS re-implementation of
  `transformers` `WhisperFeatureExtractor` (reflect-padded center STFT, 400-pt naive DFT over
  only the frames that overlap real audio, Slaney mel filterbank loaded from the committed
  `mel_filters.bin`, log10 + clamp + normalize). It is verified bit-close to the Python
  reference by a committed fixture (`fixture.pcm` → `fixture_feat.f32`); the whole JS path
  lands on the same class as the reference.
- **Seam.** `AmdModel.classifyPcm(pcm, modelDir)` lazily creates a cached
  `ort.InferenceSession` (CPU, `intraOpNumThreads: 1` to spare the event loop) and returns
  `{ status, confidence, detector }`. `runAmdProbe` takes `classify` as an injectable
  dependency (default: `classifyPcm`) so a future Asterisk `AMD()` or paid provider can
  replace it without touching the probe or the contract.
- **Cost.** Feature extraction for a 3 s clip is ~50 ms; inference ~10 ms; model load (once)
  ~0.5 s. The dispatch-blocking window is dominated by `AMD_PROBE_MS` audio collection.
- **Before any downstream "enforce" behaviour**, validate the model on real recordings
  (`MixMonitor` WAVs) for Spanish / 8 kHz-telephony robustness; fine-tune only the classifier
  head if recall is weak and point `APISERVER_AMD_MODEL_PATH` at the result.

## Configuration

| env | default | meaning |
|---|---|---|
| `APISERVER_AMD_ENABLED` | `false` | master switch |
| `APISERVER_AMD_MODEL_PATH` | *(bundled)* | override the model directory |
| `APISERVER_AMD_PROBE_MS` | `3000` | leading audio to gather before classifying |
| `APISERVER_AMD_TIMEOUT_MS` | `4000` | hard deadline; on expiry → `UNKNOWN`, dispatch proceeds |
| `APISERVER_AMD_MIN_CONFIDENCE` | `0.8` | verdicts below this are reported as `UNKNOWN` |
