# media-control Specification

## Purpose
The NATS contract between the control plane, the gateway and the media nodes.
## Requirements
### Requirement: Commands go down, audio and call events come up

The `media-control` contract SHALL carry commands from the VoiceSessionGateway or the control plane
to a media node, and audio and call events from the node back up. Commands SHALL be: `ring`,
`answer`, `room.create`, `participant.add`, `participant.dial`, `participant.remove`, `transfer`,
`transfer.complete`, `hold`, `resume`, `dtmf.send`, `listener.attach`, `listener.detach`, `room.end` and `hangup`.
Events SHALL be: `call.incoming`, `call.progress`, `call.answered`, `participant.joined`,
`participant.left`, `dtmf`, `transfer.result`, `room.ended`, `node.heartbeat` and `node.down`.
Every command SHALL carry an `id`, and every event it causes SHALL echo that `id`. A node SHALL
answer a command of an unknown type with an `error` reply whose `code` is `unknown_command` and
SHALL leave the room unchanged. Receivers MUST ignore unknown event types and unknown fields, so
the contract only ever grows.

#### Scenario: Command id echoed
- **WHEN** the gateway sends `hold` `{id: "c7", roomRef: "r1", participantRef: "p-caller"}`
- **THEN** the node's acknowledgement carries `id: "c7"`

#### Scenario: Unknown command refused
- **WHEN** the gateway sends a command with `type: "room.mute_all"`
- **THEN** the node replies `{type: "error", id, code: "unknown_command"}` and the room is unchanged

#### Scenario: Unknown field ignored
- **WHEN** the gateway sends `hold` with an extra field `priority: 3`
- **THEN** the node holds the caller as usual and ignores `priority`

### Requirement: media-control runs over NATS request and reply

Each media node SHALL serve commands as NATS requests on `media.<nodeId>.commands` and SHALL answer
every command with exactly one JSON reply: `{type: "ack", id, ...}` carrying any results (such as
`roomRef`, `participantRef` or `rtp`), or `{type: "error", id, code, message}`. Outcomes that take
time (dial progress, transfers, room end) SHALL arrive later as events. The node SHALL publish
every event on `media.<nodeId>.events.<roomRef>`, so a gateway subscribes only to its room and the
control plane to `media.*.events.>`. A sender SHALL treat a command with no reply within 2 seconds
as failed.

#### Scenario: Ack carries results
- **WHEN** the control plane sends `room.create` `{id: "c1"}` to `media.node-a.commands`
- **THEN** the reply is `{type: "ack", id: "c1", roomRef: "<new room>"}`

#### Scenario: Events are scoped to the room
- **WHEN** the caller in room `r1` on node `node-a` presses `5`
- **THEN** a `dtmf` event is published on `media.node-a.events.r1`
- **AND** nothing is published on any other room's subject

#### Scenario: No reply
- **WHEN** a node does not reply to `hold` within 2 seconds
- **THEN** the gateway treats the command as failed and reports `error` to the app with `relatesTo` set to the command's id

### Requirement: Participants and tracks are kind-neutral

Every participant described in `media-control` SHALL list its tracks, each with `trackId`, `kind`,
`codec` and `direction`. No command or event SHALL name audio in a way that excludes other kinds,
so that adding video later is additive.

#### Scenario: Track list on join
- **WHEN** a SIP caller joins a room
- **THEN** `participant.joined` lists one track with `kind: "audio"` and the negotiated `codec`

### Requirement: The session participant carries the gateway's audio

The gateway SHALL join a room as a session participant. The node SHALL send it the room's mix for
that participant and SHALL play the audio it receives from the gateway into the room in real time.
Playout queueing, `clear` and `mark` SHALL remain in the gateway.

#### Scenario: Agent audio reaches the caller
- **WHEN** the session participant sends 1 s of audio frames
- **THEN** the caller hears that second of audio within one frame of real-time pacing

#### Scenario: The gateway hears the caller
- **WHEN** the caller speaks
- **THEN** the session participant receives the caller's audio as its mix

### Requirement: Gateway audio is RTP negotiated in participant.add

The gateway's session participant SHALL exchange audio with the node as RTP over UDP, using SRTP
when edge-to-node encryption (MN6) is enabled. The host, port and codec SHALL be negotiated inside
`participant.add`. An `rtp` block SHALL have `host`, `port`, `codec`, `payloadType` (dynamic,
96–127, default 96), `ptime` in milliseconds (default 20), `ssrc` (the sender's stream id) and an
optional `srtp` (`suite`, `key`) present only when MN6 encryption is on. The gateway offers its own
block and the node's acknowledgement SHALL return the node's block with its own `host`, `port` and
`ssrc`; `codec`, `payloadType` and `ptime` SHALL match the offer or the node SHALL refuse with
`unsupported_codec`. This audio MUST NOT travel
over SIP, NATS or WebSocket, and agents MUST NOT connect to the media node directly.

#### Scenario: Ports are exchanged in participant.add
- **WHEN** the gateway sends `participant.add` `{id: "c3", roomRef: "r1", kind: "session", rtp: {host: "10.0.0.5", port: 40010, codec: "L16/16000", payloadType: 96, ptime: 20, ssrc: 1111}}`
- **THEN** the node's acknowledgement carries `id: "c3"` and `rtp: {host, port, codec: "L16/16000", payloadType: 96, ptime: 20, ssrc}` for the node's side
- **AND** within 100 ms of the acknowledgement, RTP packets carrying the room's mix arrive at 10.0.0.5:40010

#### Scenario: Agent audio travels as RTP
- **WHEN** the gateway sends RTP packets to the node's returned host and port
- **THEN** the caller hears that audio, and no SIP, NATS or WebSocket traffic carries it

When MN6 encryption is on, the node SHALL refuse an `rtp` block without `srtp` (on
`participant.add` and on every `listener.attach` track) with error code `encryption_required`.

#### Scenario: Plain gateway leg refused when encryption is required
- **WHEN** encryption is enabled and the gateway sends `participant.add` with an `rtp` block that has no `srtp`
- **THEN** the node replies `{type: "error", id, code: "encryption_required"}` and the room is unchanged

#### Scenario: Encrypted deployment uses SRTP
- **WHEN** edge-to-node encryption is enabled and the gateway adds its session participant
- **THEN** the negotiated `rtp` block carries SRTP keying and plain RTP from the gateway is dropped

#### Scenario: Agents never reach the node
- **WHEN** an app's session is running
- **THEN** the app's only connection is its WebSocket session to the gateway, and the node sees only the gateway's RTP and NATS commands

### Requirement: Add a participant is the one primitive

Inbound calls, outbound calls and transfers SHALL all be expressed as adding a participant to a
room. `participant.dial` SHALL add a phone participant by sending an INVITE through Routr, which
chooses the carrier trunk. Progress SHALL be reported as `call.progress` (`ringing`, `busy`,
`no_answer`, `failed`) and success as `participant.joined`.

#### Scenario: Dial into an existing room
- **WHEN** the gateway sends `participant.dial` `{id: "d1", roomRef: "r1", to: "+15551234567"}`
- **THEN** the node sends an INVITE to Routr for `+15551234567`
- **AND** reports `call.progress` `ringing` and then `participant.joined` with `id: "d1"` when answered

#### Scenario: Busy number
- **WHEN** the dialed number is busy
- **THEN** the node reports `call.progress` with `status: "busy"` and `id: "d1"`
- **AND** the room is unchanged

### Requirement: Outbound calls are placed on a node chosen by the control plane

For an outbound call the control plane SHALL choose the node with the fewest active rooms among
non-draining nodes in the session registry (NATS JetStream KV), SHALL ask it to `room.create` and
`participant.dial`, and SHALL record the room-to-node mapping in the registry. The gateway SHALL
open the app's session only after `call.answered`.

#### Scenario: Least-loaded node chosen
- **WHEN** the registry lists node A with 30 rooms, node B with 8 and node C draining, and an outbound call is requested
- **THEN** the control plane sends `room.create` and `participant.dial` to node B
- **AND** the registry maps the new room to node B

#### Scenario: Session opens at answer
- **WHEN** the dialed party answers
- **THEN** the node reports `call.answered`
- **AND** only then does the gateway open the app's session

### Requirement: Transfer modes

`transfer` SHALL take `roomRef`, `to` and `mode`. In `cold` and `warm` modes the node SHALL dial
`to` into the caller's room; in `cold` mode it SHALL remove the session participant when the new
party joins; in `warm` mode the session participant SHALL stay until it is removed. In `refer` mode
the node SHALL send a SIP REFER on the caller's leg and SHALL leave the call once the REFER is
accepted. The outcome SHALL be reported as `transfer.result`.

#### Scenario: Cold transfer
- **WHEN** the gateway sends `transfer` `{id: "t1", roomRef: "r1", to: "+15551234567", mode: "cold"}` and the party answers
- **THEN** the node reports `participant.joined` for the new party and `participant.left` for the session participant
- **AND** the caller and the new party hear each other

#### Scenario: Refer transfer
- **WHEN** the gateway sends `transfer` with `mode: "refer"` and the caller's side accepts the REFER
- **THEN** the node reports `transfer.result` `{id, status: "referred"}` and the room ends

### Requirement: Listeners fork audio by track

`listener.attach` SHALL attach a listen-only participant to a room with a list of track ids to
receive and one `rtp` block per selected track (`host`, `port`, `codec`, the same fields as the
session participant's offer). The node SHALL send each selected track as its own RTP stream to its
`rtp` destination, never mixed together, and SHALL send the listener nothing it did not select.
Listeners SHALL NOT be able to send audio into the room. The gateway SHALL receive these streams
for WebSocket listeners and forward them as binary frames; recording and AMD listeners receive
them directly.

#### Scenario: Recording listener gets both sides
- **WHEN** a recording listener attaches selecting the caller's track and the session participant's track
- **THEN** it receives two separate streams, one per track

#### Scenario: Listener audio destination
- **WHEN** the gateway sends `listener.attach` `{id: "l1", roomRef: "r1", tracks: [{trackId: 1, rtp: {host: "10.0.0.5", port: 40100, codec: "L16/16000"}}]}`
- **THEN** the acknowledgement carries `id: "l1"` and a `listenerRef`
- **AND** RTP for track 1 arrives at 10.0.0.5:40100

#### Scenario: Listener cannot speak
- **WHEN** a listener sends audio
- **THEN** the room's participants do not hear it

### Requirement: Incoming calls are claimed by exactly one gateway replica

For every INVITE it accepts, the node SHALL send `call.incoming` as a NATS request on
`gateway.incoming`, which gateway replicas serve as one queue group. The payload SHALL be
`{type: "call.incoming", id, nodeId, roomRef, participantRef, appRef, callRef, direction, from, to,
callerName, headers}`, where `appRef`, `callRef` and `direction` come from Routr's `X-App-Ref`,
`X-Call-Ref` and `X-Call-Direction`, `to` is the `To` user (the ingress number) and `headers` holds
any other `X-` headers. The replica that replies `{type: "claimed", id, gatewayRef}` SHALL own the
call for its whole life; the node SHALL publish the room's events as usual and the owner SHALL be
the only sender of commands for that room. If no reply arrives within 500 ms the node SHALL retry
once; if the retry also gets no reply the node SHALL refuse the INVITE with `503 Service
Unavailable` and report `room.ended` with `reason: "node_error"`. Routing is Routr's job: the
gateway SHALL take the app from `appRef` and SHALL fall back to a number lookup only when
`appRef` is missing and a development-only routing file is configured.

#### Scenario: One replica claims the call
- **WHEN** Routr sends an INVITE with `X-App-Ref: app-1` and three gateway replicas are running
- **THEN** exactly one replica replies `claimed`, opens app-1's session and sends every later command for the room

#### Scenario: No gateway answers
- **WHEN** no gateway replica replies to `call.incoming` within 500 ms, twice
- **THEN** the caller receives `503 Service Unavailable`
- **AND** the node reports `room.ended` with `reason: "node_error"`

#### Scenario: Missing app reference
- **WHEN** an INVITE arrives without `X-App-Ref` and no development routing file is configured
- **THEN** the gateway replies `claimed`, then sends `hangup` with `sipStatus: 404`, and the call ends with `reason: "rejected"`

### Requirement: Calls can carry a lower maximum duration

`answer` and `room.create` MAY carry `maxDurationSec`, which SHALL lower the node's maximum call duration
(media-node "Call and room limits") for that room; a value above the node's limit SHALL be
ignored. When it is reached the room ends with `reason: "max_duration"`.

#### Scenario: App limit applied
- **WHEN** the gateway answers with `maxDurationSec: 600` and the call reaches 10 minutes
- **THEN** the node ends the room with `reason: "max_duration"`

### Requirement: Ringing before answer

`ring` (`roomRef`, `participantRef`) SHALL make the node send `180 Ringing` on the caller's leg
without early media. The gateway SHALL send `ring` right after claiming a call and SHALL send
`answer` once the app's session is open or its fallback starts. `answer` without a prior `ring`
SHALL still answer.

#### Scenario: Caller hears ringing while the app is unreachable
- **WHEN** the gateway claims a call and the app's URL refuses connections for 2 seconds
- **THEN** the caller receives `180 Ringing` right after the claim and `200 OK` only when the fallback starts

### Requirement: Endings carry a reason

`participant.left` and `room.ended` SHALL carry `reason`, one of `caller_hangup`, `callee_hangup`,
`busy`, `no_answer`, `rejected`, `media_timeout`, `node_error`, `max_duration` and `removed` (a
`participant.remove`, `hangup` or `room.end` command), plus `sipStatus` when a SIP response or
BYE `Reason` header gave one. The gateway SHALL map `reason` to `session.end` and to the call
record instead of assuming `caller_hangup`.

#### Scenario: Caller hangs up
- **WHEN** the caller sends BYE
- **THEN** `participant.left` and `room.ended` carry `reason: "caller_hangup"`

#### Scenario: Dialed party busy
- **WHEN** `participant.dial` gets `486 Busy Here`
- **THEN** `call.progress` carries `status: "busy"` and, if the room ends, `room.ended` carries `reason: "busy"` and `sipStatus: 486`

#### Scenario: No RTP from the caller
- **WHEN** the caller's leg sends no RTP for the media timeout (30 s by default)
- **THEN** the node ends the room with `reason: "media_timeout"`

### Requirement: Nodes report liveness

Each node SHALL publish `node.heartbeat` `{nodeId, rooms, draining}` on `media.<nodeId>.heartbeat`
every 2 seconds. A node stopping on purpose SHALL publish `node.down` `{nodeId}` after its last
room ends. A gateway SHALL treat a node as down after 3 missed heartbeats (6 seconds), SHALL end
every session it owns on that node with `session.end` `reason: "error"`, and SHALL seal their
records with `node_error`.

#### Scenario: Heartbeats while alive
- **WHEN** a node is running
- **THEN** it publishes `node.heartbeat` with its room count and `draining` at least every 2 seconds

#### Scenario: Node killed
- **WHEN** a node carrying two calls owned by one gateway is killed
- **THEN** within 7 seconds both apps receive `session.end` with `reason: "error"`
- **AND** both records are sealed with failure `node_error`

#### Scenario: Clean shutdown
- **WHEN** a draining node's last room ends
- **THEN** it publishes `node.down` and gateways stop expecting heartbeats from it

### Requirement: Outbound calls are owned by the replica that placed them

An outbound call SHALL be placed by sending `gateway.outbound` as a NATS request to the gateway
queue group; the replica that replies SHALL pick the node (MN5), send `room.create` and
`participant.dial`, and own the call. `call.answered` and later events SHALL be handled only by
that owner.

#### Scenario: Owner handles the answer
- **WHEN** replica G2 replies to an outbound request and the callee answers
- **THEN** only G2 opens the app's session

### Requirement: Hold silences the app and plays hold audio

`hold` (`roomRef`, `participantRef`, optional `music` URL) SHALL stop mixing the session
participant's audio to the caller and the caller's audio to the session participant, and SHALL
play `music` to the caller in a loop, or silence when none is given. The caller's leg SHALL stay
`sendrecv` (no re-INVITE). The node SHALL fetch and loop the music file itself. `resume` SHALL
restore both directions.

#### Scenario: Hold with music
- **WHEN** the gateway sends `hold` `{id: "h1", roomRef: "r1", participantRef: "p-caller", music: "https://example.com/hold.wav"}`
- **THEN** the caller hears the music and the session participant receives silence until `resume`

### Requirement: Warm transfer keeps the caller on hold

In `warm` mode the node SHALL hold the caller (as `hold`, with the transfer's `music`) while the
new party is dialed, SHALL mix only the session participant and the new party together, and SHALL
report `transfer.result` `{status: "failed", reason: "no_answer"}` and resume the caller if the
new party has not answered within 30 seconds. `transfer.complete` (`roomRef`, the transfer's `id`)
SHALL resume the caller, mix the caller with the new party, and remove the session participant
with `reason: "removed"`.

#### Scenario: Warm transfer completed
- **WHEN** the new party answers a warm transfer and the gateway sends `transfer.complete`
- **THEN** the caller hears the new party, and the session participant leaves the room

#### Scenario: Warm transfer not answered
- **WHEN** the new party does not answer within 30 seconds
- **THEN** the node reports `transfer.result` with `status: "failed"` and the caller hears the session participant again

