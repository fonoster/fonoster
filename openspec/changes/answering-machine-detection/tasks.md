## 1. Contract (`mods/common`)

- [x] 1.1 `voice.proto`: add `message Amd` (`Status` enum + `confidence`, `detector`, `latency_ms`) and `Amd amd = 12` on `CreateSessionRequest`
- [x] 1.2 `voice/voice.ts`: add `AmdStatus` enum + `Amd` type, `amd?: Amd` on `VoiceClientConfig`, export both
- [x] 1.3 Re-export `Amd` / `AmdStatus` from `@fonoster/voice` (`mods/voice/src/types.ts`)

## 2. Probe (`mods/apiserver`)

- [x] 2.1 `voice/amd/featureExtractor.ts`: pure-JS Whisper feature extractor (slin16 -> [1,80,3000]), verified against a committed Python fixture
- [x] 2.2 `voice/amd/AmdModel.ts`: lazy cached `onnxruntime-node` session + `classifyPcm` (softmax -> `id2label` -> `AmdStatus`); `onnxruntime-node` promoted to a direct dep; `amd-model/` in `files`
- [x] 2.3 `voice/amd/runAmdProbe.ts`: buffer `probeMs` of audio (or until the deadline), classify via an injectable `classify` (default in-process), map to `Amd`; never throw; downgrade sub-threshold confidence to `UNKNOWN`
- [x] 2.4 `envs.ts`: `AMD_ENABLED`, `AMD_MODEL_PATH`, `AMD_PROBE_MS`, `AMD_TIMEOUT_MS`, `AMD_MIN_CONFIDENCE`
- [x] 2.5 `VoiceClientImpl.connect()`: run the probe between `SpeechHandler` construction and `setupGrpcClient()`, gated on `AMD_ENABLED` and `callDirection === TO_PSTN`; set `config.amd`

## 3. CDR persistence (`mods/apiserver`)

- [x] 3.1 `events/amdResultCache.ts`: process-local `createPerCallCache` singleton keyed by `callRef`
- [x] 3.2 `VoiceClientImpl.connect()`: write the verdict to the cache
- [x] 3.3 `createInfluxDbPub.ts`: read the cache after `ref` resolution; add `amdStatus` / `amdConfidence` / `amdDetector` / `amdLatencyMs` fields

## 4. Model asset (`mods/apiserver/amd-model`)

- [x] 4.1 One-time convert `AbijahKaj/whisper-telephony-amd` safetensors -> `model.onnx` (weights embedded), verified against the torch reference
- [x] 4.2 Commit `model.onnx`, `mel_filters.bin`, `meta.json`; wire the default path from `__dirname`, overridable via `APISERVER_AMD_MODEL_PATH`
- [ ] 4.3 (follow-up) int8-quantize `model.onnx` (~33 MB -> ~9 MB) once accuracy is validated

## 5. Verification

- [x] 5.1 Unit: `runAmdProbe` returns a high-confidence verdict; UNKNOWN on classifier throw / low confidence / no-audio-before-deadline; classifies a partial window when the probe timer fires; audio listener detaches; resolves within the deadline
- [x] 5.2 Unit: `featureExtractor` matches the reference `WhisperFeatureExtractor` (mean-abs < 2e-3) and is deterministic; `mapLabelToStatus` / `softmaxTop` coverage
- [x] 5.3 Integration: the bundled `model.onnx` loads via `onnxruntime-node` and the full JS path lands on the reference class for the fixture clip
- [x] 5.4 Contract: `@grpc/proto-loader` loads the amended `voice.proto`; `amd` is field 12 -> `Amd`
- [ ] 5.5 Integration (local stack): `CreateCall` to a voicemail number -> app receives `req.amd.status` set; app still runs; CDR row carries `amdStatus`. `AMD_ENABLED=false` -> `req.amd` absent, no added latency
- [ ] 5.6 Model eval: `whisper-telephony-amd` vs. real `MixMonitor` recordings (first ~3 s), per-class precision/recall, Spanish coverage
