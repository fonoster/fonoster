# twilio-media-streams-flavor

## RENAMED Requirements

- FROM: `### Requirement: Hanging up from a Twilio-flavor app`
- TO: `### Requirement: Hanging up from a Twilio-protocol stream`

- FROM: `### Requirement: Twilio flavor scope`
- TO: `### Requirement: Twilio protocol scope`

## MODIFIED Requirements

### Requirement: Twilio Media Streams messages

For streams with protocol `twilio`, the gateway SHALL speak the Twilio Media Streams bidirectional
protocol: `connected`, `start`, `media`, `dtmf`, `mark` and `stop` toward the app; `media`, `mark`
and `clear` from the app. The session SHALL be the same one the `fonoster` protocol exposes, restricted
to audio, marks, clears and caller DTMF.

#### Scenario: Stream opening
- **WHEN** a call reaches a `twilio`-protocol stream
- **THEN** the app first receives `{ "event": "connected", "protocol": "Call", "version": "1.0.0" }`
- **AND** then receives `start` with `streamSid`, `callSid`, `accountSid`, `tracks: ["inbound"]`, `customParameters` and `mediaFormat` `{ "encoding": "audio/x-mulaw", "sampleRate": 8000, "channels": 1 }`

#### Scenario: Ids map to the session
- **WHEN** the `start` message is sent
- **THEN** `callSid` equals the session's `callRef`, `streamSid` equals its `sessionRef`, and `accountSid` identifies the workspace

#### Scenario: Stream end
- **WHEN** the caller hangs up
- **THEN** the app receives `stop` and the socket closes

### Requirement: Hanging up from a Twilio-protocol stream

Closing the socket SHALL hang up the call. The platform SHALL also expose a Twilio-compatible
endpoint, `POST {base}/2010-04-01/Accounts/{accountSid}/Calls/{callSid}.json` with
`Status=completed` and HTTP Basic authentication, which hangs up the call and returns HTTP 200. An
already-ended call SHALL return HTTP 404 with Twilio error code `20404`.

#### Scenario: Pipecat auto_hang_up with base_url
- **WHEN** an unmodified Pipecat bot using `TwilioFrameSerializer` with `auto_hang_up` enabled and `base_url` pointing to Fonoster ends its pipeline
- **THEN** its POST to the Calls endpoint hangs up the call
- **AND** the response is HTTP 200

#### Scenario: Socket closed
- **WHEN** a `twilio`-protocol stream closes its socket mid-call
- **THEN** the call is hung up

#### Scenario: Call already ended
- **WHEN** the hang-up endpoint is called for a call that has already ended
- **THEN** it returns HTTP 404 with error code `20404`

### Requirement: Twilio protocol scope

The `twilio` protocol MUST NOT offer transfer, hold, sending DTMF, the Speech layer or TwiML.
Messages outside the Media Streams protocol SHALL be ignored.

#### Scenario: Unknown event from a Twilio-protocol stream
- **WHEN** a `twilio`-protocol stream sends `{ "event": "transfer" }`
- **THEN** the gateway ignores it and the call continues

### Requirement: Unmodified Pipecat compatibility

An unmodified Pipecat bot using `TwilioFrameSerializer` SHALL be able to receive caller audio, send
agent audio, handle barge-in with `clear`, read caller DTMF and hang up.

#### Scenario: Pipecat golden call
- **WHEN** an unmodified Pipecat bot answers a call through the `twilio` protocol
- **THEN** it hears the caller, the caller hears it, its interruptions stop playback, and it ends the call by closing the socket or calling the hang-up endpoint
