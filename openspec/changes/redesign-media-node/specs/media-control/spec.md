## RENAMED Requirements

- FROM: `### Requirement: Commands go down, audio and call events come up`
- TO: `### Requirement: Roomr is a gRPC service with three nouns`

- FROM: `### Requirement: The session participant carries the gateway's audio`
- TO: `### Requirement: The app leg carries the app's audio`

- FROM: `### Requirement: Gateway audio is RTP negotiated in participant.add`
- TO: `### Requirement: App audio is RTP negotiated on the control stream`

- FROM: `### Requirement: Outbound calls are placed on a node chosen by the control plane`
- TO: `### Requirement: CreateCall dials out on the node the controller chose`

- FROM: `### Requirement: Nodes report liveness`
- TO: `### Requirement: Nodes report capacity and liveness`

## REMOVED Requirements

### Requirement: media-control runs over NATS request and reply

**Reason**: Commands move to gRPC: `Roomr` for the controller and one control stream per
call for the app. NATS keeps capacity reports and events only.
**Migration**: Replace `media.<nodeId>.commands` requests with `Roomr` RPCs at the node's
`control_addr`; subscribe to `roomr.events.<call_ref>` instead of `media.<nodeId>.events.<roomRef>`.

### Requirement: Add a participant is the one primitive

**Reason**: A join that dials hides the call's lifecycle (ringing, busy, timeout), gives inbound
calls no matching verb and makes room creation a side effect. Calls and participants are distinct
nouns: `CreateCall` dials, `Join` adds RTP and WebRTC participants.
**Migration**: `participant.dial` becomes `CreateCall` with `room_ref`; `participant.add` for the
app leg becomes `Answer`/`Ready` on the control stream; `participant.add` for RTP legs becomes `Join`.

### Requirement: Incoming calls are claimed by exactly one gateway replica

**Reason**: The node opens one control stream per call to a configured session endpoint; a
Kubernetes Service picks the replica. There is no offer, no claim and no race.
**Migration**: Retire the `gateway.incoming` queue group; serve `Session.Connect` behind a Service.

### Requirement: Outbound calls are owned by the replica that placed them

**Reason**: The node opens the control stream to the session endpoint when the callee answers, and
events are keyed by call with sequence numbers, so no replica needs to own a call.
**Migration**: Retire `gateway.outbound`; the controller calls `CreateCall` and follows
`roomr.events.<call_ref>`.

## MODIFIED Requirements

### Requirement: Roomr is a gRPC service with three nouns

`Roomr` SHALL be a gRPC service (`roomr.v1.Roomr`) served at the node's advertised
control address, with three nouns, `Room`, `Call` and `Participant`, and these RPCs: `CreateCall`,
`EndCall`, `CreateRoom`, `EndRoom`, `Join`, `Leave`, `Play`, `Record` and `SendDtmf`. A `Call`
SHALL be a SIP leg with a lifecycle (`RINGING`, `ANSWERED`, `ENDED`) that always belongs to a room;
a `Participant` SHALL be anything in a room. Errors SHALL be gRPC status codes with a machine-readable
reason. Messages SHALL only grow: receivers MUST ignore unknown fields, so the contract stays
additive.

#### Scenario: CreateCall returns a Call in its room
- **WHEN** a controller calls `CreateCall` with `call_ref: "c1"` and no `room_ref`
- **THEN** the response is a `Call` with `call_ref: "c1"`, a new `room_ref` and `state: RINGING`

#### Scenario: Unknown field ignored
- **WHEN** a client sends `EndCall` with an extra, unknown field
- **THEN** the node ends the call as usual

#### Scenario: Unknown call
- **WHEN** a controller calls `EndCall` for a `call_ref` the node does not know
- **THEN** the call fails with `NOT_FOUND`

### Requirement: The app leg carries the app's audio

The app SHALL be a participant of the call's room through an RTP leg whose endpoints are exchanged
on the control stream. The node SHALL send that leg the room's mix-minus for the app and SHALL
play the audio it receives from the app into the room in real time. Output queueing, `clear` and
`mark` SHALL remain in the app.

#### Scenario: App audio reaches the caller
- **WHEN** the app sends 1 s of audio frames to the node's endpoint
- **THEN** the caller hears that second of audio within one frame of real-time pacing

#### Scenario: The app hears the caller
- **WHEN** the caller speaks
- **THEN** the app's endpoint receives the caller's audio as its mix

### Requirement: App audio is RTP negotiated on the control stream

The app's leg SHALL exchange audio with the node as RTP over UDP. A `MediaEndpoint` SHALL have
`ip`, `port`, `codec` (`L16/16000`) and an optional `srtp_key`. `Start` SHALL carry the node's
`MediaEndpoint` for the call; the app SHALL return its own in `Answer` (inbound) or `Ready`
(outbound). When edge-to-node encryption is required, the node SHALL end the call with cause
`encryption_required` if the app's endpoint has no `srtp_key`. Audio MUST NOT travel over the gRPC
stream, NATS or WebSocket, and apps' clients MUST NOT connect to the node directly.

#### Scenario: Endpoints exchanged on the stream
- **WHEN** the node sends `Start` with `media: { ip: "10.0.1.7", port: 30010, codec: "L16/16000" }` and the app answers with `media: { ip: "10.0.0.5", port: 40010, codec: "L16/16000" }`
- **THEN** within 100 ms of the `Answer`, RTP carrying the room's mix arrives at 10.0.0.5:40010
- **AND** RTP the app sends to 10.0.1.7:30010 is heard by the caller

#### Scenario: Audio never on the stream
- **WHEN** a call runs for one minute
- **THEN** no message on the control stream carries audio samples and the stream's byte count stays below 64 KiB

#### Scenario: Plain app leg refused when encryption is required
- **WHEN** encryption is required and the app's `Answer` carries an endpoint without `srtp_key`
- **THEN** the node ends the call with `Ended` `cause: "encryption_required"` and the caller receives a SIP error

#### Scenario: Encrypted app leg
- **WHEN** both endpoints carry `srtp_key`
- **THEN** audio flows as SRTP and plain RTP from either side is dropped

### Requirement: CreateCall dials out on the node the controller chose

`CreateCall` SHALL take a caller-chosen `call_ref` (a repeated `call_ref` SHALL return the existing
`Call`), `to` (`uri`, optional `proxy`, `headers` passed through untouched, optional digest `auth`),
`from`, an optional `room_ref` (join, else create), an optional `session` endpoint (default: the
node's configured one), `ring_timeout_s`, an optional `max_duration_s` and `labels` echoed in
every event. A node at its room limit SHALL answer `RESOURCE_EXHAUSTED` and a draining node
`UNAVAILABLE`, both before sending any INVITE. Otherwise the node SHALL send the INVITE through
`to.proxy`, return `Call{RINGING}`, publish `call.ringing`, and on `200 OK` SHALL create or join
the room, open a control stream to `session`, send `Start` with `direction: OUTBOUND`, wait for
`Ready` and publish `call.answered`. Busy, no answer, rejection or `ring_timeout_s` SHALL end the
call with `call.ended` carrying the SIP status and a cause, with no room and no stream. A client
receiving `RESOURCE_EXHAUSTED` or `UNAVAILABLE` SHALL try another node, up to 3 nodes, and SHALL
report a capacity error synchronously when none accepts.

The node SHALL remember the parameters of every `call_ref` it has seen, including ended calls, for
a configurable dedupe window (default 10 minutes): a repeat with the same parameters SHALL return
the existing `Call` (in its current state) without a new INVITE, and a repeat with different
parameters SHALL fail with `ALREADY_EXISTS`. The `call_ref` MAY instead come from `to.headers`
under the configured call-ref header (media-node "One call ref end to end"). The node SHALL answer
a `407` or `401` digest challenge on the INVITE with `to.auth` and SHALL NOT log `to.auth` or echo
it in any response, event or `Start`. `EndCall` on a `RINGING` call SHALL send `CANCEL` and end the
call with `cause: "removed"`.

#### Scenario: Dial into a new room
- **WHEN** a controller calls `CreateCall` `{ call_ref: "d1", to: { uri: "sip:+15551234567@carrier", proxy: "sip:proxy:5060" }, from: "+15550001" }` and the callee answers
- **THEN** the node sends the INVITE to `proxy:5060`, publishes `call.ringing` then `call.answered` for `d1`
- **AND** opens a control stream whose `Start` has `direction: OUTBOUND` and the new `room_ref`

#### Scenario: Dial into an existing room
- **WHEN** `CreateCall` names `room_ref: "r1"` and the callee answers
- **THEN** the callee is added to `r1` and hears its participants

#### Scenario: Busy number
- **WHEN** the dialed number answers `486 Busy Here`
- **THEN** `call.ended` carries `sip_status: 486` and `cause: "busy"`
- **AND** no room is created and no control stream is opened

#### Scenario: Node at its limit
- **WHEN** the chosen node is at `max_rooms`
- **THEN** `CreateCall` fails with `RESOURCE_EXHAUSTED` and no INVITE is sent
- **AND** the controller calls `CreateCall` on the next eligible node

#### Scenario: Retry is safe
- **WHEN** a controller repeats `CreateCall` with the same `call_ref` after a timeout
- **THEN** the node returns the existing `Call` and sends no second INVITE

#### Scenario: Repeat after the call ended
- **WHEN** call `d1` ended 2 minutes ago and `CreateCall` repeats `d1` with the same parameters
- **THEN** the node returns `Call{ENDED}` and sends no INVITE

#### Scenario: Same ref, different call
- **WHEN** `CreateCall` repeats `d1` with a different `to.uri`
- **THEN** it fails with `ALREADY_EXISTS` and no INVITE is sent

#### Scenario: Digest challenge answered
- **WHEN** the proxy answers the INVITE with `407` and a digest challenge and `to.auth` is set
- **THEN** the node re-sends the INVITE with valid credentials
- **AND** no log line, event or response carries the password

#### Scenario: Cancel while ringing
- **WHEN** a controller calls `EndCall` on a `RINGING` call
- **THEN** the node sends `CANCEL` and publishes `call.ended` with `cause: "removed"`, with no room and no stream

### Requirement: Transfer modes

`Transfer` on the control stream SHALL take `to` (a `SipTarget`) and `mode`. In `cold` and `warm`
modes the node SHALL dial `to` into the caller's room; in `cold` mode it SHALL remove the app's leg
when the new party joins; in `warm` mode the app's leg SHALL stay until `TransferComplete`. In
`refer` mode the node SHALL send a SIP REFER on the caller's leg and SHALL leave the call once the
REFER is accepted. The outcome SHALL be reported as a `TransferResult` event on the stream.

#### Scenario: Cold transfer
- **WHEN** the app sends `Transfer` `{ to: { uri: "sip:+15551234567@carrier" }, mode: "cold" }` and the party answers
- **THEN** the node reports `participant.joined` for the new party and `participant.left` for the app's leg
- **AND** the caller and the new party hear each other

#### Scenario: Refer transfer
- **WHEN** the app sends `Transfer` with `mode: "refer"` and the caller's side accepts the REFER
- **THEN** the node reports `TransferResult` `{ status: "referred" }` and the room ends

### Requirement: Listeners fork audio by track

A `Join` with `listen` set SHALL attach a listen-only participant to a room; `listen` is a list of
`{ track_id, rtp }`, one RTP destination per selected track. `AttachListener` on the control
stream SHALL do the same for the app. The node SHALL send each selected track as its own RTP
stream to its destination, never mixed together, and SHALL send the listener nothing it did not
select. Listeners SHALL NOT be able to send audio into the room. `Leave` or `DetachListener` SHALL
remove the listener.

#### Scenario: Recording listener gets both sides
- **WHEN** a listener attaches selecting the caller's track and the app's track
- **THEN** it receives two separate streams, one per track

#### Scenario: Listener audio destination
- **WHEN** a controller calls `Join` `{ room_ref: "r1", listen: [{ track_id: 1, rtp: { ip: "10.0.0.5", port: 40100, codec: "L16/16000" } }] }`
- **THEN** the response is a `Participant` and RTP for track 1 arrives at 10.0.0.5:40100

#### Scenario: Listener cannot speak
- **WHEN** a listener sends audio
- **THEN** the room's participants do not hear it

### Requirement: Calls can carry a lower maximum duration

`CreateCall` and `Answer` MAY carry `max_duration_s`, which SHALL lower the node's maximum call
duration (media-node "Call and room limits") for that call; a value above the node's limit SHALL be
ignored. When it is reached the call ends with `cause: "max_duration"`.

#### Scenario: App limit applied
- **WHEN** the app answers with `max_duration_s: 600` and the call reaches 10 minutes
- **THEN** the node ends the call with `Ended` `cause: "max_duration"`

### Requirement: Ringing before answer

The node SHALL send `180 Ringing` on an inbound caller's leg, without early media, as soon as it
accepts the INVITE and before it opens the control stream. `Answer` on the stream SHALL produce
`200 OK`; `Reject` SHALL produce the given SIP status. No separate ring command SHALL exist.

#### Scenario: Caller hears ringing while the app is slow
- **WHEN** an INVITE arrives and the app takes 2 seconds to send `Answer`
- **THEN** the caller receives `180 Ringing` within 200 ms of the INVITE and `200 OK` only after the `Answer`

### Requirement: Endings carry a reason

Every ending SHALL carry a `cause`: `call.ended`, `participant.left` and `room.ended` on NATS, and
`Ended` on the control stream, each with `cause` one of `caller_hangup`, `callee_hangup`, `busy`,
`no_answer`, `rejected`, `media_timeout`, `node_error`, `max_duration`, `removed` (a `Leave`,
`EndCall`, `EndRoom` or `Hangup`), `app_gone` (the control stream broke, the session endpoint
could not be reached, `Answer` or `Ready` never arrived, or the app leg sent no RTP) and
`encryption_required`, plus `sip_status` when a SIP response or BYE `Reason` header gave one. Apps and controllers SHALL map `cause` to their
own end reasons instead of assuming `caller_hangup`.

#### Scenario: Caller hangs up
- **WHEN** the caller sends BYE
- **THEN** `Ended` on the stream and `call.ended` on NATS carry `cause: "caller_hangup"`

#### Scenario: Dialed party busy
- **WHEN** `CreateCall` gets `486 Busy Here`
- **THEN** `call.ended` carries `cause: "busy"` and `sip_status: 486`

#### Scenario: No RTP from the caller
- **WHEN** the caller's leg sends no RTP for the media timeout (30 s by default)
- **THEN** the node ends the call with `cause: "media_timeout"`

#### Scenario: App pod dies
- **WHEN** the app's control stream breaks and keepalive declares it dead
- **THEN** the node sends BYE to the caller and publishes `call.ended` with `cause: "app_gone"`
- **AND** does not open a stream to another app instance

### Requirement: Nodes report capacity and liveness

Each node SHALL publish a heartbeat on `roomr.nodes.<node_ref>.heartbeat` every 2 seconds with
`node_ref`, `control_addr`, `sip_addr`, `rtp_ports`, `rooms`, `participants`, `max_rooms`,
`cpu_idle` (0 to 1), `codecs`, `draining`, `version` and `region`. A node stopping on purpose SHALL
publish `node.down` `{ node_ref }` on the same subject, `roomr.nodes.<node_ref>.heartbeat`, with
`type: "node.down"` (heartbeats carry `type: "node.heartbeat"`), after its last room ends. A
controller SHALL treat a node whose
last heartbeat is older than 6 seconds as down and SHALL not place calls on it. `cpu_idle` SHALL be
informational: neither the node nor a controller SHALL refuse or skip a node because of it.

#### Scenario: Heartbeat content
- **WHEN** a node with 12 rooms, a limit of 200 and version `1.4.0` in region `us-east` is running
- **THEN** at least every 2 seconds it publishes a heartbeat with `rooms: 12`, `max_rooms: 200`, `version: "1.4.0"`, `region: "us-east"`, `draining: false` and a `control_addr` a controller can dial

#### Scenario: Node killed
- **WHEN** a node is killed
- **THEN** within 6 seconds of its last heartbeat every controller stops placing calls on it

#### Scenario: Clean shutdown
- **WHEN** a draining node's last room ends
- **THEN** it publishes `{ type: "node.down", node_ref }` on `roomr.nodes.<node_ref>.heartbeat` and controllers stop expecting heartbeats from it

#### Scenario: Busy CPU is not a refusal
- **WHEN** a node reports `cpu_idle: 0.02` with `rooms` below `max_rooms`
- **THEN** a controller may place a call on it and the node accepts the call

### Requirement: Hold silences the app and plays hold audio

`Hold` on the control stream (optional `music` URL) SHALL stop mixing the app's audio to the
caller and the caller's audio to the app, and SHALL play `music` to the caller in a loop, or
silence when none is given. The caller's leg SHALL stay `sendrecv` (no re-INVITE). The node SHALL
fetch and loop the music file itself. `Resume` SHALL restore both directions.

#### Scenario: Hold with music
- **WHEN** the app sends `Hold` `{ music: "https://example.com/hold.wav" }`
- **THEN** the caller hears the music and the app's leg receives silence until `Resume`

### Requirement: Warm transfer keeps the caller on hold

In `warm` mode the node SHALL hold the caller (as `Hold`, with the transfer's `music`) while the
new party is dialed, SHALL mix only the app's leg and the new party together, and SHALL report
`TransferResult` `{ status: "failed", cause: "no_answer" }` and resume the caller if the new party
has not answered within 30 seconds. `TransferComplete` SHALL resume the caller, mix the caller
with the new party, and remove the app's leg with `cause: "removed"`.

#### Scenario: Warm transfer completed
- **WHEN** the new party answers a warm transfer and the app sends `TransferComplete`
- **THEN** the caller hears the new party, and the app's leg leaves the room

#### Scenario: Warm transfer not answered
- **WHEN** the new party does not answer within 30 seconds
- **THEN** the node reports `TransferResult` with `status: "failed"` and the caller hears the app again

## ADDED Requirements

### Requirement: Each call opens one control stream to the session endpoint

For every call the node SHALL open a new connection to the session endpoint (`CreateCall.session`,
else the configured endpoint) and SHALL start one bidirectional gRPC stream (`Session.Connect`)
whose first message is `Start`. The stream SHALL carry only control: `Start`, `Dtmf` and `Event`
from the node; `Answer`, `Ready`, `Reject`, `Play`, `Stop`, `Transfer`, `TransferComplete`,
`Hold`, `Resume`, `SendDtmf`, `AttachListener`, `DetachListener`, `Record` and `Hangup` from the
app. The node SHALL send gRPC keepalive pings every 10 seconds and SHALL treat the stream as dead
after 2 missed pings, then hang the call up with `cause: "app_gone"`; it MUST NOT reconnect the
call to another app instance. The gateway SHALL also send keepalive pings on its side and SHALL end
the session when the node misses 2 of them. The connection SHALL use TLS or mTLS when configured.

For an outbound call that is answered, the node SHALL send BYE and end the call with
`cause: "app_gone"` when the session endpoint cannot be reached or `Ready` does not arrive within
the configured ready timeout (default 10 s). When an inbound caller sends `CANCEL` before the app's
`Answer`, the node SHALL answer `487`, send `Ended` with `cause: "caller_hangup"` and close the
stream.

#### Scenario: One connection per call
- **WHEN** 100 inbound calls arrive while the session endpoint fronts 4 app instances
- **THEN** the node opens 100 connections and more than one instance receives streams

#### Scenario: Start is first
- **WHEN** a stream opens
- **THEN** its first message is `Start` with `call_ref`, `direction`, `from`, `to`, `headers`, `room_ref`, `labels` and the node's `media` endpoint

#### Scenario: Commands are ordered
- **WHEN** the app sends `Play` then `Hangup` on the stream
- **THEN** the node starts the playback before it hangs up, and never the reverse

#### Scenario: Stream breaks mid-call
- **WHEN** the app instance holding a stream is killed
- **THEN** within 30 seconds the node sends BYE to the caller and no new stream is opened for that call

#### Scenario: Node gone, gateway notices
- **WHEN** the node holding a stream is killed
- **THEN** within 30 seconds the gateway ends the session and closes the app's socket

#### Scenario: Ready never arrives
- **WHEN** the callee answers an outbound call and the app opens the stream but never sends `Ready`
- **THEN** after the ready timeout the node sends BYE to the callee and publishes `call.ended` with `cause: "app_gone"`

#### Scenario: Session endpoint unreachable on answer
- **WHEN** the callee answers an outbound call and the session endpoint refuses connections
- **THEN** the node sends BYE to the callee and publishes `call.ended` with `cause: "app_gone"`

#### Scenario: Caller cancels before Answer
- **WHEN** an inbound caller sends `CANCEL` while the app has not sent `Answer`
- **THEN** the caller receives `487`, the app receives `Ended` with `cause: "caller_hangup"` and the stream closes

### Requirement: Rooms and participants are managed with CreateRoom, EndRoom, Join and Leave

`CreateRoom` SHALL create an empty room (with the given `room_ref`, or a new one) for rooms that
do not start from a call; `ALREADY_EXISTS` when the ref is taken. `EndRoom` SHALL end every call
and participant in the room and publish `room.ended`. `Join` SHALL add an RTP participant
(`rtp`: address, port, codec) or a WebRTC participant (`webrtc`: SDP offer, with the SDP answer
in the `Participant` response). `Leave` SHALL remove a participant with `cause: "removed"`. An
unknown room SHALL give `NOT_FOUND`; a full room SHALL give `RESOURCE_EXHAUSTED` with reason
`room_full`.

#### Scenario: Room without a call
- **WHEN** a controller calls `CreateRoom` `{ room_ref: "lobby" }` and then `Join` with an RTP endpoint
- **THEN** the room exists with one participant and `participant.joined` is published for it

#### Scenario: WebRTC join returns an answer
- **WHEN** a controller calls `Join` with a WebRTC offer
- **THEN** the `Participant` response carries an SDP answer the browser can apply

#### Scenario: EndRoom ends everything
- **WHEN** a controller calls `EndRoom` on a room with a SIP call and an RTP participant
- **THEN** the call ends with `cause: "removed"`, the participant leaves and `room.ended` is published

#### Scenario: Unknown room
- **WHEN** `Join` names a room the node does not have
- **THEN** it fails with `NOT_FOUND` and nothing changes

### Requirement: Play, Record and SendDtmf are operations

`Play` (a file or URL to a call, participant or room) and `Record` (a destination) SHALL return
an `Operation` with an `operation_ref` and SHALL report completion as `operation.done` on NATS
and, when the app asked, as an `Event` on its stream. `Stop` SHALL cancel a `Play`. `SendDtmf`
SHALL send RFC 4733 events on the target leg. Apps SHALL be able to send the same actions on their
control stream.

#### Scenario: Play completes
- **WHEN** a controller calls `Play` with a 2-second file on call `c1`
- **THEN** the response carries an `operation_ref`, the caller hears the file, and `operation.done` with that ref is published about 2 seconds later

#### Scenario: Stop cancels
- **WHEN** the app sends `Stop` one second into a 10-second `Play`
- **THEN** playback stops within 100 ms and `operation.done` reports `stopped`

#### Scenario: DTMF sent
- **WHEN** `SendDtmf` with digits `12#` targets a SIP leg
- **THEN** the leg receives RFC 4733 events for `1`, `2` and `#` in order

### Requirement: Events on NATS are keyed by call with sequence numbers and labels

The node SHALL publish call events (`call.started`, `call.ringing`, `call.answered`, `call.ended`,
`participant.joined`, `participant.left`, `operation.done`) on `roomr.events.<call_ref>` and
room-scoped events (`room.ended`, and participant events for participants that are not calls) on
`roomr.events.room.<room_ref>`, and `registration.state` on `roomr.nodes.<node_ref>.events`.
Every event SHALL carry `node_ref`, a `seq` that increases by one per event of the same call (for
call events) or of the same room (for room-scoped events), the call's `labels` and a timestamp.
Receivers MUST ignore unknown event types and fields.

#### Scenario: Another replica follows the call
- **WHEN** controller replica A places call `c1` with `labels: { tenant: "t1" }` and replica B subscribes to `roomr.events.c1`
- **THEN** B receives `call.ringing`, `call.answered` and `call.ended` for `c1`, each with `labels.tenant: "t1"`

#### Scenario: Sequence numbers are contiguous
- **WHEN** a call produces five events
- **THEN** their `seq` values are 1 through 5 in publication order

#### Scenario: Room events have their own sequence
- **WHEN** an RTP participant joins and leaves room `lobby`, which has no call, and then the room ends
- **THEN** the three events on `roomr.events.room.lobby` carry `seq` 1, 2 and 3

#### Scenario: Unknown event ignored
- **WHEN** a receiver gets an event with a type it does not know
- **THEN** it ignores the event and keeps processing the stream

### Requirement: Events are best effort while NATS is down

Events and heartbeats SHALL be published on core NATS without delivery guarantees. When NATS is
unreachable the node SHALL keep every live call and room running, SHALL keep serving `Roomr` RPCs
and control streams, and SHALL drop events it cannot publish rather than block or buffer them.
Calls MUST NOT end because NATS is down.

#### Scenario: NATS outage mid-call
- **WHEN** NATS becomes unreachable for 60 seconds during an answered call
- **THEN** the caller and the app keep hearing each other and the call continues after NATS returns

#### Scenario: Events lost, not replayed
- **WHEN** a call ends while NATS is unreachable
- **THEN** the node frees the room, and its `call.ended` is not published after NATS returns
