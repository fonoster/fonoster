## RENAMED Requirements

- FROM: `### Requirement: Nodes register to Routr with their session count`
- TO: `### Requirement: Registration is optional and configured`

- FROM: `### Requirement: The node does not capture SIP, record or run speech`
- TO: `### Requirement: The node never records and captures no SIP`

## REMOVED Requirements

### Requirement: Optional TLS and SRTP between the edge and the node

**Reason**: The node no longer offers a mode that requires encryption (`requireEncryption` and
edge mTLS are removed); SIP TLS, SDES-SRTP and gRPC TLS stay available and off by default, and a
plain leg is always accepted. Replaced by "SIP TLS and SRTP are optional and off by default".
**Migration**: Drop `requireEncryption` and `tls.clientCa` from `roomr.yaml` (the node refuses
them at start); keep `tls.listen`/`cert`/`key` for SIP over TLS. Use network isolation to keep
plain traffic off untrusted networks.

### Requirement: Draining nodes take no new rooms

**Reason**: The node no longer refuses while draining and no longer reports itself full. It
signals draining through the standard gRPC health service and by stopping its heartbeats and
unregistering; the layers that place calls stop sending (see "Draining is a health signal with a
bounded wait"). The room-limit refusal stays.
**Migration**: Remove the draining refusal code (`503`, `UNAVAILABLE`), the `draining` heartbeat
field and the `{sessions}`-as-limit rendering; probe readiness with `grpc.health.v1.Health`.

## MODIFIED Requirements

### Requirement: Rooms mix audio for their participants

A room SHALL live on exactly one node and SHALL mix audio so that each participant receives the
sum of every other participant's audio and never its own (mix-minus). The node SHALL mix in 16 kHz
linear audio; a participant whose codec carries a higher rate receives wideband audio encoded at
its codec's rate, not full-band audio. SIP legs and plain RTP endpoints SHALL be able to share one
room. Every participant SHALL have one or more tracks, each with a `kind` and a `codec`. In v1 the
only supported `kind` SHALL be `audio`; a request for any other kind MUST be refused with
`unsupported_track_kind` and MUST NOT change the room. A room MUST NOT span nodes.

#### Scenario: Mix-minus with three participants
- **WHEN** a SIP caller A, an RTP participant B and an RTP participant C are in a room and only A and B send a known tone each
- **THEN** C receives both tones mixed
- **AND** A receives only B's tone, and B receives only A's tone

#### Scenario: Silence is not echoed
- **WHEN** a participant is alone in a room and speaks
- **THEN** it receives silence

#### Scenario: Opus caller hears wideband, not full-band
- **WHEN** an Opus caller shares a room with a PCMU caller who plays a tone sweep up to 20 kHz
- **THEN** the Opus caller receives the sweep up to 8 kHz and nothing above it

#### Scenario: Video track refused in v1
- **WHEN** a participant is added with a track of `kind: "video"`
- **THEN** the request fails with `unsupported_track_kind`
- **AND** the room and its other participants are unchanged

### Requirement: Inbound calls become rooms

When an INVITE arrives from any SIP peer, the node SHALL answer `180 Ringing` without early media,
SHALL create a room with the caller as a SIP-leg participant (unless the room header names a room,
see "Inbound calls can join a room by header"), SHALL open a control stream to its configured
session endpoint and SHALL send `Start` carrying `call_ref`, `direction: INBOUND`, `from`, `to`,
`room_ref`, every header of the INVITE as a map and the node's RTP endpoint (media-control). The
node SHALL NOT send `200 OK` until the app sends `Answer` on that stream. It SHALL reject the
INVITE with `503 Service Unavailable` when the session endpoint cannot be reached and with
`480 Temporarily Unavailable` when neither `Answer` nor `Reject` arrives within the configured
answer timeout. A `CANCEL` from the caller before `Answer` SHALL end the call (media-control
"Each call opens one control stream to the session endpoint"). It MUST NOT interpret any header
other than the configured room and call-ref headers. A header value containing CR or LF SHALL be
rejected.

#### Scenario: Inbound call reported with its headers
- **WHEN** a peer sends an INVITE with `X-App-Ref: app-1`, `X-Anything: 42` and `To: sip:+15550001@...`
- **THEN** the node creates one room with the caller as its only SIP-leg participant
- **AND** opens one control stream and sends `Start` with `to: "+15550001"` and `headers` containing `X-App-Ref: app-1` and `X-Anything: 42` unchanged
- **AND** sends `180 Ringing` and no `200 OK` before an `Answer`

#### Scenario: Session endpoint unreachable
- **WHEN** an INVITE arrives and the session endpoint refuses connections
- **THEN** the caller receives `503 Service Unavailable` and no room remains

#### Scenario: App never answers
- **WHEN** the app leaves the stream open but sends neither `Answer` nor `Reject` within the answer timeout
- **THEN** the caller receives `480 Temporarily Unavailable` and the stream is closed

#### Scenario: App rejects
- **WHEN** the app sends `Reject` with `sip_status: 404`
- **THEN** the caller receives `404 Not Found` and no room remains

#### Scenario: INVITE from an untrusted source
- **WHEN** an INVITE with `X-App-Ref: app-1` arrives from an address that is not the SIP proxy's
- **THEN** the node handles it like any other INVITE: it filters no sources, and the deployment's network isolation (deployment "Network isolation guards Roomr's ports") is what keeps such peers out

#### Scenario: Chart without trusted sources
- **WHEN** the Helm chart is rendered with default values
- **THEN** rendering succeeds and the rendered `roomr.yaml` has no `trustedSources` or `allowAnySource` key

#### Scenario: CR or LF in a header value
- **WHEN** a controller calls `CreateCall` with a `to.headers` value containing a line break
- **THEN** the request fails with `INVALID_ARGUMENT` and no INVITE is sent

### Requirement: Supported codecs

The node SHALL offer, on SIP legs, `opus/48000/2`, `G722/8000`, `PCMU/8000` and `PCMA/8000` in
that order and SHALL negotiate whichever the peer accepts first, transcoding between the leg's
codec and the room's internal format. It SHALL refuse an offer with none of these codecs with
`488 Not Acceptable Here`.

#### Scenario: Each codec carries audio both ways
- **WHEN** a test caller offers only one of PCMU, PCMA, G.722 or Opus and sends a known tone
- **THEN** the call is answered with that codec
- **AND** the tone reaches the other room participants, and their audio reaches the caller

#### Scenario: Opus preferred when the peer accepts it
- **WHEN** a caller offers PCMU and Opus
- **THEN** the call is answered with Opus

#### Scenario: Offer order on outbound legs
- **WHEN** the node sends an INVITE for `CreateCall`
- **THEN** its SDP lists `opus/48000/2`, `G722/8000`, `PCMU/8000`, `PCMA/8000` in that order

#### Scenario: No common codec
- **WHEN** a caller offers only GSM
- **THEN** the node answers `488 Not Acceptable Here`

### Requirement: Registration is optional and configured

The node SHALL keep zero or more SIP registrations from its configuration, each with a
`registrar`, an `aor`, an optional digest `auth`, an `expires` interval and a map of header
templates. Templates SHALL support the placeholder `{sessions}`, rendered as the node's active
room count. The node SHALL re-register on the interval and SHALL re-register at once when its room
count changes by more than the configured `reregisterDelta`, and SHALL publish
`registration.state` (media-control) when a registration succeeds, fails or expires. With no
registrations configured the node MUST send no REGISTER.

#### Scenario: Count sent on registration
- **WHEN** a node with 12 active rooms registers with `headers: { X-Session-Count: "{sessions}" }`
- **THEN** the REGISTER carries `X-Session-Count: 12`

#### Scenario: Digest challenge answered
- **WHEN** the registrar answers `401` with a digest challenge and the registration has `auth`
- **THEN** the node re-sends the REGISTER with valid credentials and the registrar answers `200 OK`

#### Scenario: No registrations
- **WHEN** the configuration lists no registrations
- **THEN** the node sends no REGISTER and still accepts INVITEs

#### Scenario: Routr prefers the lighter node
- **WHEN** node A registers with `X-Session-Count: "{sessions}"` rendered as 40 and node B as 5, and a new inbound call arrives at a Routr balancing with `least-sessions`
- **THEN** Routr sends the INVITE to node B

### Requirement: A crashed node's calls end cleanly

When a node stops without draining, every call it carried SHALL end: each app SHALL see its
control stream close, and controllers SHALL see the node's heartbeats stop. Calls MUST NOT be
migrated to another node.

#### Scenario: Node killed mid-call
- **WHEN** a node carrying a call is killed
- **THEN** the app's control stream closes within 30 seconds (keepalive) and its RTP stops
- **AND** no heartbeat from that node arrives after the kill

### Requirement: Call and room limits

The node SHALL end any call that exceeds the maximum duration, 4 hours by default and lowerable
per call, SHALL refuse to add an eleventh participant to a room by default (`maxParticipants`,
overridable per room in `CreateRoom`), and SHALL refuse new calls at its configured room limit
(`maxRooms`): inbound INVITEs with `503` and `CreateCall` with `RESOURCE_EXHAUSTED`. All three
limits SHALL be configurable per deployment.

#### Scenario: Maximum duration
- **WHEN** a call's maximum duration is 10 minutes and the call reaches 10 minutes
- **THEN** the call ends and the app receives `Ended` with `cause: "max_duration"`

#### Scenario: Room full
- **WHEN** a room has 10 participants and another is added
- **THEN** the request fails with `room_full` and the room is unchanged

#### Scenario: Per-room participant limit
- **WHEN** a room is created with `CreateRoom` and `max_participants: 2`, and a third participant is added
- **THEN** the request fails with `room_full`

#### Scenario: Node full
- **WHEN** a node with `maxRooms: 2` carries 2 rooms
- **THEN** a new INVITE receives `503` and `CreateCall` fails with `RESOURCE_EXHAUSTED`
- **AND** the 2 rooms are unaffected, and after one of them ends the next `CreateCall` succeeds

### Requirement: The node never records and captures no SIP

The node SHALL NOT capture SIP traces (out of scope for the first release) and SHALL NOT record or
write audio. Recording is a listener (media-control "Listeners fork audio by track"): the node
forks the selected tracks as RTP to the listener's destinations, and whoever added the listener
(AppBridge) writes the record.

#### Scenario: The node writes no audio
- **WHEN** a call runs, with or without a recording listener
- **THEN** the node writes no audio file

#### Scenario: Recording is a listener
- **WHEN** AppBridge records a call
- **THEN** it adds a listener with `AddListener` on the call's control stream, receives the selected tracks as RTP and writes the record itself

### Requirement: Rooms without an owner end

The node SHALL end, with `cause: "node_error"`, a room that has had no participant and no
`CreateCall` in progress for the empty-room timeout (`emptyRoomTimeout`, 30 s by default,
overridable per room in `CreateRoom`). A `CreateCall` that fails in an otherwise empty room SHALL
end the room at once with the call's outcome. A call whose app is gone is ended by the control
stream's keepalive (media-control), not by this rule.

#### Scenario: Placer died before the dial
- **WHEN** a room is created with `CreateRoom` and nothing joins or dials into it for 30 s
- **THEN** the node ends it, frees its slot and publishes `room.ended` with `cause: "node_error"` on `roomr.events.room.<room_ref>`

#### Scenario: Room emptied
- **WHEN** the last participant leaves a room created with `CreateRoom` and nothing joins for 30 s
- **THEN** the node ends the room with `cause: "node_error"`

#### Scenario: Per-room timeout
- **WHEN** a room is created with `CreateRoom` and `empty_room_timeout_s: 5` and nothing joins
- **THEN** the node ends it after 5 s

#### Scenario: AppBridge killed mid-call
- **WHEN** the AppBridge holding an answered call's control stream is killed
- **THEN** the stream's keepalive ends the call within two missed pings: the node sends BYE to the caller and publishes `call.ended` with `cause: "app_gone"`, without waiting for the empty-room timeout

## ADDED Requirements

### Requirement: SIP TLS and SRTP are optional and off by default

The node SHALL support plain SIP and RTP by default. It MAY listen for SIP over TLS when `tls`
(`listen`, `cert`, `key`) is configured, MAY use TLS to the outbound proxy when the proxy URI says
so, and SHALL negotiate SDES-SRTP when the peer offers or requests it. All of these are off by
default. The app leg MAY also be encrypted: a `MediaEndpoint` with an `srtp_key` uses SRTP
(media-control).

#### Scenario: Encrypted deployment
- **WHEN** the node has a SIP TLS listener and a peer sends an INVITE over TLS offering SRTP
- **THEN** the call is answered with SRTP and audio flows

#### Scenario: Plain by default
- **WHEN** no `tls` is configured and an INVITE arrives over UDP offering plain RTP
- **THEN** the call is answered with plain RTP

### Requirement: Inbound calls can join a room by header

When the configuration names a room header, an inbound INVITE that carries it SHALL join the room
with that ref if it exists on this node and SHALL create it with that ref, adding the caller, if it
does not. `Start` on the control stream SHALL name the room. The node MUST NOT redirect (no `3xx`)
a call toward another node. Without a configured room header, the node SHALL treat every header as
opaque. Room refs the node generates SHALL be unguessable (at least 128 random bits).

#### Scenario: Join an existing room
- **WHEN** room `r1` exists on the node and an INVITE arrives with `X-Room-Ref: r1` (the configured header)
- **THEN** the caller is added to `r1` and hears its other participants
- **AND** `Start` carries `room_ref: "r1"`

#### Scenario: Create on missing room
- **WHEN** no room `r2` exists and an INVITE arrives with `X-Room-Ref: r2`
- **THEN** the node creates room `r2` with the caller as its only participant

#### Scenario: Never redirect
- **WHEN** an INVITE names a room that lives on another node
- **THEN** the node creates a local room and never answers with a `3xx`

#### Scenario: Generated refs are random
- **WHEN** the node creates 1,000 rooms without a given `room_ref`
- **THEN** every `room_ref` is distinct and carries at least 128 bits from a random source

### Requirement: The node knows no other component by name

The node SHALL learn every peer from its configuration or from request parameters: the outbound
proxy, the registrars, the session endpoint, the room and call-ref header names and the NATS
address. It MUST NOT contain built-in SIP header names, component names or routing rules. Inbound
INVITE headers SHALL reach the app untouched in `Start.headers`, and `CreateCall` headers SHALL be
sent on the INVITE untouched. The outbound proxy's URI SHALL carry its transport.

#### Scenario: Outbound headers pass through
- **WHEN** a controller calls `CreateCall` with `to.headers: { "X-DOD-Number": "+15550002", "X-Foo": "bar" }`
- **THEN** the INVITE sent to the proxy carries both headers with those exact values

#### Scenario: Default configuration interprets nothing
- **WHEN** the node runs with no room header configured and an INVITE carries any `X-` headers
- **THEN** the node's behavior does not depend on them and all of them appear in `Start.headers`

#### Scenario: Proxy is a parameter
- **WHEN** two `CreateCall` requests name different `to.proxy` values
- **THEN** each INVITE is sent to the proxy named in its own request

#### Scenario: Transport in the proxy URI
- **WHEN** the outbound proxy is `sip:routr:5060;transport=tcp`
- **THEN** dialed INVITEs go to routr:5060 over TCP, with no separate transport setting

### Requirement: One RTP port range serves every leg

The node SHALL take RTP ports for every leg, app legs and SIP legs alike, from one configured
range (`rtp.portMin` to `rtp.portMax`) bound to `rtp.host`, and SHALL announce the chosen port on
the control stream, so nodes on distinct addresses need no coordination. For legs that leave the
cluster it SHALL advertise `rtp.advertise`. Two nodes on one host SHALL be able to run with
non-overlapping ranges.

#### Scenario: Same range on different addresses
- **WHEN** two nodes on different pod IPs both use ports 30000–30199
- **THEN** both carry calls and no port conflict occurs

#### Scenario: Two nodes on one host
- **WHEN** two nodes on one host are configured with ranges 30000–30199 and 30200–30399
- **THEN** both start and both carry SIP calls

#### Scenario: Port announced on the stream
- **WHEN** a call starts
- **THEN** `Start` carries the node's RTP `ip` and `port` for that call, and RTP from the app to that address reaches the room

### Requirement: One call ref end to end

The node SHALL keep one call ref per call across SIP, `Start` and events, using an optional
configured call-ref header (`callRefHeader`). A well-formed value of that header on an inbound
INVITE, or in `CreateCall`'s `to.headers`, SHALL be the call's `call_ref` (sent on the INVITE for
outbound calls); otherwise the node SHALL generate one. A `call_ref` field that differs from the
header SHALL fail with `INVALID_ARGUMENT` before any INVITE.

#### Scenario: Inbound ref taken from the header
- **WHEN** `callRefHeader: X-Call-Ref` is configured and an INVITE carries `X-Call-Ref: abc123`
- **THEN** `Start` carries `call_ref: "abc123"` and events are published on `roomr.events.abc123`

#### Scenario: Inbound ref generated
- **WHEN** an INVITE has no `X-Call-Ref`, or a malformed one
- **THEN** the node generates a `call_ref` and uses it in `Start` and every event

#### Scenario: Outbound ref from the headers
- **WHEN** `CreateCall` has no `call_ref` and `to.headers: { "X-Call-Ref": "out7" }`
- **THEN** the `Call` has `call_ref: "out7"` and the INVITE carries `X-Call-Ref: out7`

#### Scenario: Conflicting refs
- **WHEN** `CreateCall` has `call_ref: "a"` and `to.headers: { "X-Call-Ref": "b" }`
- **THEN** it fails with `INVALID_ARGUMENT` and no INVITE is sent

### Requirement: A silent leg ends the call

The node SHALL end an answered call when a leg sends no RTP for the media timeout (`mediaTimeout`,
one key for the caller leg and the app leg, 15 s by default, like LiveKit), with `cause: "media_timeout"` when
the caller's leg went silent and `cause: "app_gone"` when the app's did, sending BYE on the SIP
leg.

#### Scenario: App stops sending audio
- **WHEN** the app's RTP stops while its control stream stays open
- **THEN** after the media timeout the node sends BYE to the caller and `Ended` with `cause: "app_gone"` on the stream

#### Scenario: Caller stops sending audio
- **WHEN** the caller's RTP stops
- **THEN** after the same media timeout the node ends the call with `cause: "media_timeout"`

### Requirement: Draining is a health signal with a bounded wait

The node SHALL serve `grpc.health.v1.Health` on its control port, `SERVING` normally. On SIGTERM
it SHALL report `NOT_SERVING`, send REGISTER with `Expires: 0` for each registration, stop its
heartbeats and publish `node.down` on `roomr.nodes.<node_ref>.heartbeat`, then keep its live
rooms, streams and RPCs until every room ends or `drainWait` (default 1 h) passes, end what
remains with `cause: "node_error"` and exit. It SHALL NOT refuse calls because it is draining.

#### Scenario: Health fails on SIGTERM
- **WHEN** a node with 3 live rooms receives SIGTERM
- **THEN** its gRPC health check reports `NOT_SERVING`, it sends REGISTER with `Expires: 0`, publishes `node.down` and stops heartbeating
- **AND** the 3 rooms keep running

#### Scenario: Exit after the last room
- **WHEN** the last room of a draining node ends before `drainWait`
- **THEN** the node exits

#### Scenario: Maximum wait reached
- **WHEN** a short `drainWait` passes while a draining node still has a room
- **THEN** it ends the room, the app receives `Ended` with `cause: "node_error"` on its control stream before the stream closes, and the node exits

#### Scenario: Calls kept away by the layers that place them
- **WHEN** a draining node is sent an INVITE or a `CreateCall` anyway, below its room limit
- **THEN** it accepts the call; the controller skipped it for lack of fresh heartbeats, the SIP proxy after `Expires: 0` and the orchestrator after the failed readiness probe, so this happens only in a race

### Requirement: The room limit is the only admission limit

The node SHALL refuse new calls for capacity only at `maxRooms`. It SHALL NOT refuse calls because
of CPU or memory; resource control belongs to Kubernetes requests and limits.

#### Scenario: Loaded node still accepts
- **WHEN** a node's CPU is saturated and its `rooms` is below `maxRooms`
- **THEN** an INVITE is accepted and `CreateCall` succeeds
