# answering-machine-detection

## ADDED Requirements

### Requirement: Early AMD probe on outbound calls

When enabled, the apiserver SHALL classify the answerer of an outbound call from its early
audio before the voice application is dispatched, and SHALL never let that classification
delay dispatch beyond a configured timeout or prevent dispatch on failure.

#### Scenario: Probe runs before application dispatch

- WHEN an outbound call (`call_direction` = `TO_PSTN`) is answered and AMD is enabled
- THEN the apiserver buffers up to `AMD_PROBE_MS` of inbound audio after media is established
- AND classifies it in-process with the bundled model
- AND attaches the resulting verdict to the session request as `amd`
- AND only then opens the voice session that starts the application

#### Scenario: Fail-open on classifier failure

- WHEN the classifier returns an error, is unreachable, or does not respond within `AMD_TIMEOUT_MS`
- THEN `amd.status` is `UNKNOWN`
- AND the voice application is dispatched exactly as it would be with AMD disabled

#### Scenario: Fail-open on low confidence

- WHEN the classifier returns a verdict with confidence below `AMD_MIN_CONFIDENCE`
- THEN `amd.status` is `UNKNOWN`
- AND `amd.confidence` still carries the reported score

#### Scenario: Inbound calls are not probed

- WHEN a call is inbound (`call_direction` != `TO_PSTN`)
- THEN no probe runs
- AND `amd` is absent / `AMD_STATUS_UNSPECIFIED` on the session request

#### Scenario: Disabled by default

- WHEN `APISERVER_AMD_ENABLED` is not `true`
- THEN no probe runs, no classifier is contacted, and dispatch timing is unchanged
- AND `amd` is absent / `AMD_STATUS_UNSPECIFIED`

### Requirement: AMD verdict on the session request

The `CreateSessionRequest` (`VoiceRequest`) delivered to a voice application SHALL be able to
carry an `Amd` verdict describing the answerer.

#### Scenario: Verdict fields

- WHEN a probe produces a verdict
- THEN `amd.status` is one of `HUMAN`, `MACHINE`, `VOICEMAIL`, `IVR`, `UNKNOWN`
- AND `amd.confidence` is a number in `[0, 1]`
- AND `amd.detector` identifies the classifier that produced it
- AND `amd.latency_ms` is the wall-clock time the probe took

#### Scenario: Application decides how to react

- WHEN a voice application receives a session request with `amd`
- THEN reacting to it (proceeding, leaving a message, navigating a menu, hanging up) is the
  application's responsibility and is not imposed by the platform

### Requirement: AMD verdict persisted to the call record

When a probe runs for a call, its verdict SHALL be recorded on that call's CDR for offline
analysis.

#### Scenario: CDR carries the verdict

- WHEN a probe produces a verdict for an outbound call
- THEN the call's `cdr` record includes `amdStatus`, `amdConfidence`, `amdDetector`, and
  `amdLatencyMs`
- AND these values share the call's existing `ref` / `callId` identity so they merge into the
  single record for that call

### Requirement: Swappable classifier

Classification SHALL run in-process from a bundled model, behind a narrow `classify` seam so
the model — or the whole detector — can change without touching the probe or the contract.

#### Scenario: Bundled model

- WHEN AMD is enabled and `APISERVER_AMD_MODEL_PATH` is unset
- THEN the apiserver loads the model shipped with `@fonoster/apiserver` (`model.onnx`,
  `mel_filters.bin`, `meta.json`)
- AND classifies leading call audio as one of `human` / `voicemail` / `ivr` / `machine` with
  a confidence in `[0, 1]`, mapped onto `Amd.Status`

#### Scenario: Model is swappable

- WHEN `APISERVER_AMD_MODEL_PATH` points at a directory with the same three files
- THEN the apiserver loads that model instead, with no code change
- AND the `detector` reported on the verdict reflects the loaded model
