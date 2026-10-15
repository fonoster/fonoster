# voice-session

## ADDED Requirements

### Requirement: Sessions are delivered over WebSocket only

The VoiceSessionGateway SHALL deliver every session to an app over exactly one WebSocket
connection per call, in the app's configured flavor (`native` or `twilio`). The platform MUST NOT
accept `voice.proto` gRPC sessions.

#### Scenario: Native flavor framing
- **WHEN** a call reaches an app configured with flavor `native`
- **THEN** the gateway opens one WebSocket to the app's URL
- **AND** sends every message as a JSON text frame
- **AND** sends audio only as binary frames

#### Scenario: Legacy gRPC voice apps are not dialed
- **WHEN** an app record has only a gRPC voice endpoint and no WebSocket URL
- **THEN** a call to it is not delivered over gRPC
- **AND** the call follows the app's fallback (see "Unreachable apps fall back")

### Requirement: An app is a WebSocket URL, a flavor and speech defaults

The platform SHALL model every app as a WebSocket URL, a flavor, a signing secret, speech
defaults (voice and language as catalog ids), optional audio filters and an optional fallback. A
number MUST point to an app. Outbound calls MUST name an app the same way.

#### Scenario: Inbound routing
- **WHEN** a call arrives for a number that points to app `A` with URL `wss://bot.example.com/agent`
- **THEN** the gateway connects to `wss://bot.example.com/agent`

#### Scenario: Autopilot is an ordinary app
- **WHEN** a number points to an Autopilot assistant
- **THEN** the gateway connects to the hosted Autopilot's URL with the `native` flavor
- **AND** the protocol is identical to that of any other app

### Requirement: Connection requests are signed

The gateway SHALL sign every connection request with an HMAC-SHA256 over the URL and a timestamp,
using the app's signing secret, and SHALL send the signature and timestamp as request headers:
`X-Fonoster-Timestamp` carries the signing time in Unix seconds, and `X-Fonoster-Signature` carries
the lowercase hex HMAC-SHA256 of `<timestamp>.<url>`, where `<url>` is the app's WebSocket URL
exactly as configured, query string included. Apps MUST reject a timestamp more than 300 seconds
away from their own clock.

#### Scenario: App verifies a genuine request
- **WHEN** the gateway connects to an app
- **THEN** the request carries a signature header and a timestamp header
- **AND** recomputing the HMAC over the URL and timestamp with the app's secret yields the same signature

#### Scenario: Stale timestamp
- **WHEN** a connection request carries an `X-Fonoster-Timestamp` 10 minutes in the past
- **THEN** an app verifying signatures refuses it even if the signature matches

#### Scenario: Signature reflects the secret
- **WHEN** an app's signing secret is rotated
- **THEN** connections after the rotation are signed with the new secret only

### Requirement: session.start opens every native session

In the `native` flavor the first message from the gateway SHALL be `session.start`, carrying
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

### Requirement: Inbound calls are answered on verified connect

The gateway SHALL answer an inbound call as soon as the app's socket is open and the start
message has been sent. Apps MUST NOT need to send an answer command.

#### Scenario: Auto-answer
- **WHEN** an inbound call arrives and the app's socket opens
- **THEN** the call is answered without any message from the app
- **AND** caller audio frames begin flowing after `session.start`

### Requirement: Outbound sessions open at answer

For outbound calls the gateway SHALL open the app's session only after the callee answers. Call
progress (ringing, busy, no answer, failed) SHALL be reported to the API caller and the call
record, not to the app.

#### Scenario: Busy callee
- **WHEN** an outbound call is placed and the callee is busy
- **THEN** no WebSocket is opened to the app
- **AND** the outcome `busy` is reported to the API caller and recorded in the call record

#### Scenario: Answered callee
- **WHEN** an outbound call is answered
- **THEN** the gateway opens the app's socket and sends `session.start` with `direction: "outbound"`

### Requirement: Unreachable apps fall back

If the app's socket cannot be opened, the gateway SHALL retry for about 2–3 seconds while the
caller hears ringing, then SHALL apply the app's fallback: a fallback app URL, or a spoken message
followed by hangup. Each failure SHALL be recorded as an event in the call record.

#### Scenario: App down, fallback app configured
- **WHEN** the app's URL refuses connections for 3 seconds and a fallback app is configured
- **THEN** the gateway connects to the fallback app
- **AND** the call record contains an `app.unreachable` event naming the first URL

#### Scenario: App down, no fallback app
- **WHEN** the app's URL refuses connections for 3 seconds and only a fallback message is configured
- **THEN** the caller hears the fallback message and the call is hung up

### Requirement: Session ending

A session SHALL end when the caller hangs up, when the app sends `hangup`, when the app closes its
socket, on transfer, on handoff, on fatal error or on timeout. The gateway SHALL send `session.end`
with a `reason` (`caller_hangup`, `app_hangup`, `transfer`, `handoff`, `error`, `timeout`) as its
last message when the socket is still open.

#### Scenario: App hangs up
- **WHEN** the app sends `{ "type": "hangup" }`
- **THEN** the call is hung up
- **AND** the gateway sends `session.end` with `reason: "app_hangup"` and closes the socket

#### Scenario: App drops mid-call
- **WHEN** the app's socket closes unexpectedly during a call
- **THEN** the call is hung up
- **AND** the call record contains the drop as an event

#### Scenario: Caller hangs up
- **WHEN** the caller hangs up
- **THEN** the app receives `session.end` with `reason: "caller_hangup"`

### Requirement: Message envelope and versioning

Every JSON message SHALL have a `type`. Commands MAY carry a client-chosen `id`, and every event
caused by a command SHALL echo that `id`. Both sides MUST ignore unknown message types and unknown
fields. Changes to `fonoster.session.v1` SHALL only add types and fields.

#### Scenario: Unknown message from the app
- **WHEN** the app sends `{ "type": "future.thing" }`
- **THEN** the gateway ignores it without ending the session

#### Scenario: Id echo
- **WHEN** the app sends `speak` with `id: "r1"`
- **THEN** the resulting `output.started` and `output.done` (or `output.interrupted`) carry `id: "r1"`

### Requirement: Errors are events

The gateway SHALL report problems with an `error` message carrying `code`, `message`, `fatal`
and, when a command caused it, `relatesTo` (that command's `id`). A non-fatal error MUST NOT end
the session.

#### Scenario: Malformed command
- **WHEN** the app sends `speak` without `text`
- **THEN** the gateway sends `error` with `code: "bad_message"`, `fatal: false`, and the command's `id` in `relatesTo`
- **AND** the session continues

#### Scenario: Provider fails mid-call
- **WHEN** the TTS provider times out while speaking item `r2`
- **THEN** the gateway sends `error` with `code: "provider_timeout"` and `relatesTo: "r2"`
- **AND** the gateway does not switch to another provider

### Requirement: Streamed speech output

The gateway SHALL accept `speak` with `id`, `text`, `last`, optional `voice`, optional `language`,
`interruptible` and optional `preempt`. Pieces with the same `id` SHALL be spoken as one continuous
utterance, which ends with the piece marked `last: true`. `voice` and `language` SHALL be catalog
ids that override the app's defaults for that item only.

#### Scenario: Tokens streamed as they arrive
- **WHEN** the app sends `speak` `{id: "r1", text: "Hello, ", last: false}` and then `{id: "r1", text: "how can I help?", last: true}`
- **THEN** the caller hears one utterance without a gap between the pieces
- **AND** speech starts before the second piece arrives

#### Scenario: Per-item voice override
- **WHEN** the app sends `speak` with `voice: "elevenlabs/rachel"` while the app default is another voice
- **THEN** that item is spoken with `elevenlabs/rachel`
- **AND** later items without `voice` use the app default

#### Scenario: Invalid catalog id
- **WHEN** the app sends `speak` with a `voice` that is not in the catalog
- **THEN** the gateway sends `error` with `code: "invalid_catalog_id"` and `relatesTo` set to the item's `id`

### Requirement: Playing media

The gateway SHALL accept `play` with `id`, `url`, optional `loop`, `interruptible` and optional
`preempt`, fetch the media, convert it to the call's format and play it through the output queue.

#### Scenario: Play a file
- **WHEN** the app sends `play` `{id: "p1", url: "https://example.com/hold.wav"}`
- **THEN** the caller hears the file
- **AND** the app receives `output.started` and then `output.done` with `id: "p1"`

### Requirement: One output queue

Agent audio frames, `speak` items and `play` items SHALL share one output queue played at
real-time speed. New items SHALL queue behind existing ones. An item with `preempt: true` SHALL
stop the current item and play first. `clear` SHALL empty the entire queue.

#### Scenario: Items queue by default
- **WHEN** the app sends `speak` `r1` and, while it plays, `speak` `r2`
- **THEN** `r2` starts only after `r1` is fully played

#### Scenario: Preempt
- **WHEN** `r1` is playing and the app sends `speak` `{id: "r2", text: "One moment.", last: true, preempt: true}`
- **THEN** `r1` stops and the app receives `output.interrupted` for `r1`
- **AND** `r2` plays next

#### Scenario: Clear
- **WHEN** the queue holds `r1` (playing), `p1` and agent audio frames, and the app sends `{ "type": "clear" }`
- **THEN** the caller hears silence within 40 ms
- **AND** no queued audio plays afterwards

### Requirement: Output lifecycle and interruption report

For every `speak` and `play` item the gateway SHALL send `output.started` when it begins to be
heard, and then either `output.done` when it has been fully heard or `output.interrupted` carrying
`heardText` and `heardMs` when it was cut off.

#### Scenario: Caller barges in
- **WHEN** the caller interrupts item `r1` after 1.8 s of a 4 s utterance and the item is `interruptible`
- **THEN** the app receives `output.interrupted` with `id: "r1"`, `heardMs` near 1800 and `heardText` containing only the words already spoken

#### Scenario: Non-interruptible item
- **WHEN** the caller speaks over item `r1` with `interruptible: false`
- **THEN** `r1` keeps playing to the end and the app receives `output.done`

### Requirement: Turn events reach every client

The gateway SHALL deliver turn events produced by its Turn Detector (`turn.user_started`,
`turn.likely_ended`, `turn.ended`, `turn.resumed`, `turn.backchannel`) to every controlling client.
`turn.estimate` and `transcript.partial` SHALL be sent only to clients that request them with
`subscribe`. The detector itself is specified in `turn-taking`.

#### Scenario: Default events
- **WHEN** the caller says "I want to pay my bill" and stops
- **THEN** the app receives `turn.user_started`, then `turn.ended` with `text`, `language`, `confidence` and `durationMs`

#### Scenario: Opt-in estimate
- **WHEN** the app sends `{ "type": "subscribe", "events": ["turn.estimate"] }`
- **THEN** the app receives `turn.estimate` messages with `eot` between 0 and 1, `speaking` and `kind`
- **AND** an app that never subscribes receives no `turn.estimate`

### Requirement: Changing how the caller is heard

The gateway SHALL accept `listen.update` with optional `language` (a catalog id or language code)
and optional `hints`, and apply them to speech recognition from that point on.

#### Scenario: Switch language mid-call
- **WHEN** the app sends `listen.update` with `language: "en"` during a Spanish call
- **THEN** subsequent `turn.ended` messages carry English transcripts

### Requirement: Raw audio in both directions

The gateway SHALL send the caller's audio as binary frames of 20 ms in the format announced in
`session.start`. It SHALL accept agent audio as binary frames of any length in that format, queue
them in the output queue and play them at real-time speed.

#### Scenario: Caller audio cadence
- **WHEN** a session is active
- **THEN** the app receives one caller-audio binary frame per 20 ms of call time

#### Scenario: Agent audio faster than real time
- **WHEN** the app sends 3 s of agent audio in 100 ms
- **THEN** the caller hears it over 3 s without gaps or truncation

### Requirement: Marks

The gateway SHALL accept `mark` with `name` and SHALL return `mark` with the same `name` and
`cleared: false` when all output queued before it has been heard, or `cleared: true` when it was
dropped by `clear`.

#### Scenario: Mark reached
- **WHEN** the app sends 2 s of audio and then `mark` `{name: "m1"}`
- **THEN** after about 2 s the app receives `mark` `{name: "m1", cleared: false}`

#### Scenario: Mark cleared
- **WHEN** the app sends audio, then `mark` `{name: "m1"}`, then `clear` before the audio finishes
- **THEN** the app receives `mark` `{name: "m1", cleared: true}`

### Requirement: Call control

The gateway SHALL send `dtmf` with `digit` whenever the caller presses a key, at any point of the
call. It SHALL accept `dtmf.send` (`id`, `digits`), `transfer` (`id`, `to`, optional `headers`,
optional `mode`), `transfer.complete` (`id`), `hold` (`id`, optional `music`) and `resume` (`id`)
and pass them to the media node.

`transfer.mode` SHALL be `cold` (the default), `warm` or `refer`:

- `cold`: the media node dials `to` into the caller's room. When the new party answers, the app's
  session leaves the room and ends with `reason: "transfer"`; the caller and the new party stay in
  the room, and recording continues.
- `warm`: the media node dials `to` into the room and the app's session stays, so the agent can
  brief the new party. The session ends with `reason: "transfer"` when the app sends
  `transfer.complete` with the transfer's `id`.
- `refer`: the media node sends a SIP REFER on the caller's leg and leaves the call once the REFER
  is accepted. The session ends with `reason: "transfer"`, and recording ends at that point.

#### Scenario: Keypress while the agent speaks
- **WHEN** the caller presses `0` while item `r1` is playing
- **THEN** the app receives `{ "type": "dtmf", "digit": "0" }` immediately

#### Scenario: Cold transfer stays in the room
- **WHEN** the app sends `transfer` `{id: "t1", to: "+15551234567"}` and the new party answers
- **THEN** the app receives `session.end` with `reason: "transfer"`
- **AND** the caller and the new party remain connected in the same room
- **AND** the call record keeps receiving audio and events until the room ends

#### Scenario: Warm transfer
- **WHEN** the app sends `transfer` `{id: "t2", to: "+15551234567", mode: "warm"}` and the new party answers
- **THEN** the app's session stays open and the app, the caller and the new party hear each other
- **AND** when the app sends `transfer.complete` `{id: "t2"}` the app receives `session.end` with `reason: "transfer"`
- **AND** the caller and the new party remain connected

#### Scenario: Transfer by SIP REFER
- **WHEN** the app sends `transfer` `{id: "t3", to: "+15551234567", mode: "refer"}` and the REFER is accepted
- **THEN** the app receives `session.end` with `reason: "transfer"`
- **AND** the media node no longer carries the call
- **AND** the call record notes that recording ended at the transfer

#### Scenario: Failed transfer
- **WHEN** the transfer target cannot be reached
- **THEN** the app receives `error` with `code: "transfer_failed"` and `relatesTo: "t1"`
- **AND** the session continues

#### Scenario: Hold and resume
- **WHEN** the app sends `hold` `{id: "h1"}` and later `resume` `{id: "h2"}`
- **THEN** the caller hears hold audio (or silence) between the two commands and the conversation afterwards

### Requirement: Handoff between apps

The gateway SHALL accept `handoff` with `app` and `payload`. It SHALL send `session.end` with
`reason: "handoff"`, close the socket, connect to the target app and pass `payload` in that app's
`session.start.handoff`. The call SHALL stay connected throughout.

#### Scenario: IVR hands off to Autopilot
- **WHEN** app `ivr` sends `handoff` `{app: "autopilot-billing", payload: {"accountId": "42"}}`
- **THEN** `ivr` receives `session.end` with `reason: "handoff"`
- **AND** `autopilot-billing` receives `session.start` with `handoff` equal to `{"accountId": "42"}`
- **AND** the caller is never disconnected

### Requirement: Listen-only sockets

The platform SHALL let a session have listen-only sockets in addition to the controlling app. A
listener SHALL choose `tracks`: `inbound` (default), `outbound` or `both`. These options select
track ids from the session's `tracks` list. With `both`, the two sides SHALL arrive as separate
frames and MUST NOT be mixed. In the `native` flavor every binary frame sent by the gateway SHALL
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

### Requirement: Audio filters come from app configuration

The gateway SHALL apply the app's configured audio filters to the caller's audio before speech
recognition and turn detection. Filtering failures MUST degrade to unfiltered audio and SHALL be
reported in the call record.

#### Scenario: Filter configured
- **WHEN** an app's config lists an audio filter
- **THEN** STT and the Turn Detector receive filtered caller audio from the first frame

#### Scenario: Filter unavailable
- **WHEN** the configured filter cannot be created
- **THEN** the call continues with unfiltered audio
- **AND** the call record contains a filter failure event

### Requirement: Every message is part of the call record

The gateway SHALL append every session message in both directions, except audio frames, to the
call's record as it happens.

#### Scenario: Commands and events recorded
- **WHEN** a call ends after the app sent `speak` `r1` and the gateway sent `output.done` `r1`
- **THEN** the sealed call record contains both messages with their timestamps

### Requirement: Apps can annotate the call record

The gateway SHALL accept `record.note` with a JSON object in `data` (at most 16 KB) and SHALL append
it to the call's record as an app note, without any other effect on the session. A `record.note`
whose `data` is missing or too large SHALL be answered with `error` `bad_message`.

#### Scenario: Autopilot records a turn trace
- **WHEN** an app sends `{ "type": "record.note", "data": { "kind": "turn", "firstTokenMs": 420 } }`
- **THEN** the call record contains that note with its timestamp
- **AND** nothing is sent to the media node and no event is sent to the app

### Requirement: The media node receives only control

The gateway SHALL send the media node only call-control commands through the `media-control`
contract (answer, hangup, transfer, hold, resume, send DTMF, attach listener) and SHALL receive from it caller audio and call events. Speech,
turn detection, format conversion and the output queue MUST stay in the gateway.

#### Scenario: Speech never reaches the media node
- **WHEN** an app sends `speak`
- **THEN** the media node receives only audio frames for playout, never text or a speech command
