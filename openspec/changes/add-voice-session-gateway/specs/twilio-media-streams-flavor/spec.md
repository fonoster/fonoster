# twilio-media-streams-flavor

## ADDED Requirements

### Requirement: Twilio Media Streams messages

For apps with flavor `twilio`, the gateway SHALL speak the Twilio Media Streams bidirectional
protocol: `connected`, `start`, `media`, `dtmf`, `mark` and `stop` toward the app; `media`, `mark`
and `clear` from the app. The session SHALL be the same one the `native` flavor exposes, restricted
to audio, marks, clears and caller DTMF.

#### Scenario: Stream opening
- **WHEN** a call reaches a `twilio`-flavor app
- **THEN** the app first receives `{ "event": "connected", "protocol": "Call", "version": "1.0.0" }`
- **AND** then receives `start` with `streamSid`, `callSid`, `accountSid`, `tracks: ["inbound"]`, `customParameters` and `mediaFormat` `{ "encoding": "audio/x-mulaw", "sampleRate": 8000, "channels": 1 }`

#### Scenario: Ids map to the session
- **WHEN** the `start` message is sent
- **THEN** `callSid` equals the session's `callRef`, `streamSid` equals its `sessionRef`, and `accountSid` identifies the workspace

#### Scenario: Stream end
- **WHEN** the caller hangs up
- **THEN** the app receives `stop` and the socket closes

### Requirement: μ-law 8 kHz audio in base64

Audio in both directions SHALL be μ-law at 8000 Hz, mono, base64-encoded in `media.payload`,
without file headers. Caller audio SHALL carry `track: "inbound"`, `chunk` and `timestamp`
(milliseconds since stream start).

#### Scenario: Caller audio
- **WHEN** the caller speaks
- **THEN** the app receives `media` messages with `media.track: "inbound"`, increasing `chunk`, and base64 μ-law payloads

#### Scenario: Agent audio
- **WHEN** the app sends `{ "event": "media", "streamSid": "...", "media": { "payload": "<base64 μ-law>" } }`
- **THEN** the caller hears that audio in the order it was received

### Requirement: Clear and mark follow Twilio semantics

`clear` SHALL empty all queued agent audio. `mark` SHALL be echoed when the audio queued before it
finishes playing, and every mark still pending SHALL be echoed when `clear` empties the queue.

#### Scenario: Barge-in
- **WHEN** the app sends `media`, then `mark` `{ "name": "reply-1" }`, then `clear` before the audio finishes
- **THEN** playback stops within 40 ms
- **AND** the app receives `mark` with `name: "reply-1"`

#### Scenario: Mark reached
- **WHEN** the app sends 1 s of audio followed by `mark` `{ "name": "m1" }`
- **THEN** the app receives `mark` `m1` after the audio has played

### Requirement: Caller DTMF

The gateway SHALL send `dtmf` with `dtmf.track: "inbound_track"` and `dtmf.digit` when the caller
presses a key.

#### Scenario: Keypress
- **WHEN** the caller presses `5`
- **THEN** the app receives `{ "event": "dtmf", "dtmf": { "track": "inbound_track", "digit": "5" } }`

### Requirement: Hanging up from a Twilio-flavor app

Closing the socket SHALL hang up the call. The platform SHALL also expose a Twilio-compatible
endpoint, `POST {base}/2010-04-01/Accounts/{accountSid}/Calls/{callSid}.json` with
`Status=completed` and HTTP Basic authentication, which hangs up the call and returns HTTP 200. An
already-ended call SHALL return HTTP 404 with Twilio error code `20404`.

#### Scenario: Pipecat auto_hang_up with base_url
- **WHEN** an unmodified Pipecat bot using `TwilioFrameSerializer` with `auto_hang_up` enabled and `base_url` pointing to Fonoster ends its pipeline
- **THEN** its POST to the Calls endpoint hangs up the call
- **AND** the response is HTTP 200

#### Scenario: Socket closed
- **WHEN** a `twilio`-flavor app closes its socket mid-call
- **THEN** the call is hung up

#### Scenario: Call already ended
- **WHEN** the hang-up endpoint is called for a call that has already ended
- **THEN** it returns HTTP 404 with error code `20404`

### Requirement: Twilio flavor scope

The `twilio` flavor MUST NOT offer transfer, hold, sending DTMF, the Speech layer or TwiML.
Messages outside the Media Streams protocol SHALL be ignored.

#### Scenario: Unknown event from a Twilio-flavor app
- **WHEN** a `twilio`-flavor app sends `{ "event": "transfer" }`
- **THEN** the gateway ignores it and the call continues

### Requirement: Unmodified Pipecat compatibility

An unmodified Pipecat bot using `TwilioFrameSerializer` SHALL be able to receive caller audio, send
agent audio, handle barge-in with `clear`, read caller DTMF and hang up.

#### Scenario: Pipecat golden call
- **WHEN** an unmodified Pipecat bot answers a call through the `twilio` flavor
- **THEN** it hears the caller, the caller hears it, its interruptions stop playback, and it ends the call by closing the socket or calling the hang-up endpoint
