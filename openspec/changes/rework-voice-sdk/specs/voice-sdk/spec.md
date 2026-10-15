# voice-sdk

## ADDED Requirements

### Requirement: VoiceServer accepts gateway sessions over WebSocket

The SDK SHALL provide a `VoiceServer` that accepts WebSocket connections from the
VoiceSessionGateway and runs the app's handler once per session. It MUST be usable standalone
(listening on its own port) or mounted into an existing Express (TypeScript) or ASGI/FastAPI
(Python) application.

#### Scenario: A call reaches a standalone server

- **WHEN** the gateway opens a WebSocket to a `VoiceServer` listening on port 3000 and sends
  `session.start`
- **THEN** the SDK invokes the registered handler exactly once with a session for that call
- **AND** the session exposes `callRef`, `sessionRef`, `appRef`, `direction`, `from`, `to`,
  `metadata` and `handoff` from `session.start`

#### Scenario: Mounted into an existing application

- **WHEN** the app mounts the SDK middleware at `/voice` and the gateway connects to that path
- **THEN** the handler runs exactly as it would on a standalone server

### Requirement: Connections are verified before the handler runs

The SDK SHALL verify the gateway's HMAC-signed connection request with the app's signing secret
and MUST reject a connection whose signature is missing, invalid or outside the allowed time
window before invoking the handler.

#### Scenario: Valid signature

- **WHEN** the gateway connects with a signature computed from the URL and timestamp with the
  app's signing secret
- **THEN** the connection is accepted and the handler runs

#### Scenario: Invalid or stale signature

- **WHEN** a client connects with a wrong signature, no signature, or a timestamp outside the
  allowed window
- **THEN** the SDK closes the connection without invoking the handler
- **AND** logs the rejection reason

#### Scenario: Local development

- **WHEN** the server is started with verification disabled for local development
- **THEN** connections are accepted without a signature
- **AND** every accepted connection logs a warning that verification is off

### Requirement: Session and legacy handler signatures

`listen()` SHALL accept a handler of the form `(session)` and a handler of the form `(req, res)`.
The legacy form MUST be a thin wrapper over the same session, so both forms produce identical
session messages for the same calls.

#### Scenario: A legacy handler keeps working

- **WHEN** an app registers `async (req, res) => { await res.say("Hello"); await res.hangup(); }`
- **THEN** the SDK sends `speak` with `text: "Hello"` and `last: true`, waits for its
  `output.done`, then sends `hangup`

#### Scenario: Both forms are equivalent

- **WHEN** the same call script is written once as a `(session)` handler and once as a
  `(req, res)` handler
- **THEN** both produce the same sequence of session messages against the same scenario

### Requirement: say speaks text and reports what was heard

`say(text, options?)` SHALL send a `speak` command with a fresh `id`, the text, and `last: true`,
and MUST resolve with `{ interrupted, heardText, heardMs }` when the gateway reports
`output.done` or `output.interrupted` for that `id`. Options `voice`, `language`, `interruptible`
and `preempt` MUST be passed through on the `speak` message.

#### Scenario: Fully heard

- **WHEN** the app calls `say("Your balance is ten dollars")`
- **AND** the gateway sends `output.done` with the same `id`
- **THEN** `say` resolves with `interrupted: false` and `heardText` equal to the full text

#### Scenario: Interrupted

- **WHEN** the app calls `say("Your balance is ten dollars")`
- **AND** the gateway sends `output.interrupted` with `heardText: "Your balance"` and
  `heardMs: 900`
- **THEN** `say` resolves with `interrupted: true`, `heardText: "Your balance"` and
  `heardMs: 900`

#### Scenario: Voice override

- **WHEN** the app calls `say("Hola", { voice: "elevenlabs/rachel", language: "es" })`
- **THEN** the `speak` message carries `voice: "elevenlabs/rachel"` and `language: "es"`

### Requirement: say streams text as it is produced

`say(stream)` SHALL accept an async iterable of strings, send each piece as a `speak` message
sharing one `id` with `last: false`, and finish with a `speak` carrying `last: true`. It MUST
resolve exactly like `say(text)`.

#### Scenario: Streaming LLM tokens

- **WHEN** the app calls `say(tokens)` where `tokens` yields `"Hello"`, `" there"`, `"!"`
- **THEN** the SDK sends three `speak` messages with the same `id` as the pieces arrive
- **AND** then a `speak` with that `id` and `last: true`
- **AND** `say` resolves when `output.done` or `output.interrupted` arrives for that `id`

#### Scenario: The stream fails midway

- **WHEN** the iterable throws after the first piece
- **THEN** the SDK sends `speak` with `last: true` for that `id` so the utterance ends
- **AND** `say` rejects with the iterable's error

### Requirement: stopSay clears queued output

`stopSay()` SHALL send `clear`, and every pending `say` or `play` promise MUST resolve as
interrupted when the gateway reports `output.interrupted` for its `id`.

#### Scenario: Cutting the agent off

- **WHEN** a `say` is playing and the app calls `stopSay()`
- **THEN** the SDK sends `clear`
- **AND** the pending `say` resolves with `interrupted: true`

### Requirement: gather is built from events

`gather(options)` SHALL keep today's options (`source`, `maxDigits`, `finishOnKey`, `timeout`)
and MUST be implemented in the SDK from `turn.ended` and `dtmf` events, without a dedicated
protocol message.

#### Scenario: Speech

- **WHEN** the app calls `gather({ source: "speech" })`
- **AND** the gateway sends `turn.ended` with `text: "Pedro"`
- **THEN** `gather` resolves with `{ speech: "Pedro" }`

#### Scenario: Digits with a finish key

- **WHEN** the app calls `gather({ maxDigits: 4, finishOnKey: "#" })`
- **AND** the gateway sends `dtmf` events `1`, `2`, `#`
- **THEN** `gather` resolves with `{ digits: "12" }`

#### Scenario: Digits up to the maximum

- **WHEN** the app calls `gather({ maxDigits: 4 })` and four `dtmf` events arrive
- **THEN** `gather` resolves with the four digits without waiting for a finish key

#### Scenario: Timeout

- **WHEN** the app calls `gather({ source: "speech_and_dtmf", timeout: 5000 })` and no
  `turn.ended` or `dtmf` arrives within 5 seconds
- **THEN** `gather` resolves with neither `speech` nor `digits`

#### Scenario: First input wins

- **WHEN** `gather({ source: "speech_and_dtmf" })` is pending and a `dtmf` event arrives before
  any `turn.ended`
- **THEN** `gather` collects digits and ignores speech until it resolves

### Requirement: Events are exposed as subscriptions

The session SHALL expose `on(event, callback)` for `turn.user_started`, `turn.likely_ended`,
`turn.ended`, `turn.resumed`, `turn.backchannel`, `transcript.partial`, `turn.estimate`, `dtmf`,
`error` and `end`. Opt-in events MUST be requested with `subscribe([...])`, which sends the
`subscribe` message.

#### Scenario: Listening for keypresses at any time

- **WHEN** the app registers `session.on("dtmf", cb)` and the caller presses `0` mid-sentence
- **THEN** `cb` is called with `{ digit: "0" }`

#### Scenario: Opting into partial transcripts

- **WHEN** the app calls `session.subscribe(["transcript.partial"])`
- **THEN** the SDK sends `subscribe` with `events: ["transcript.partial"]`
- **AND** subsequent `transcript.partial` events reach the registered callbacks

### Requirement: Call control methods map one to one

`play`, `playDtmf`, `transfer`, `hold`, `resume`, `handoff` and `hangup` SHALL each send exactly
one corresponding session message (`play`, `dtmf.send`, `transfer`, `hold`, `resume`, `handoff`,
`hangup`). The legacy `dial` MUST remain on the `(req, res)` wrapper as an alias of `transfer`.

#### Scenario: Transfer

- **WHEN** the app calls `transfer("+15551234567")`
- **THEN** the SDK sends `transfer` with `to: "+15551234567"`
- **AND** when the gateway ends the session with `reason: transfer`, the call resolves

#### Scenario: Handoff

- **WHEN** the app calls `handoff("app-escalation", { reason: "angry caller" })`
- **THEN** the SDK sends `handoff` with that app and payload
- **AND** the session ends with `reason: handoff`

#### Scenario: Legacy dial

- **WHEN** a legacy handler calls `res.dial("+15551234567")`
- **THEN** the SDK sends `transfer` with `to: "+15551234567"`

### Requirement: Raw audio access

The session SHALL expose `audio.onFrame(cb)`, `audio.send(bytes)`, `audio.mark(name)` and
`audio.clear()`, mapping to incoming binary frames, outgoing binary frames, `mark` and `clear`.
`audio.mark` MUST resolve with `{ cleared }` when the gateway echoes that mark.

#### Scenario: Bring-your-own TTS

- **WHEN** the app sends PCM frames with `audio.send` and then calls `audio.mark("r1")`
- **THEN** the SDK sends binary frames followed by `mark` with `name: "r1"`
- **AND** `mark` resolves with `cleared: false` when the gateway reports the mark was heard

#### Scenario: Mark dropped by clear

- **WHEN** a mark is pending and the app calls `audio.clear()`
- **THEN** the mark resolves with `cleared: true`

### Requirement: answer is a no-op

`answer()` SHALL resolve immediately and MUST NOT send any message, because the gateway answers
the call once the app's connection is verified.

#### Scenario: Old apps that answer first

- **WHEN** a legacy handler calls `await res.answer()` before `res.say("Hi")`
- **THEN** no message is sent for `answer`
- **AND** the `speak` for "Hi" is the first command on the socket

### Requirement: Removed methods fail clearly

`record`, `setAudioFilters`, `mute` and `unmute` SHALL NOT exist in the TypeScript types. Calling
them from JavaScript or Python MUST raise an error that names the replacement (recording policy,
app audio filter configuration, or `hold`).

#### Scenario: A JavaScript app still calls record

- **WHEN** an untyped app calls `res.record()`
- **THEN** the call throws an error stating that recording is now an app policy

### Requirement: Errors and session end never leave promises hanging

A gateway `error` whose `relatesTo` matches a command `id` SHALL reject that command's promise
with a `SessionError` carrying `code`, `message` and `fatal`. When the session ends or a fatal
error arrives, every pending promise MUST reject with `SessionEndedError`.

#### Scenario: Provider failure during say

- **WHEN** the app calls `say("Hi")` and the gateway sends `error` with `relatesTo` set to that
  `speak` id and `code: provider_unavailable`
- **THEN** `say` rejects with a `SessionError` whose `code` is `provider_unavailable`

#### Scenario: Caller hangs up mid-gather

- **WHEN** `gather()` is pending and the gateway sends `session.end` with
  `reason: caller_hangup`
- **THEN** `gather` rejects with `SessionEndedError`
- **AND** `session.on("end")` callbacks receive `reason: caller_hangup`

### Requirement: TypeScript and Python parity

The TypeScript and Python SDKs SHALL be released together and MUST both pass every
language-neutral SDK scenario from the conformance framework against the fake gateway before
release.

#### Scenario: A shared scenario

- **WHEN** the scenario "say interrupted then gather digits" runs against both SDKs
- **THEN** both send the same messages in the same order with the same fields
- **AND** both return the same results to the handler
