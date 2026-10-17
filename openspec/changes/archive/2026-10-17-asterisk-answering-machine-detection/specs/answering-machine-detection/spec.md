# answering-machine-detection

## ADDED Requirements

### Requirement: AMD on outbound calls

When enabled, the platform SHALL classify the answerer of an outbound call before the voice
application is dispatched, and SHALL never prevent dispatch on failure.

#### Scenario: AMD runs before application dispatch

- WHEN an outbound call is originated and AMD is enabled
- THEN the media server runs `AMD()` in the dialplan after the far end answers and before the
  channel enters Stasis
- AND the apiserver reads the resulting `AMDSTATUS` off the channel
- AND attaches the mapped verdict to the session request as `amd`
- AND only then opens the voice session that starts the application

#### Scenario: Fail-open on an inconclusive or missing verdict

- WHEN `AMD()` reports `NOTSURE` or `HANGUP`
- THEN `amd.status` is `UNKNOWN` and `amd.confidence` is `0`
- AND the voice application is dispatched exactly as it would be with AMD disabled

#### Scenario: Fail-open on a media server without the AMD dialplan

- WHEN the channel carries no `AMDSTATUS` variable
- THEN `amd` is absent from the session request
- AND the call proceeds unchanged, with no error

#### Scenario: Fail-open on a media server without the AMD application

- WHEN the dialplan gate is taken but `app_amd` is not loaded on the media server
- THEN the call continues to Stasis rather than being hung up
- AND `amd` is absent from the session request

#### Scenario: Inbound calls are not classified

- WHEN a call is inbound
- THEN `AMD_ENABLED` is never set on the channel, so `AMD()` does not run
- AND the apiserver does not look for a verdict on the channel
- AND `amd` is absent from the session request

#### Scenario: Disabled by default

- WHEN `APISERVER_AMD_ENABLED` is not `true`
- THEN `AMD_ENABLED` is not set at originate, `AMD()` does not run, and dispatch timing is unchanged
- AND `amd` is absent from the session request

### Requirement: AMD verdict on the session request

The `CreateSessionRequest` (`VoiceRequest`) delivered to a voice application SHALL be able to carry
an `Amd` verdict describing the answerer.

#### Scenario: Verdict fields

- WHEN AMD produces a verdict
- THEN `amd.status` is one of `HUMAN`, `MACHINE`, `VOICEMAIL`, `IVR`, `UNKNOWN`
- AND `amd.confidence` is a number in `[0, 1]`
- AND `amd.detector` identifies the detector that produced it
- AND `amd.latency_ms` is the wall-clock time the detection took, or `0` when the detector does not
  measure it

#### Scenario: An absent verdict is undefined, not UNSPECIFIED

- WHEN AMD did not run for a call
- THEN the voice application receives no `amd` field at all, because the proto is loaded with
  `defaults: false`
- AND applications null-check `req.amd` rather than comparing against `AMD_STATUS_UNSPECIFIED`

#### Scenario: Application decides how to react

- WHEN a voice application receives a session request with `amd`
- THEN reacting to it (proceeding, leaving a message, navigating a menu, hanging up) is the
  application's responsibility and is not imposed by the platform

### Requirement: Detector identification and limits

A verdict SHALL identify the detector that produced it, so consumers can reason about what the
verdict can and cannot express.

#### Scenario: The Asterisk detector reports itself

- WHEN the verdict comes from Asterisk's `AMD()` application
- THEN `amd.detector` is `asterisk-amd@1`

#### Scenario: The Asterisk detector never reports VOICEMAIL or IVR

- WHEN the verdict comes from `asterisk-amd@1`
- THEN `amd.status` is only ever `HUMAN`, `MACHINE`, or `UNKNOWN`
- AND a consumer reads `MACHINE` as "an answering machine, possibly a voicemail greeting"

#### Scenario: Confidence from a deterministic detector

- WHEN `asterisk-amd@1` reaches a decision
- THEN `amd.confidence` is `1`, which reflects a hard decision rather than a probability
- AND when it does not reach a decision, `amd.confidence` is `0`

### Requirement: AMD verdict on the call detail record

A verdict SHALL be persisted onto the call's CDR so detection quality can be analysed and tuned
offline.

#### Scenario: Verdict fields on the CDR

- WHEN a call with an AMD verdict reaches its terminal event
- THEN the `cdr` measurement carries `amdStatus`, `amdConfidence`, `amdDetector`, `amdLatencyMs`,
  and `amdCause` for that call's `ref`

#### Scenario: The cause is CDR-only

- WHEN a verdict carries Asterisk's `AMDCAUSE`
- THEN it is written to the CDR for threshold tuning
- AND it is not exposed on the session request
