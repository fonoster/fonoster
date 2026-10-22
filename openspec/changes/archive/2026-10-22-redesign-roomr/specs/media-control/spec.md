## RENAMED Requirements

- FROM: `### Requirement: The session participant carries AppBridge's audio`
- TO: `### Requirement: The app leg carries the app's audio`

- FROM: `### Requirement: Outbound calls are placed on a node chosen by the control plane`
- TO: `### Requirement: CreateCall dials out on the node the controller chose`

- FROM: `### Requirement: Nodes report liveness`
- TO: `### Requirement: Nodes report capacity and liveness`

## REMOVED Requirements

### Requirement: Commands go down, audio and call events come up

**Reason**: The NATS command contract (`ring`, `answer`, `room.create`, `participant.*`,
`hold`, `dtmf.send`, `listener.*`, `room.end`, `hangup` with echoed command ids and
`unknown_command` replies) is gone. Controllers use the `Roomr` gRPC service, apps use their
call's control stream, and NATS carries only heartbeats and events. Replaced by "Roomr is a gRPC
service with three nouns" and "Each call opens one control stream to the session endpoint".
**Migration**: Map `room.create`/`room.end` to `CreateRoom`/`EndRoom`, `participant.dial` to
`CreateCall`, `participant.add`/`participant.remove` to `AddParticipant`/`RemoveParticipant` (RTP)
or `Answer`/`Ready` (the app leg), `hangup` to `EndCall` or `Hangup`, and `ring`, `answer`,
`hold`, `resume`, `transfer`, `dtmf.send` and `listener.*` to the control stream's messages. gRPC
status codes replace `error` replies.

### Requirement: AppBridge audio is RTP negotiated in participant.add

**Reason**: Endpoints are exchanged on the control stream (`Start`, `Answer`, `Ready`) instead of
in `participant.add`, and the node no longer refuses plain app legs (`requireEncryption` is
removed: SRTP is used when both endpoints carry a key). Replaced by "App audio is RTP negotiated
on the control stream".
**Migration**: Send the app's `MediaEndpoint` in `Answer` or `Ready`; set `srtp_key` on both sides
for SRTP.

### Requirement: media-control runs over NATS request and reply

**Reason**: Commands move to gRPC: `Roomr` for the controller and one control stream per
call for the app. NATS keeps capacity reports and events only.
**Migration**: Replace `media.<nodeId>.commands` requests with `Roomr` RPCs at the node's
`control_addr`; subscribe to `roomr.events.<call_ref>` instead of `media.<nodeId>.events.<roomRef>`.

### Requirement: Add a participant is the one primitive

**Reason**: A join that dials hides the call's lifecycle (ringing, busy, timeout), gives inbound
calls no matching verb and makes room creation a side effect. Calls and participants are distinct
nouns: `CreateCall` dials, `AddParticipant` adds RTP participants.
**Migration**: `participant.dial` becomes `CreateCall` with `room_ref`; `participant.add` for the
app leg becomes `Answer`/`Ready` on the control stream; `participant.add` for RTP legs becomes `AddParticipant`.

### Requirement: Incoming calls are claimed by exactly one AppBridge replica

**Reason**: The node opens one control stream per call to a configured session endpoint; a
Kubernetes Service picks the replica. There is no offer, no claim and no race.
**Migration**: Retire the `appbridge.incoming` queue group; serve `Session.Connect` behind a Service.

### Requirement: Outbound calls are owned by the replica that placed them

**Reason**: The node opens the control stream to the session endpoint when the callee answers, and
events are keyed by call with sequence numbers, so no replica needs to own a call.
**Migration**: Retire `appbridge.outbound`; the controller calls `CreateCall` and follows
`roomr.events.<call_ref>`.

## MODIFIED Requirements

### Requirement: The app leg carries the app's audio

The app SHALL be a participant of the call's room through an RTP leg whose endpoints are exchanged
on the control stream. The node SHALL send that leg the room's mix-minus for the app and SHALL
play the audio it receives from the app into the room in real time. Output queueing, `clear` and
`mark` SHALL remain in the app.

#### Scenario: Agent audio reaches the caller
- **WHEN** the app sends 1 s of audio frames to the node's endpoint
- **THEN** the caller hears that second of audio within one frame of real-time pacing

#### Scenario: AppBridge hears the caller
- **WHEN** the caller speaks
- **THEN** the app's endpoint receives the caller's audio as its mix

### Requirement: CreateCall dials out on the node the controller chose

`CreateCall` SHALL take a caller-chosen `call_ref` (a repeated `call_ref` SHALL return the existing
`Call`), `to` (`uri`, optional `proxy`, `headers` passed through untouched, optional digest `auth`),
`from`, an optional `room_ref` (join, else create), an optional `session` endpoint (default: the
node's configured one), `ring_timeout_s`, an optional `max_duration_s` and `metadata`, opaque to
the node and echoed untouched in every event and in `Start`. Callers dictate the app reference
through `metadata` (for example `app_ref`) and the call ref through the call-ref header or
`call_ref`. A node at its room limit SHALL answer `RESOURCE_EXHAUSTED` before sending any INVITE.
Otherwise the node SHALL send the INVITE through `to.proxy` (whose URI carries the transport, for
example `sip:host:port;transport=tcp`), return `Call{RINGING}`, publish `call.ringing`, and on `200 OK` SHALL create or join
the room, open a control stream to `session`, send `Start` with `direction: OUTBOUND`, wait for
`Ready` and publish `call.answered`. Busy, no answer, rejection or `ring_timeout_s` SHALL end the
call with `call.ended` carrying the SIP status and a cause, with no room and no stream. A client
receiving `RESOURCE_EXHAUSTED` or `UNAVAILABLE` SHALL try another node, up to 3 nodes, and SHALL
report a capacity error synchronously when none accepts.

The node SHALL remember the parameters of every `call_ref` it has seen, including ended calls, for
a fixed dedupe window of 10 minutes: a repeat with the same parameters SHALL return
the existing `Call` (in its current state) without a new INVITE, and a repeat with different
parameters SHALL fail with `ALREADY_EXISTS`. The `call_ref` MAY instead come from `to.headers`
under the configured call-ref header (roomr "One call ref end to end"). The node SHALL answer
a `407` or `401` digest challenge on the INVITE with `to.auth` and SHALL NOT log `to.auth` or echo
it in any response, event or `Start`. `EndCall` on a `RINGING` call SHALL send `CANCEL` and end the
call with `cause: "removed"`.

#### Scenario: Least-loaded node chosen
- **WHEN** heartbeats show node A with 30 rooms of 200, node B with 8 of 200 and node C whose heartbeats stopped, and an outbound call is requested
- **THEN** the controller sends `CreateCall` to node B and no other node gets an INVITE request

#### Scenario: Session opens at answer
- **WHEN** the dialed party answers
- **THEN** the node opens the call's control stream and sends `Start` only after the `200 OK`
- **AND** the app's session opens only after that `Start`

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

An `AddParticipant` with `listen` set SHALL add a listen-only participant to a room; `listen` is a
list of `{ track_id, rtp }`, one RTP destination per selected track. `AddListener` on the control
stream SHALL do the same for the app. Recording is a listener: the node never records itself. The
node SHALL send each selected track as its own RTP stream to its destination, never mixed
together, and SHALL send the listener nothing it did not select. Listeners SHALL NOT be able to
send audio into the room. `RemoveParticipant` or `RemoveListener` SHALL remove the listener.

#### Scenario: Recording listener gets both sides
- **WHEN** a listener is added selecting the caller's track and the app's track
- **THEN** it receives two separate streams, one per track

#### Scenario: Listener audio destination
- **WHEN** a controller calls `AddParticipant` `{ room_ref: "r1", listen: [{ track_id: 1, rtp: { ip: "10.0.0.5", port: 40100, codec: "L16/16000" } }] }`
- **THEN** the response is a `Participant` and RTP for track 1 arrives at 10.0.0.5:40100

#### Scenario: Listener cannot speak
- **WHEN** a listener sends audio
- **THEN** the room's participants do not hear it

### Requirement: Calls can carry a lower maximum duration

`CreateCall` and `Answer` MAY carry `max_duration_s`, which SHALL lower the node's maximum call
duration (roomr "Call and room limits") for that call; a value above the node's limit SHALL be
ignored. When it is reached the call ends with `cause: "max_duration"`.

#### Scenario: App limit applied
- **WHEN** the app answers with `max_duration_s: 600` and the call reaches 10 minutes
- **THEN** the node ends the call with `Ended` `cause: "max_duration"`

### Requirement: Ringing before answer

The node SHALL send `180 Ringing` on an inbound caller's leg, without early media, as soon as it
accepts the INVITE and before it opens the control stream. `Answer` on the stream SHALL produce
`200 OK`; `Reject` SHALL produce the given SIP status. No separate ring command SHALL exist.

#### Scenario: Caller hears ringing while the app is unreachable
- **WHEN** an INVITE arrives and the app's URL refuses connections for 2 seconds
- **THEN** the caller receives `180 Ringing` within 200 ms of the INVITE and `200 OK` only when AppBridge sends `Answer` (its fallback started)

#### Scenario: Caller hears ringing while the app is slow
- **WHEN** an INVITE arrives and the app takes 2 seconds to send `Answer`
- **THEN** the caller receives `180 Ringing` within 200 ms of the INVITE and `200 OK` only after the `Answer`

### Requirement: Endings carry a reason

Every ending SHALL carry a `cause`: `call.ended`, `participant.left` and `room.ended` on NATS, and
`Ended` on the control stream, each with `cause` one of `caller_hangup`, `callee_hangup`, `busy`,
`no_answer`, `rejected`, `media_timeout`, `node_error`, `max_duration`, `removed` (a `RemoveParticipant`,
`EndCall`, `EndRoom` or `Hangup`), `app_gone` (the control stream broke, the session endpoint
could not be reached, `Answer` or `Ready` never arrived, or the app leg sent no RTP), plus
`sip_status` when a SIP response or BYE `Reason` header gave one. Apps and controllers SHALL map
`cause` to their own end reasons instead of assuming `caller_hangup`.

#### Scenario: Caller hangs up
- **WHEN** the caller sends BYE
- **THEN** `Ended` on the stream and `call.ended` on NATS carry `cause: "caller_hangup"`

#### Scenario: Dialed party busy
- **WHEN** `CreateCall` gets `486 Busy Here`
- **THEN** `call.ended` carries `cause: "busy"` and `sip_status: 486`

#### Scenario: No RTP from the caller
- **WHEN** the caller's leg sends no RTP for the media timeout (`mediaTimeout`, 15 s by default)
- **THEN** the node ends the call with `cause: "media_timeout"`

#### Scenario: App pod dies
- **WHEN** the app's control stream breaks and keepalive declares it dead
- **THEN** the node sends BYE to the caller and publishes `call.ended` with `cause: "app_gone"`
- **AND** does not open a stream to another app instance

### Requirement: Nodes report capacity and liveness

Each node SHALL publish a heartbeat on `roomr.nodes.<node_ref>.heartbeat` every
`heartbeatInterval` (2 seconds by default) with `node_ref`, `control_addr`, `sip_addr`,
`rtp_ports`, `rooms`, `participants`, `max_rooms`, `codecs`, `version` and `region`. A node
stopping on purpose SHALL stop heartbeating when it starts draining and SHALL publish `node.down`
`{ node_ref }` on the same subject, `roomr.nodes.<node_ref>.heartbeat`, with `type: "node.down"`
(heartbeats carry `type: "node.heartbeat"`), as roomr "Draining is a health signal with a
bounded wait" says. A controller SHALL treat a node whose last heartbeat is older than 6 seconds,
or that said `node.down`, as down and SHALL not place calls on it. The node SHALL write nothing to
the session registry: it uses core NATS only, for heartbeats and events.

#### Scenario: Heartbeats while alive
- **WHEN** a node with 12 rooms, a limit of 200 and version `1.4.0` in region `us-east` is running
- **THEN** at least every 2 seconds it publishes a heartbeat with `rooms: 12`, `max_rooms: 200`, `version: "1.4.0"`, `region: "us-east"` and a `control_addr` a controller can dial

#### Scenario: Heartbeats report the room limit
- **WHEN** a node with `maxRooms: 1` holds one room and is sent another `CreateCall`
- **THEN** the call fails with `RESOURCE_EXHAUSTED` and no INVITE is sent
- **AND** its heartbeat carries `rooms: 1` and `max_rooms: 1`

#### Scenario: Node killed
- **WHEN** a node is killed
- **THEN** within 6 seconds of its last heartbeat every controller stops placing calls on it

#### Scenario: Clean shutdown
- **WHEN** a node receives SIGTERM
- **THEN** it publishes `{ type: "node.down", node_ref }` on `roomr.nodes.<node_ref>.heartbeat`, sends no further heartbeat and controllers stop placing calls on it

#### Scenario: Nothing in the registry
- **WHEN** a node runs, takes calls and stops
- **THEN** no key written by the node appears in the session registry

### Requirement: Hold silences the app and plays hold audio

`Hold` on the control stream (optional `music` URL) SHALL stop mixing the app's audio to the
caller and the caller's audio to the app, and SHALL play `music` to the caller in a loop, or
silence when none is given. The caller's leg SHALL stay `sendrecv` (no re-INVITE). The node SHALL
fetch and loop the music file itself; the URL is fetched as given, because tenant-supplied URLs
are validated upstream by the apiserver and AppBridge. `Resume` SHALL restore both
directions.

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

### Requirement: Roomr is a gRPC service with three nouns

`Roomr` SHALL be a gRPC service (`roomr.v1.Roomr`) at the node's advertised control address, with
three nouns, `Room`, `Call` (a SIP leg with a lifecycle, `RINGING`, `ANSWERED`, `ENDED`, always in
a room) and `Participant` (anything in a room), and exactly six RPCs: `CreateCall`, `EndCall`,
`CreateRoom`, `EndRoom`, `AddParticipant` and `RemoveParticipant`. Errors SHALL be gRPC status
codes with a machine-readable reason. It SHALL NOT offer RPCs that play audio, record or send DTMF.

#### Scenario: CreateCall returns a Call in its room
- **WHEN** a controller calls `CreateCall` with `call_ref: "c1"` and no `room_ref`
- **THEN** the response is a `Call` with `call_ref: "c1"`, a new `room_ref` and `state: RINGING`

#### Scenario: Unknown call
- **WHEN** a controller calls `EndCall` for a `call_ref` the node does not know
- **THEN** the call fails with `NOT_FOUND`

#### Scenario: No app-server RPCs
- **WHEN** a controller lists the methods of `roomr.v1.Roomr`
- **THEN** it finds `CreateCall`, `EndCall`, `CreateRoom`, `EndRoom`, `AddParticipant` and `RemoveParticipant` and no `Play`, `Record`, `Stop` or `SendDtmf`

#### Scenario: Unknown field ignored
- **WHEN** a newer controller sends `CreateCall` with a field the node's `roomr.v1` does not define
- **THEN** the node places the call as usual and ignores the field

#### Scenario: An app records with a listener
- **WHEN** an app wants a recording of its call
- **THEN** it sends `AddListener` on its control stream and writes the listener's RTP itself; the node writes no audio

### Requirement: App audio is RTP negotiated on the control stream

The app's leg SHALL exchange audio with the node as RTP over UDP. A `MediaEndpoint` SHALL have
`ip`, `port`, `codec` (`L16/16000`) and an optional `srtp_key`. `Start` SHALL carry the node's
`MediaEndpoint` for the call; the app SHALL return its own in `Answer` (inbound) or `Ready`
(outbound). Audio MUST NOT travel over the gRPC
stream, NATS or WebSocket, and apps' clients MUST NOT connect to the node directly.

#### Scenario: Endpoints exchanged on the stream
- **WHEN** the node sends `Start` with `media: { ip: "10.0.1.7", port: 30010, codec: "L16/16000" }` and the app answers with `media: { ip: "10.0.0.5", port: 40010, codec: "L16/16000" }`
- **THEN** within 100 ms of the `Answer`, RTP carrying the room's mix arrives at 10.0.0.5:40010
- **AND** RTP the app sends to 10.0.1.7:30010 is heard by the caller

#### Scenario: Audio never on the stream
- **WHEN** a call runs for one minute
- **THEN** no message on the control stream carries audio samples and the stream's byte count stays below 64 KiB

#### Scenario: Encrypted app leg
- **WHEN** both endpoints carry `srtp_key`
- **THEN** audio flows as SRTP and plain RTP from either side is dropped

#### Scenario: Apps never reach the node
- **WHEN** an app's session is running
- **THEN** the app's only connection is its session with AppBridge, and the node sees only AppBridge's control stream and RTP


### Requirement: Each call opens one control stream to the session endpoint

For every call the node SHALL open a new connection to the session endpoint (`CreateCall.session`,
else the configured one, over TLS or mTLS when configured) and start one bidirectional gRPC stream
(`Session.Connect`) whose first message is `Start`. The stream SHALL carry only control: `Start`,
`Dtmf` and `Event` from the node; `Answer`, `Ready`, `Reject`, `Transfer`, `TransferComplete`,
`Hold`, `Resume`, `SendDtmf`, `AddListener`, `RemoveListener` and `Hangup` from the app.

#### Scenario: One connection per call
- **WHEN** 100 inbound calls arrive while the session endpoint fronts 4 app instances
- **THEN** the node opens 100 connections and more than one instance receives streams

#### Scenario: Start is first
- **WHEN** a stream opens
- **THEN** its first message is `Start` with `call_ref`, `direction`, `from`, `to`, `headers`, `room_ref`, `metadata` and the node's `media` endpoint

#### Scenario: Commands are ordered
- **WHEN** the app sends `Hold` then `Resume` on the stream
- **THEN** the node holds the caller and then resumes it, never the reverse, and the caller ends up off hold

#### Scenario: Caller cancels before Answer
- **WHEN** an inbound caller sends `CANCEL` while the app has not sent `Answer`
- **THEN** the caller receives `487`, the app receives `Ended` with `cause: "caller_hangup"` and the stream closes

### Requirement: A broken control stream ends the call

Both ends SHALL send keepalive pings every 10 seconds and treat the stream as dead after 2 missed
pings: the node then hangs the call up with `cause: "app_gone"` and MUST NOT reconnect it to
another app instance; AppBridge ends the session. On an answered outbound call the node SHALL send
BYE with `cause: "app_gone"` when the session endpoint cannot be reached or `Ready` does not
arrive within `readyTimeout` (default 10 s).

#### Scenario: Stream breaks mid-call
- **WHEN** the app instance holding a stream is killed
- **THEN** within 30 seconds the node sends BYE to the caller and no new stream is opened for that call

#### Scenario: Node gone, appbridge notices
- **WHEN** the node holding a stream is killed
- **THEN** within 30 seconds AppBridge ends the session and closes the app's socket

#### Scenario: Ready never arrives
- **WHEN** the callee answers an outbound call and the app opens the stream but never sends `Ready`
- **THEN** after the ready timeout the node sends BYE to the callee and publishes `call.ended` with `cause: "app_gone"`

#### Scenario: Session endpoint unreachable on answer
- **WHEN** the callee answers an outbound call and the session endpoint refuses connections
- **THEN** the node sends BYE to the callee and publishes `call.ended` with `cause: "app_gone"`

### Requirement: Rooms and participants are managed with CreateRoom, EndRoom, AddParticipant and RemoveParticipant

`CreateRoom` SHALL create an empty room (with the given `room_ref`, or a new one;
`ALREADY_EXISTS` when taken) and MAY set its `empty_room_timeout_s` and `max_participants`,
overriding the node's defaults. `EndRoom` SHALL end every call and participant in the room and
publish `room.ended`. `AddParticipant` SHALL add an RTP participant; `RemoveParticipant` SHALL
remove one with `cause: "removed"`. An unknown room SHALL give `NOT_FOUND`; a full room
`RESOURCE_EXHAUSTED` (`room_full`).

#### Scenario: Room without a call
- **WHEN** a controller calls `CreateRoom` `{ room_ref: "lobby" }` and then `AddParticipant` with an RTP endpoint
- **THEN** the room exists with one participant and `participant.joined` is published for it

#### Scenario: EndRoom ends everything
- **WHEN** a controller calls `EndRoom` on a room with a SIP call and an RTP participant
- **THEN** the call ends with `cause: "removed"`, the participant leaves and `room.ended` is published

#### Scenario: Unknown room
- **WHEN** `AddParticipant` names a room the node does not have
- **THEN** it fails with `NOT_FOUND` and nothing changes

#### Scenario: Taken room ref
- **WHEN** `CreateRoom` names a `room_ref` the node already has
- **THEN** it fails with `ALREADY_EXISTS` and the existing room is unchanged

#### Scenario: Participant removed
- **WHEN** a controller calls `RemoveParticipant` on an RTP participant
- **THEN** it leaves the room and `participant.left` carries `cause: "removed"`

### Requirement: The app sends DTMF on the caller's leg

`SendDtmf` on the control stream SHALL send its digits (`0`-`9`, `*`, `#`, `A`-`D`) to the caller
as RFC 4733 events on the call's SIP leg, in order. DTMF is the one signalling action the app needs
the node for, because only the node holds the caller's leg; there is no `SendDtmf` RPC on `Roomr`.

#### Scenario: DTMF sent
- **WHEN** the app sends `SendDtmf` with digits `12#` on its call's control stream
- **THEN** the caller's leg receives RFC 4733 events for `1`, `2` and `#` in order

### Requirement: Events on NATS are keyed by call with sequence numbers and metadata

The node SHALL publish call events (`call.started`, `call.ringing`, `call.answered`, `call.ended`,
`participant.joined`, `participant.left`) on `roomr.events.<call_ref>`, room-scoped events
(`room.ended`, and participant events of non-call participants) on `roomr.events.room.<room_ref>`,
and `registration.state` on `roomr.nodes.<node_ref>.events`. Every event SHALL carry `node_ref`,
a per-call or per-room `seq` that increases by one, the call's `metadata` untouched, and a
timestamp.

#### Scenario: Another replica follows the call
- **WHEN** controller replica A places call `c1` with `metadata: { tenant: "t1" }` and replica B subscribes to `roomr.events.c1`
- **THEN** B receives `call.ringing`, `call.answered` and `call.ended` for `c1`, each with `metadata.tenant: "t1"`

#### Scenario: Sequence numbers are contiguous
- **WHEN** a call produces five events
- **THEN** their `seq` values are 1 through 5 in publication order

#### Scenario: Room events have their own sequence
- **WHEN** an RTP participant joins and leaves room `lobby`, which has no call, and then the room ends
- **THEN** the three events on `roomr.events.room.lobby` carry `seq` 1, 2 and 3

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
