# voice-session

## RENAMED Requirements

- FROM: `### Requirement: An app is a WebSocket URL, a flavor and speech defaults`
- TO: `### Requirement: An app is a WebSocket URL, a protocol and speech defaults`

- FROM: `### Requirement: session.start opens every native session`
- TO: `### Requirement: session.start opens every fonoster-protocol session`

## MODIFIED Requirements

### Requirement: Sessions are delivered over WebSocket only

The VoiceSessionGateway SHALL deliver every session to an app over exactly one WebSocket
connection per call, in the app's configured protocol (`fonoster` or `twilio`). The platform MUST NOT
accept `voice.proto` gRPC sessions.

#### Scenario: Fonoster protocol framing
- **WHEN** a call reaches an app configured with protocol `fonoster`
- **THEN** the gateway opens one WebSocket to the app's URL
- **AND** sends every message as a JSON text frame
- **AND** sends audio only as binary frames

#### Scenario: Legacy gRPC voice apps are not dialed
- **WHEN** an app record has only a gRPC voice endpoint and no WebSocket URL
- **THEN** a call to it is not delivered over gRPC
- **AND** the call follows the app's fallback (see "Unreachable apps fall back")

### Requirement: An app is a WebSocket URL, a protocol and speech defaults

The platform SHALL model every app as a WebSocket URL, a protocol (`fonoster` or `twilio`), a signing secret, speech
defaults (voice and language as catalog ids), optional audio filters and an optional fallback. A
number MUST point to an app. Routr resolves the number and passes the app in `X-App-Ref`; the
gateway SHALL take the app from the `appRef` of `call.incoming` (media-control) and SHALL use a
number lookup only as a development fallback when `appRef` is missing and a routing file is
configured. Outbound calls MUST name an app.

#### Scenario: Inbound routing
- **WHEN** Routr sends a call with `X-App-Ref` naming app `A`, whose URL is `wss://bot.example.com/agent`
- **THEN** the gateway connects to `wss://bot.example.com/agent`

#### Scenario: Autopilot is an ordinary app
- **WHEN** a number points to an Autopilot agent
- **THEN** the gateway connects to the hosted Autopilot's URL with the `fonoster` protocol
- **AND** the protocol is identical to that of any other app

### Requirement: session.start opens every fonoster-protocol session

With the `fonoster` protocol the first message from the gateway SHALL be `session.start`, carrying
`protocol` (`fonoster.session.v1`), `sessionRef`, `callRef`, `appRef`, `direction`, `from`, `to`,
`metadata`, `handoff` (null unless handed off), `audio` (`codec`, `rate`), `tracks` (the list of
track ids the session will carry, each with `id`, `side` (`inbound` or `outbound`), `kind`
(`audio` in v1) and `codec`) and `speech` (default `voice` and `language` as catalog ids).

#### Scenario: Start message content
- **WHEN** the app's socket opens
- **THEN** the first text frame is a JSON object with `type: "session.start"`
- **AND** `protocol` equals `fonoster.session.v1`
- **AND** `audio.codec` and `audio.rate` describe every caller-audio binary frame that follows
- **AND** `tracks` contains `{id: 1, side: "inbound", kind: "audio"}` for the caller's audio

### Requirement: Listen-only sockets

The platform SHALL let a session have listen-only sockets in addition to the controlling app. A
listener SHALL choose `tracks`: `inbound` (default), `outbound` or `both`. These options select
track ids from the session's `tracks` list. With `both`, the two sides SHALL arrive as separate
frames and MUST NOT be mixed. With the `fonoster` protocol every binary frame sent by the gateway SHALL
begin with one byte holding the track id it belongs to, so new track kinds (such as video) can be
added without changing the frame format. A listener SHALL receive the
same events as the controlling app, and any command it sends SHALL be answered with `error`
`code: "read_only"`.

#### Scenario: Both tracks
- **WHEN** a listener attaches with `tracks: "both"`
- **THEN** it receives caller frames and agent frames as separate binary frames
- **AND** each frame starts with the track id of the caller's track or the agent's track, as listed in `tracks`

#### Scenario: Listener tries to hang up
- **WHEN** a listener sends `hangup`
- **THEN** it receives `error` with `code: "read_only"`
- **AND** the call continues
