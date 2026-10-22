# voice-session Specification

## Purpose
AppBridge: how calls reach apps as WebSocket sessions and what apps can do in them.

## Requirements

### Requirement: Sessions are delivered over WebSocket only

AppBridge SHALL deliver every session to an app over exactly one WebSocket
connection per call, in the app's configured protocol (`fonoster` or `twilio`). The platform MUST NOT
accept `voice.proto` gRPC sessions.

#### Scenario: Fonoster protocol framing
- **WHEN** a call reaches an app configured with protocol `fonoster`
- **THEN** AppBridge opens one WebSocket to the app's URL
- **AND** sends every message as a JSON text frame
- **AND** sends audio only as binary frames

#### Scenario: Legacy gRPC voice apps are not dialed
- **WHEN** an app record has only a gRPC voice endpoint and no WebSocket URL
- **THEN** a call to it is not delivered over gRPC
- **AND** the call follows the app's fallback (see "Unreachable apps fall back")

### Requirement: Connection requests are signed

AppBridge SHALL sign every connection request with an HMAC-SHA256 over the URL and a timestamp,
using the app's signing secret, and SHALL send the signature and timestamp as request headers:
`X-Fonoster-Timestamp` carries the signing time in Unix seconds, and `X-Fonoster-Signature` carries
the lowercase hex HMAC-SHA256 of `<timestamp>.<url>`, where `<url>` is the app's WebSocket URL
exactly as configured, query string included. Apps MUST reject a timestamp more than 300 seconds
away from their own clock.

#### Scenario: App verifies a genuine request
- **WHEN** AppBridge connects to an app
- **THEN** the request carries a signature header and a timestamp header
- **AND** recomputing the HMAC over the URL and timestamp with the app's secret yields the same signature

#### Scenario: Stale timestamp
- **WHEN** a connection request carries an `X-Fonoster-Timestamp` 10 minutes in the past
- **THEN** an app verifying signatures refuses it even if the signature matches

#### Scenario: Signature reflects the secret
- **WHEN** an app's signing secret is rotated
- **THEN** connections after the rotation are signed with the new secret only
- **AND** there is no overlap window: an app still checking the old secret refuses them until it is redeployed (accepted risk, owner decision 2026-10-15)

### Requirement: Connection requests are bound to the app

Besides the URL-only signature, AppBridge SHALL send, on every app and listener connection,
`X-Fonoster-App-Ref` (the app), `X-Fonoster-Workspace-Ref` (the workspace that owns it, empty when
unknown) and `X-Fonoster-App-Signature`: the lowercase hex HMAC-SHA256, with the same secret and
timestamp, of `<timestamp>\n<url>\n<appRef>\n<workspaceRef>` (newline-separated). An app that
shares its secret with other apps (the hosted Autopilot) MUST require this signature, verify it
against its configured URL only, and serve only the app and workspace it names.

#### Scenario: A signature cannot be reused for another tenant's app
- **WHEN** a signature AppBridge made for one workspace's app (for example on that app's
  listener URL) is presented to the hosted Autopilot for another workspace's app
- **THEN** Autopilot refuses the connection or the session, and loads no agent for the other app

#### Scenario: Apps that verify only the URL keep working
- **WHEN** an app verifies only `X-Fonoster-Signature`
- **THEN** connections from an AppBridge that also sends the app-bound headers still verify

### Requirement: Inbound calls are answered on verified connect

AppBridge SHALL answer an inbound call as soon as the app's socket is open and the start
message has been sent. Apps MUST NOT need to send an answer command.

#### Scenario: Auto-answer
- **WHEN** an inbound call arrives and the app's socket opens
- **THEN** the call is answered without any message from the app
- **AND** caller audio frames begin flowing after `session.start`

### Requirement: Outbound sessions open at answer

For outbound calls AppBridge SHALL open the app's session only after the callee answers. Call
progress (ringing, busy, no answer, failed) SHALL be reported to the API caller and the call
record, not to the app.

#### Scenario: Busy callee
- **WHEN** an outbound call is placed and the callee is busy
- **THEN** no WebSocket is opened to the app
- **AND** the outcome `busy` is reported to the API caller and recorded in the call record

#### Scenario: Answered callee
- **WHEN** an outbound call is answered
- **THEN** AppBridge opens the app's socket and sends `session.start` with `direction: "outbound"`

#### Scenario: Room ends or node dies before the answer
- **WHEN** the room of an unanswered outbound call ends, or nothing is heard about it for 75 s
- **THEN** AppBridge stops watching it, records `call.failed` (the room's reason, or `node_error`) and sends the `call.failed` webhook

### Requirement: Unreachable apps fall back

If the app's socket cannot be opened, AppBridge SHALL retry for about 2–3 seconds while the
caller hears ringing, then SHALL apply the app's fallback: a fallback app URL, or a spoken message
followed by hangup. Each failure SHALL be recorded as an event in the call record.

#### Scenario: App down, fallback app configured
- **WHEN** the app's URL refuses connections for 3 seconds and a fallback app is configured
- **THEN** AppBridge connects to the fallback app
- **AND** the call record contains an `app.unreachable` event naming the first URL

#### Scenario: App down, no fallback app
- **WHEN** the app's URL refuses connections for 3 seconds and only a fallback message is configured
- **THEN** the caller hears the fallback message and the call is hung up

### Requirement: Session ending

A session SHALL end when the caller hangs up, when the app sends `hangup`, when the app closes its
socket, on transfer, on handoff, on fatal error or on timeout. AppBridge SHALL send `session.end`
with a `reason` (`caller_hangup`, `app_hangup`, `transfer`, `handoff`, `error`, `timeout`) as its
last message when the socket is still open. The reason SHALL come from the Roomr node's `Ended`
`cause` on the control stream (media-control), mapped as follows:

| `cause` | `session.end` `reason` |
|---|---|
| `caller_hangup`, `callee_hangup` | `caller_hangup` |
| `removed` after the app's `hangup`, or after an `EndCall`/`EndRoom` from the control plane | `app_hangup` |
| `removed` after a transfer (cold, `TransferComplete` or `refer`) | `transfer` |
| `max_duration` | `timeout` |
| `media_timeout`, `node_error`, `app_gone` | `error` |
| any cause AppBridge does not know | `error` |

A control stream that closes without `Ended` SHALL map to `error`. `busy`, `no_answer` and
`rejected` end outbound calls before any session opens, so they produce no `session.end`.

#### Scenario: App hangs up
- **WHEN** the app sends `{ "type": "hangup" }`
- **THEN** the call is hung up
- **AND** AppBridge sends `session.end` with `reason: "app_hangup"` and closes the socket

#### Scenario: App drops mid-call
- **WHEN** the app's socket closes unexpectedly during a call
- **THEN** the call is hung up
- **AND** the call record contains the drop as an event

#### Scenario: Caller hangs up
- **WHEN** the caller hangs up
- **THEN** the app receives `session.end` with `reason: "caller_hangup"`

#### Scenario: Node lost
- **WHEN** the Roomr node's control stream closes without an `Ended` event
- **THEN** the app receives `session.end` with `reason: "error"` and the call record is sealed with `node_error`

#### Scenario: Every cause mapped
- **WHEN** the node sends `Ended` with each `cause` in the table in turn
- **THEN** the app receives `session.end` with the `reason` the table gives

#### Scenario: Unknown cause
- **WHEN** the node sends `Ended` with `cause: "something_new"`
- **THEN** the app receives `session.end` with `reason: "error"`

#### Scenario: Node's audio stops
- **WHEN** the node's RTP to AppBridge stops for `mediaTimeout` (`appbridge.yaml`, 15 s by default) while the control stream stays open
- **THEN** AppBridge ends the call, the app receives `session.end` with `reason: "error"` and the call record is sealed with `media_timeout`

### Requirement: Message envelope and versioning

Every JSON message SHALL have a `type`. Commands MAY carry a client-chosen `id`, and every event
caused by a command SHALL echo that `id`. Both sides MUST ignore unknown message types and unknown
fields. Changes to `fonoster.session.v1` SHALL only add types and fields.

#### Scenario: Unknown message from the app
- **WHEN** the app sends `{ "type": "future.thing" }`
- **THEN** AppBridge ignores it without ending the session

#### Scenario: Id echo
- **WHEN** the app sends `speak` with `id: "r1"`
- **THEN** the resulting `output.started` and `output.done` (or `output.interrupted`) carry `id: "r1"`

### Requirement: Errors are events

AppBridge SHALL report problems with an `error` message carrying `code`, `message`, `fatal`
and, when a command caused it, `relatesTo` (that command's `id`). A non-fatal error MUST NOT end
the session.

#### Scenario: Malformed command
- **WHEN** the app sends `speak` without `text`
- **THEN** AppBridge sends `error` with `code: "bad_message"`, `fatal: false`, and the command's `id` in `relatesTo`
- **AND** the session continues

#### Scenario: Provider fails mid-call
- **WHEN** the TTS provider times out while speaking item `r2`
- **THEN** AppBridge sends `error` with `code: "provider_timeout"` and `relatesTo: "r2"`
- **AND** AppBridge does not switch to another provider

### Requirement: Streamed speech output

AppBridge SHALL accept `speak` with `id`, `text`, `last`, optional `voice`, optional `language`,
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
- **THEN** AppBridge sends `error` with `code: "invalid_catalog_id"` and `relatesTo` set to the item's `id`

### Requirement: Playing media

AppBridge SHALL accept `play` with `id`, `url`, optional `loop`, `interruptible` and optional
`preempt`, fetch the media, convert it to the call's format and play it through the output queue.
The URL is the app's choice, so the fetch SHALL reach public addresses only (http/https; private,
loopback, link-local and metadata addresses refused, each redirect and the connected address
re-checked; `FONOSTER_ALLOWED_DESTINATIONS` lists exceptions), follow at most 3 redirects, read at
most 20 MiB and give up after 15 s; a refused or failed fetch is `play_fetch_failed`.

#### Scenario: Play a file
- **WHEN** the app sends `play` `{id: "p1", url: "https://example.com/hold.wav"}`
- **THEN** the caller hears the file
- **AND** the app receives `output.started` and then `output.done` with `id: "p1"`

#### Scenario: Play an internal address
- **WHEN** the app sends `play` with `url: "http://169.254.169.254/latest/meta-data/"`
- **THEN** nothing is fetched and the app receives an `error` `play_fetch_failed` for that id

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

For every `speak` and `play` item AppBridge SHALL send `output.started` when it begins to be
heard, and then either `output.done` (with `heardMs`) when it has been fully heard or
`output.interrupted` carrying `heardText` and `heardMs` when it was cut off. An item dropped before
it started SHALL get `output.interrupted` with `heardMs: 0` and no `output.started`.

The app owns interruption: AppBridge SHALL NOT stop output because the caller speaks. It SHALL
report `turn.user_started` (also while output is playing) and stop output only on `clear` or
`preempt`. `interruptible` SHALL be accepted on `speak` and `play` and passed through unchanged;
the SDKs use it to decide whether to send `clear` when the caller starts talking.

#### Scenario: Caller barges in
- **WHEN** the caller starts talking 1.8 s into item `r1` (4 s long)
- **THEN** the app receives `turn.user_started` and `r1` keeps playing
- **AND** when the app sends `clear`, it receives `output.interrupted` with `id: "r1"`, `heardMs` near 1800 and `heardText` containing only the words already spoken

#### Scenario: Caller talks over an item the app keeps
- **WHEN** the caller speaks over item `r1` and the app does not send `clear`
- **THEN** `r1` plays to the end and the app receives `output.done`

### Requirement: Turn events reach every client

AppBridge SHALL deliver turn events produced by its Turn Detector (`turn.user_started`,
`turn.likely_ended`, `turn.ended`, `turn.resumed`, `turn.backchannel`) to every controlling client.
`turn.estimate` and `transcript.partial` SHALL be sent only to clients that request them with
`subscribe`. The detector itself is specified in `turn-taking`. Speech recognition and turn
detection SHALL start with the app's first `speak`, `play`, `subscribe` or `listen.update` (an
empty `listen.update` only starts listening), so sessions that use only the Audio layer never run
them.

A turn whose caller stops producing speech for 10 seconds after `turn.user_started` without a
transcript (noise, a dropped line) SHALL end with `turn.ended` `{text: "", abandoned: true}`, so an
app never waits forever.

#### Scenario: Abandoned turn
- **WHEN** a noise burst produces `turn.user_started` and no speech follows for 10 seconds
- **THEN** the app receives `turn.ended` with `text: ""` and `abandoned: true`

#### Scenario: Default events
- **WHEN** the caller says "I want to pay my bill" and stops
- **THEN** the app receives `turn.user_started`, then `turn.ended` with `text`, `language`, `confidence` and `durationMs`

#### Scenario: Opt-in estimate
- **WHEN** the app sends `{ "type": "subscribe", "events": ["turn.estimate"] }`
- **THEN** the app receives `turn.estimate` messages with `eot` between 0 and 1, `speaking` and `kind`
- **AND** an app that never subscribes receives no `turn.estimate`

### Requirement: Answering-machine detection reaches the app

AppBridge SHALL send exactly one `amd.result` per call to an app with answering-machine
detection on (the app setting `amd`, with an optional window of caller audio, default 4 s), with
`status` (`human`, `voicemail`, `ivr`, `machine` or `unknown`), `confidence`, `detector`, `audioMs`
and, when detection could not run, `reason`. It SHALL be sent whether or not the app uses the Speech layer. AppBridge
SHALL NOT act on the verdict: hanging up or leaving a message is the app's decision.

#### Scenario: Voicemail answers an outbound call
- **WHEN** an app with `amd` on places a call that a voicemail greeting answers
- **THEN** the app receives one `amd.result` with `status: "voicemail"` within the window plus a short grace
- **AND** the call stays up until the app acts

#### Scenario: Detection off
- **WHEN** an app has `amd` off
- **THEN** it receives no `amd.result`

### Requirement: Changing how the caller is heard

AppBridge SHALL accept `listen.update` with optional `language` (a catalog id or language code),
optional `hints` and optional `patience` (`low`, `normal` or `high`, how long the Turn Detector
waits for more speech before `turn.ended`; see `turn-taking`), and apply them from that point on.

#### Scenario: Switch language mid-call
- **WHEN** the app sends `listen.update` with `language: "en"` during a Spanish call
- **THEN** subsequent `turn.ended` messages carry English transcripts

### Requirement: Raw audio in both directions

AppBridge SHALL send the caller's audio as binary frames of 20 ms in the format announced in
`session.start`. It SHALL accept agent audio as binary frames of any length in that format, queue
them in the output queue and play them at real-time speed.

A native app SHALL choose its format from this menu: `pcm16` (16-bit little-endian) at 8000, 16000
or 24000 Hz, or `pcmu` (G.711 μ-law) at 8000 Hz; the default is `pcm16` at 16000 Hz. The format is
independent of the caller's SIP codec: the Roomr node negotiates PCMU, PCMA, G.722 or Opus with the
caller and transcodes to AppBridge's leg, which is always L16 at 16000 Hz. Opus is not offered
over WebSocket in v1.

#### Scenario: Any SIP codec reaches any app format
- **WHEN** a caller whose phone negotiated Opus calls an app that chose `pcmu` at 8000 Hz
- **THEN** `session.start` announces `pcmu` at 8000 Hz and every caller-audio frame is 160 bytes of μ-law
- **AND** agent audio the app sends as μ-law is heard by the caller

#### Scenario: Off-menu format
- **WHEN** an app is configured with `opus` or `pcmu` at 16000 Hz
- **THEN** the control plane (or AppBridge's YAML check) rejects the app with a message naming the menu

#### Scenario: Caller audio cadence
- **WHEN** a session is active
- **THEN** the app receives one caller-audio binary frame per 20 ms of call time

#### Scenario: Agent audio faster than real time
- **WHEN** the app sends 3 s of agent audio in 100 ms
- **THEN** the caller hears it over 3 s without gaps or truncation

### Requirement: Marks

AppBridge SHALL accept `mark` with `name` and SHALL return `mark` with the same `name` and
`cleared: false` when all output queued before it has been heard, or `cleared: true` when it was
dropped by `clear`.

#### Scenario: Mark reached
- **WHEN** the app sends 2 s of audio and then `mark` `{name: "m1"}`
- **THEN** after about 2 s the app receives `mark` `{name: "m1", cleared: false}`

#### Scenario: Mark cleared
- **WHEN** the app sends audio, then `mark` `{name: "m1"}`, then `clear` before the audio finishes
- **THEN** the app receives `mark` `{name: "m1", cleared: true}`

### Requirement: Call control

AppBridge SHALL send `dtmf` with `digit` whenever the caller presses a key, at any point of the
call. It SHALL accept `dtmf.send` (`id`, `digits`), `transfer` (`id`, `to`, optional `headers`,
optional `mode`), `transfer.complete` (`id`), `hold` (`id`, optional `music`) and `resume` (`id`)
and pass them to the Roomr node.

A `transfer`'s `to` SHALL be an E.164 number, a SIP user, a `tel:` URI or a `sip:`/`sips:` URI
without parameters, and its `headers` SHALL be at most 16 custom `X-` headers (name `X-` and up to 64
letters, digits or dashes; value a string of at most 256 characters without control characters).
The headers the platform routes by (`X-App-Ref`, `X-Call-Ref`, `X-Call-Direction`,
`X-Dod-Number`, `X-Dod-Privacy`, `X-Access-Key-Id`, `X-Is-Api-Originated-Type`, `X-Connect-Token`
and Routr's own `X-Edgeport-Ref`, `X-AppBridge-Auth`, `X-Request-Uri`, `X-Session-Count`) are
reserved, in any case. A transfer that breaks these rules SHALL be refused with `error`
`bad_message` (`relatesTo` the transfer) and nothing is sent to the Roomr node. AppBridge SHALL
add `X-Dod-Number` (the ingress number of an inbound call, the `from` of an outbound one) and
`X-Access-Key-Id` (the app's workspace) itself, so a transfer to the PSTN leaves by the call's own
workspace's trunk.

`transfer.mode` SHALL be `cold` (the default), `warm` or `refer`:

- `cold`: the Roomr node dials `to` into the caller's room. When the new party answers, the app's
  session leaves the room and ends with `reason: "transfer"`; the caller and the new party stay in
  the room, and recording continues.
- `warm`: the caller is put on hold (hold music from the transfer's optional `music`, or
  silence), the Roomr node dials `to`, and the app and the new party hear each other so the agent
  can brief them. The session ends with `reason: "transfer"` when the app sends
  `transfer.complete` with the transfer's `id`, which connects the caller and the new party. If
  the new party does not answer within 30 seconds, the app receives `error` `transfer_failed` and
  the caller comes back to the app.
- `refer`: the Roomr node sends a SIP REFER on the caller's leg and leaves the call once the REFER
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
- **THEN** the app's session stays open, the app and the new party hear each other, and the caller hears hold audio
- **AND** when the app sends `transfer.complete` `{id: "t2"}` the app receives `session.end` with `reason: "transfer"`
- **AND** the caller and the new party remain connected

#### Scenario: Transfer by SIP REFER
- **WHEN** the app sends `transfer` `{id: "t3", to: "+15551234567", mode: "refer"}` and the REFER is accepted
- **THEN** the app receives `session.end` with `reason: "transfer"`
- **AND** the Roomr node no longer carries the call
- **AND** the call record notes that recording ended at the transfer

#### Scenario: Transfer with a reserved header
- **WHEN** the app sends `transfer` `{id: "t4", to: "+15551234567", headers: {"X-Dod-Number": "+15550009999"}}`
- **THEN** the app receives `error` with `code: "bad_message"` and `relatesTo: "t4"`
- **AND** the Roomr node receives no `transfer`

#### Scenario: Transfer headers
- **WHEN** an inbound call to `+15550002222` in workspace `W1` is transferred with `headers: {"X-Customer-Id": "c-42"}`
- **THEN** the Roomr node's `transfer` carries `X-Customer-Id: c-42`, `X-Dod-Number: +15550002222` and `X-Access-Key-Id: W1`

#### Scenario: Failed transfer
- **WHEN** the transfer target cannot be reached
- **THEN** the app receives `error` with `code: "transfer_failed"` and `relatesTo: "t1"`
- **AND** the session continues

While the caller is on hold the app SHALL receive no caller audio and no turn events (keypresses
still arrive), and every command except `resume`, `hangup`, `transfer`, `handoff` and `record.note`
SHALL be answered with `error` `on_hold`.

#### Scenario: Hold and resume
- **WHEN** the app sends `hold` `{id: "h1"}` and later `resume` `{id: "h2"}`
- **THEN** the caller hears hold audio (or silence) between the two commands and the conversation afterwards
- **AND** the app receives no caller audio frames and no turn events between the two

#### Scenario: Speaking while on hold
- **WHEN** the app sends `speak` while the caller is on hold
- **THEN** it receives `error` with `code: "on_hold"` and `relatesTo` set to the item's `id`

#### Scenario: Warm transfer not answered
- **WHEN** the app sends a warm `transfer` and the new party does not answer within 30 seconds
- **THEN** the app receives `error` `transfer_failed` and the caller hears the app again

### Requirement: Handoff between apps

AppBridge SHALL accept `handoff` with `app` and `payload`. It SHALL send `session.end` with
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
frames and MUST NOT be mixed. With the `fonoster` protocol every binary frame sent by AppBridge SHALL
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
recognition and turn detection. A filter that needs a provider credential SHALL receive the one the
gateway resolved from the registry for the session's workspace (provider-registry). Filtering
failures MUST degrade to unfiltered audio and SHALL be reported in the call record, whether they
happen when the filter starts or later in the call.

#### Scenario: Filter configured
- **WHEN** an app's config lists an audio filter
- **THEN** STT and the Turn Detector receive filtered caller audio from the moment speech starts (B18), including the 500 ms kept before it

#### Scenario: Filter unavailable
- **WHEN** the configured filter cannot be created
- **THEN** the call continues with unfiltered audio
- **AND** the call record contains a filter failure event

#### Scenario: Filter fails during the call
- **WHEN** a running filter throws or returns frames of the wrong length
- **THEN** the rest of the call continues with unfiltered audio
- **AND** the call record contains a `filter.failed` event with the filter's name and the reason

#### Scenario: Credential comes from the registry, never from the app
- **WHEN** an app's filter configuration carries a key or a license in its options
- **THEN** the option is rejected and the filter is not built
- **AND** the gateway starts the filter only with the credential it resolved for the workspace

### Requirement: Every message is part of the call record

AppBridge SHALL append every session message in both directions, except audio frames, to the
call's record as it happens.

#### Scenario: Commands and events recorded
- **WHEN** a call ends after the app sent `speak` `r1` and AppBridge sent `output.done` `r1`
- **THEN** the sealed call record contains both messages with their timestamps

### Requirement: Apps can annotate the call record

AppBridge SHALL accept `record.note` with a JSON object in `data` (at most 16 KB) and SHALL append
it to the call's record as an app note, without any other effect on the session. `record.note` is
reserved for Fonoster's own apps (Autopilot's turn traces): it SHALL NOT appear in the public
protocol reference or SDK documentation, and it may change without a new protocol name. A `record.note`
whose `data` is missing or too large SHALL be answered with `error` `bad_message`.

#### Scenario: Autopilot records a turn trace
- **WHEN** an app sends `{ "type": "record.note", "data": { "kind": "turn", "firstTokenMs": 420 } }`
- **THEN** the call record contains that note with its timestamp
- **AND** nothing is sent to the Roomr node and no event is sent to the app

### Requirement: The Roomr node receives only control

AppBridge SHALL send the Roomr node only call-control commands on the per-call control stream
(`Answer`, `Reject`, `Hangup`, `Transfer`, `TransferComplete`, `Hold`, `Resume`, `SendDtmf`,
`AddListener`, `RemoveListener`) and SHALL receive from it call events and keypresses; an app's
`play` is played by AppBridge on its RTP leg, like `speak`; caller audio arrives as RTP at the endpoint AppBridge named in `Answer` or `Ready`.
Speech, turn detection, format conversion and the output queue MUST stay in AppBridge.

#### Scenario: Speech never reaches the Roomr node
- **WHEN** an app sends `speak`
- **THEN** the Roomr node receives only audio frames for playout, never text or a speech command

#### Scenario: AppBridge answers on the stream
- **WHEN** an inbound call's app socket opens and `session.start` is sent
- **THEN** AppBridge sends `Answer` on that call's control stream with its RTP endpoint and no other message

### Requirement: AppBridge produces call lifecycle events

AppBridge that owns a call SHALL produce `call.started`, `call.ended` and `call.failed` for it,
SHALL hand them to the workspace webhook dispatcher (`add-workspace-webhooks`), and SHALL write the
minimal call record for a call that never reached an app (unreachable app with no fallback, missing
app, busy or unanswered outbound). For a cold transfer, the call's `durationSeconds` SHALL run
until the room ends; the app's session duration SHALL be recorded separately.

#### Scenario: Normal call
- **WHEN** a call is answered by an app and later the caller hangs up
- **THEN** the workspace's webhook endpoints receive `call.started` and then `call.ended` with `reason: "caller_hangup"`

#### Scenario: App never reached
- **WHEN** the app is unreachable and has no fallback
- **THEN** the workspace receives `call.failed` with `reason: "app_unreachable"` and a minimal record is sealed

### Requirement: An app is a WebSocket URL, a protocol and speech defaults

The platform SHALL model every app as a WebSocket URL, a protocol (`fonoster` or `twilio`), a signing secret, speech
defaults (voice and language as catalog ids), optional audio filters and an optional fallback. A
number MUST point to an app. Routr resolves the number and passes the app in `X-App-Ref`; the
Roomr node passes every header through, and AppBridge SHALL take the app from `X-App-Ref` in the
`headers` of the control stream's `Start` (media-control) or, for outbound calls, from `app_ref`
in its `metadata`, which the caller of `CreateCall` sets. It SHALL use a number lookup only as a
development fallback when `X-App-Ref` is missing and a routing file is configured, and SHALL
`Reject` the call with `404` when neither names an app. Outbound calls MUST name an app.

#### Scenario: Inbound routing
- **WHEN** `Start.headers` carries `X-App-Ref` naming app `A`, whose URL is `wss://bot.example.com/agent`
- **THEN** AppBridge connects to `wss://bot.example.com/agent`

#### Scenario: Outbound routing
- **WHEN** `Start.metadata` carries `app_ref` naming app `A`
- **THEN** AppBridge connects to app `A`'s URL

#### Scenario: Missing app reference
- **WHEN** `Start.headers` has no `X-App-Ref` and no development routing file is configured
- **THEN** AppBridge sends `Reject` with `sip_status: 404` and no app socket is opened

#### Scenario: Autopilot is an ordinary app
- **WHEN** a number points to an Autopilot agent
- **THEN** AppBridge connects to the hosted Autopilot's URL with the `fonoster` protocol
- **AND** the protocol is identical to that of any other app

#### Scenario: App URLs are public destinations
- **WHEN** an app is created or updated with a `url` or listener URL naming an internal host
  (`localhost`, a single-label or `*.svc` name) or a private, loopback, link-local or metadata IP
- **THEN** the call fails with `INVALID_ARGUMENT`, unless the operator allows the destination
  (`apps.allowedDestinations` or `FONOSTER_ALLOWED_DESTINATIONS`); the hosted Autopilot URL from
  configuration is exempt
- **AND** when dialing an app or listener from the database, AppBridge refuses addresses that
  resolve to private ranges (Autopilot apps' URL and the operator's YAML apps are not checked)

### Requirement: session.start opens every fonoster-protocol session

With the `fonoster` protocol the first message from AppBridge SHALL be `session.start`, carrying
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

### Requirement: An app's audio filters are set through the Applications API

An Application SHALL expose its audio filters as an ordered list `filters: [{ name, options? }]`
that can be read and written through the Applications API, the SDK and the CLI. The API SHALL
accept only filter names the running version knows and only each filter's public options, and
SHALL reject anything else before storing.

#### Scenario: Enabling noise cancelling on an app

- **WHEN** a workspace member updates app `A` with `filters: [{ name: "aiCoustics" }]`
- **THEN** reading `A` returns `filters: [{ name: "aiCoustics" }]`
- **AND** the next call to `A` runs the ai-coustics filter

#### Scenario: A public option is accepted

- **WHEN** app `A` is updated with `filters: [{ name: "aiCoustics", options: { enhancementLevel: 0.8 } }]`
- **THEN** the update succeeds and the option is stored

#### Scenario: A server-side option is rejected

- **WHEN** app `A` is updated with `filters: [{ name: "aiCoustics", options: { modelFile: "/etc/passwd" } }]`
- **THEN** the update fails with `INVALID_ARGUMENT` naming the option
- **AND** the app is unchanged

#### Scenario: An unknown filter is rejected

- **WHEN** app `A` is updated with `filters: [{ name: "krisp" }]`
- **THEN** the update fails with `INVALID_ARGUMENT` naming the filter
- **AND** the app is unchanged

#### Scenario: Clearing the filters

- **WHEN** app `A` is updated with an empty `filters` list, or with no `filters` at all (an update replaces the whole app)
- **THEN** reading `A` returns no filters
- **AND** the next call to `A` runs with unfiltered audio

### Requirement: Autopilot reports model usage to the call

AppBridge SHALL accept `usage.report` from an Autopilot agent's session, carrying usage lines for
`llm.tokens.*` and `embedding.tokens` only, and SHALL add them to the call's usage. Like
`record.note`, it is reserved for Fonoster's own apps and SHALL NOT appear in the public protocol
reference or SDK documentation.

#### Scenario: Autopilot reports a turn's tokens

- **WHEN** an Autopilot agent sends `usage.report` with 1,200 `llm.tokens.in` and 340
  `llm.tokens.out` for provider `openai`, model `gpt-4o-mini`, `keySource: platform`
- **THEN** the call's sealed usage includes those quantities for that provider, model and key source
- **AND** no event is sent to the app and nothing is sent to the Roomr node

#### Scenario: Not an Autopilot agent

- **WHEN** an app of type `STREAM` sends `usage.report`
- **THEN** AppBridge answers with `error` `bad_message` and records no usage from it

#### Scenario: Meter outside the allowed set

- **WHEN** an Autopilot agent sends `usage.report` for `call.seconds`
- **THEN** AppBridge answers with `error` `bad_message` and records no usage from it
