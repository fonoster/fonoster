# conformance Specification

## Purpose
The conformance harness: suites, fakes, pass bars and CI cadence that define when the platform is correct.
## Requirements
### Requirement: Suites test only through the public contract

Every conformance suite SHALL interact with the implementation under test only through its public
contract: WebSocket messages for the gateway and SDKs, the registry utility's commands and the
registry database for `provider-registry`, and vCon files and their storage for `call-record`. A
suite MUST NOT import, mock or inspect the implementation's internal modules.

#### Scenario: A rewrite passes the same suite

- **WHEN** the gateway is reimplemented in another language
- **THEN** the session protocol suite runs against it unchanged
- **AND** a pass means the rewrite conforms to `voice-session`

#### Scenario: A suite reaching into internals is rejected

- **WHEN** a proposed conformance test imports a module of the implementation under test
- **THEN** the test is rejected from the conformance suite and belongs with that implementation's own unit tests

### Requirement: Every contract has a fake for each side

The framework SHALL provide fakes so each side of a contract can be tested alone: a fake app and a
fake gateway for the session protocol, a fake media node, fake STT, TTS and LLM providers with
deterministic output and injectable delays and failures, and a caller bot that places real SIP
calls.

#### Scenario: Gateway tested without real vendors

- **WHEN** the session protocol suite runs
- **THEN** the gateway is connected to the fake media node and fake providers
- **AND** no vendor network call is made

#### Scenario: Injected provider failure

- **WHEN** a scenario configures the fake TTS to fail on the next request
- **THEN** the gateway sends an `error` that names the failing command's `id` in `relatesTo`
- **AND** does not switch to another provider

### Requirement: Implementations ship fake provider adapters

Every implementation that uses STT, TTS or LLM providers (the gateway, Autopilot) SHALL include a
`fake` adapter per capability that speaks the fake provider protocol documented in
`mods/conformance/PROVIDERS.md`: TTS as HTTP `POST /v1/synthesize`, STT as a WebSocket at
`/v1/listen`, and LLM as OpenAI-compatible `POST /v1/chat/completions`. The `fake` adapters SHALL
be available only when the deployment enables test mode, and the registry utility MUST refuse to
add a provider with adapter `fake` otherwise.

#### Scenario: A rewrite uses the same fakes

- **WHEN** the gateway is reimplemented in another language
- **THEN** its `fake` adapters reach the same fake providers over the network
- **AND** the session protocol suite runs with no change to the fakes

#### Scenario: Fakes are not available in production

- **WHEN** an operator runs `add-provider fake --adapter fake --capabilities tts` on a deployment without test mode
- **THEN** the command exits non-zero and the registry is unchanged

### Requirement: Scenarios are language-neutral and shared by the SDKs

Conformance scenarios SHALL be data files independent of any programming language, and the
TypeScript and Python SDK suites MUST execute the same scenario files.

#### Scenario: Both SDKs run the same cases

- **WHEN** the SDK suites run
- **THEN** the TypeScript and Python runners load the same scenario files
- **AND** a scenario that passes in one SDK and fails in the other fails the build

#### Scenario: The old handler signature

- **WHEN** an SDK scenario uses an app written with the `(req, res)` handler signature
- **THEN** it passes against the fake gateway exactly as the `(session)` signature does

### Requirement: The harness lives in `mods/conformance`

The fakes, runners and scenario files SHALL live in the `mods/conformance` workspace package. The
scenario files MUST be published with that package so the Python SDK suite and the Go media node's
test runner consume the same files as the TypeScript tests.

#### Scenario: One source of scenario files

- **WHEN** the TypeScript suite, the Python SDK suite and the Go media node runner run
- **THEN** each loads its scenarios from the `mods/conformance` scenario files of the same version
- **AND** no runner keeps a private copy of a shared scenario

### Requirement: Session protocol suite

The session protocol suite SHALL drive the real gateway with a scripted fake app, a fake media
node and fake providers, and MUST cover every message in `voice-session`, ordering and `id`
echoing, `clear`, `mark` and `preempt`, handoff, listener tracks, signature rejection,
unreachable-app retry and fallback, and outbound sessions opening at answer.

#### Scenario: Clear drops queued output and returns marks

- **WHEN** the fake app sends audio, then `mark` named `m1`, then `clear` before `m1` is heard
- **THEN** the gateway sends `mark` with `name: m1` and `cleared: true`
- **AND** no further queued audio reaches the fake media node

#### Scenario: Bad signature

- **WHEN** a fake app verifies connection signatures and the gateway's signing secret is wrong
- **THEN** the app refuses the connection
- **AND** the gateway applies the app's fallback and records the failure as an event

#### Scenario: Unreachable app

- **WHEN** the app's URL refuses connections for longer than the retry window
- **THEN** the caller hears ringing during the retry window
- **AND** the gateway then uses the app's fallback

### Requirement: Gateway latency pass bar (T1)

The gateway timing suite SHALL measure the time the gateway itself adds, with provider time
subtracted. At p95 the gateway MUST add at most 50 ms from `speak` text arriving to the first audio
frame sent to the media node, and at most 50 ms from caller audio arriving to it reaching STT. A
`clear` MUST silence the call within 40 ms.

#### Scenario: Text to first audio

- **WHEN** the fake TTS returns audio after a fixed 200 ms delay
- **AND** 200 `speak` commands are timed
- **THEN** the p95 of (first audio frame time − `speak` time − 200 ms) is at most 50 ms

#### Scenario: Clear

- **WHEN** audio is playing and the app sends `clear`
- **THEN** the fake media node receives no further output audio later than 40 ms after the `clear`

### Requirement: Scale pass bar (T2)

The scale suite SHALL load the gateway with concurrent fake calls. One replica of about 2 vCPU
MUST hold 100 concurrent calls with zero dropped audio frames while meeting T1, and ten replicas
MUST hold 1,000 concurrent calls under the same conditions.

#### Scenario: One replica at 100 calls

- **WHEN** 100 fake calls run concurrently against one replica for the test duration
- **THEN** no audio frame is dropped in either direction
- **AND** T1 is met
- **AND** per-call CPU and memory are reported

#### Scenario: Ten replicas at 1,000 calls

- **WHEN** 1,000 fake calls run against ten replicas
- **THEN** no audio frame is dropped and T1 is met

### Requirement: Turn-taking replay against a baseline

The turn-taking suite SHALL replay a corpus of calls with known turn outcomes through any Turn
Detector and report false cut-offs, delay after a real end of turn, missed barge-ins and
backchannels taken as interruptions. A new detector MUST NOT regress against the baseline
detector beyond an agreed tolerance. The corpus (T3) SHALL start from our own consented calls and
synthetic calls, and MUST include customer calls only when the customer has opted in.

#### Scenario: A new detector regresses

- **WHEN** a candidate detector's false cut-off rate is worse than the baseline's beyond tolerance
- **THEN** the suite fails and reports the calls where the candidate cut the caller off

#### Scenario: Customer calls

- **WHEN** a customer has not opted in
- **THEN** none of their calls enter the corpus

### Requirement: Autopilot suite

The Autopilot suite SHALL drive Autopilot through a fake session that sends scripted turn events,
run the conversation evals, and time Autopilot's own processing. It MUST check the commands sent
in each state, streamed speech, conversation history after an interruption, tool use and handoff.

#### Scenario: History after an interruption

- **WHEN** the fake session reports `output.interrupted` with `heardText` "Your balance is"
- **THEN** Autopilot's history records only "Your balance is" as the agent's last turn

### Requirement: Provider adapter suite

Each STT, TTS and LLM adapter SHALL pass its capability's suite, which MUST verify every feature
the adapter declares in the catalog, that cancellation is prompt, and that vendor errors map to
session `error` codes.

#### Scenario: A declared feature does not work

- **WHEN** a TTS adapter declares word timings but returns none
- **THEN** the adapter suite fails for that adapter

### Requirement: Live provider tests run on demand only (T4)

Tests that call real vendors with real keys SHALL run only when triggered by hand, before a
release or when adding a provider, and MUST NOT run on pull requests or on a schedule.

#### Scenario: Pull request

- **WHEN** a pull request runs CI
- **THEN** no live provider test runs and no vendor credit is spent

### Requirement: Registry utility suite

The registry suite SHALL run the registry utility against a temporary database and MUST cover add,
deprecate and retire for providers, models and voices, impact reports and cascades, retiring
anyway, audit entries, the absence of any secret field, and `plan` and `apply` across two
databases.

#### Scenario: Secrets cannot be stored

- **WHEN** a catalog entry containing an API key field is applied
- **THEN** the utility rejects it and the database is unchanged

#### Scenario: Two regions converge

- **WHEN** a catalog is exported from one database and applied to another
- **THEN** `plan` against the second database reports no differences

### Requirement: Call record suite

The call record suite SHALL check that every call yields a vCon that is valid against the vCon
schema, sealed within the deadline after hangup, with content hashes that match the stored
recording and SIP trace and a signature that verifies. It MUST also kill the gateway mid-call and
check a sealed record still results, and seed personal data to check it is masked in the redacted
copy.

#### Scenario: Gateway crash mid-call

- **WHEN** the gateway process is killed during a call
- **THEN** a sealed, signed vCon for that call still exists containing everything appended before the crash

#### Scenario: Redaction

- **WHEN** a fixture call contains a spoken card number
- **THEN** the redacted copy's transcript masks it and its audio is beeped
- **AND** the sealed original is unchanged

### Requirement: CI cadence

Fake-based suites SHALL run on every pull request. Load suites SHALL run nightly.
A failing suite MUST block the merge of a pull request that affects its contract.

#### Scenario: Pull request touching the gateway

- **WHEN** a pull request changes the gateway
- **THEN** the session protocol, Twilio protocol (fake parts) and SDK suites run before merge

### Requirement: Architecture done is defined by specified suites

A rebuild domain SHALL be considered architecture-done when its OpenSpec change is approved and
its conformance suite is specified: scenarios written, fakes and pass bars defined. Building the
suite and the implementation MUST wait for the owner's approval.

#### Scenario: Marking a domain done

- **WHEN** a domain's change is approved and its scenarios, fakes and pass bars are written down
- **THEN** the domain is architecture-done
- **AND** no build task starts until the owner approves the build

### Requirement: Twilio protocol suite runs an unmodified Pipecat bot

The Twilio protocol suite SHALL run an unmodified Pipecat bot using its Twilio serializer against
the gateway, and MUST cover audio in both directions, barge-in through `clear`, caller DTMF,
hangup by closing the socket, and hangup through Pipecat's `auto_hang_up` with `base_url` pointing
at Fonoster.

#### Scenario: Pipecat hangs up through the compatible endpoint

- **WHEN** the Pipecat bot ends its pipeline with `auto_hang_up` enabled and `base_url` set to Fonoster
- **THEN** the gateway receives the hang-up request and ends the call
- **AND** the call record shows `session.end` with `reason: app_hangup`

