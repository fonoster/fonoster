## RENAMED Requirements

- FROM: `### Requirement: Nodes register to Routr with their session count`
- TO: `### Requirement: Registration is optional and configured`

- FROM: `### Requirement: The node does not capture SIP, record or run speech`
- TO: `### Requirement: The node runs no speech and captures no SIP`

## MODIFIED Requirements

### Requirement: Rooms mix audio for their participants

A room SHALL live on exactly one node and SHALL mix audio so that each participant receives the
sum of every other participant's audio and never its own (mix-minus). The node SHALL mix in 16 kHz
linear audio; a participant whose codec carries a higher rate receives wideband audio encoded at
its codec's rate, not full-band audio. SIP legs, plain RTP endpoints and WebRTC peers SHALL be
able to share one room. Every participant SHALL have one or more tracks, each with a `kind` and a
`codec`. In v1 the only supported `kind` SHALL be `audio`; a request for any other kind MUST be
refused with `unsupported_track_kind` and MUST NOT change the room. A room MUST NOT span nodes.

#### Scenario: Mix-minus with three participants of three kinds
- **WHEN** a SIP caller A, an RTP participant B and a WebRTC peer C are in a room and only A and B send a known tone each
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
other than the configured room, token and call-ref headers.

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

### Requirement: Supported codecs

The node SHALL offer, on SIP legs, `opus/48000/2`, `G722/8000`, `PCMU/8000` and `PCMA/8000` in
that order and SHALL negotiate whichever the peer accepts first, transcoding between the leg's
codec and the room's internal format. On WebRTC legs it SHALL offer Opus then PCMU. It SHALL
refuse an offer with none of these codecs with `488 Not Acceptable Here`.

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
room count, or as its room limit while the node is draining. The node SHALL re-register on the
interval and SHALL re-register at once when its room count changes by more than a configured
threshold or when it starts draining, and SHALL publish `registration.state` (media-control) when
a registration succeeds, fails or expires. With no registrations configured the node MUST send no
REGISTER.

#### Scenario: Count sent in a templated header
- **WHEN** a node with 12 active rooms registers with `headers: { X-Session-Count: "{sessions}" }`
- **THEN** the REGISTER carries `X-Session-Count: 12`

#### Scenario: Digest challenge answered
- **WHEN** the registrar answers `401` with a digest challenge and the registration has `auth`
- **THEN** the node re-sends the REGISTER with valid credentials and the registrar answers `200 OK`

#### Scenario: No registrations
- **WHEN** the configuration lists no registrations
- **THEN** the node sends no REGISTER and still accepts INVITEs

#### Scenario: Draining reports full
- **WHEN** a node with a limit of 200 rooms and 3 active rooms starts draining
- **THEN** it re-registers at once with `{sessions}` rendered as `200`

### Requirement: Draining nodes take no new rooms

On SIGTERM a node SHALL set `draining: true` in its heartbeat, SHALL render its registration
templates as full, SHALL refuse new INVITEs with `503` and new `CreateCall` requests with
`UNAVAILABLE`, SHALL keep existing rooms running, and SHALL exit when all its rooms have ended or a
configured maximum wait has passed.

#### Scenario: Drain
- **WHEN** a node with 3 active rooms receives SIGTERM
- **THEN** its next heartbeat carries `draining: true` and a new INVITE gets `503`
- **AND** the 3 rooms continue until they end
- **AND** the node exits after the last room ends

#### Scenario: Maximum wait
- **WHEN** a draining node still has rooms after the maximum wait
- **THEN** it ends those rooms, and each app receives `Ended` with `cause: "node_error"` on its control stream before the stream closes

### Requirement: A crashed node's calls end cleanly

When a node stops without draining, every call it carried SHALL end: each app SHALL see its
control stream close, and controllers SHALL see the node's heartbeats stop. Calls MUST NOT be
migrated to another node.

#### Scenario: Node killed mid-call
- **WHEN** a node carrying a call is killed
- **THEN** the app's control stream closes within 30 seconds (keepalive) and its RTP stops
- **AND** no heartbeat from that node arrives after the kill

### Requirement: Optional TLS and SRTP between the edge and the node

The node SHALL support plain SIP and RTP, and TLS signaling with SRTP media, chosen per
deployment. With encryption on, the node MUST refuse unencrypted SIP and RTP from the edge. The
app leg MAY also be encrypted: a `MediaEndpoint` with an `srtp_key` uses SRTP (media-control).

#### Scenario: Encrypted deployment
- **WHEN** a deployment enables encryption and a peer sends an INVITE over TLS offering SRTP
- **THEN** the call is answered with SRTP and audio flows

#### Scenario: Plain call refused when encryption is required
- **WHEN** encryption is enabled and an INVITE arrives over plain TCP
- **THEN** the node refuses the call

### Requirement: Call and room limits

The node SHALL end any call that exceeds the maximum duration, 4 hours by default and lowerable
per call, SHALL refuse to add an eleventh participant to a room by default, and SHALL refuse new
calls at its configured room limit (`max_rooms`): inbound INVITEs with `503` and `CreateCall` with
`RESOURCE_EXHAUSTED`. All three limits SHALL be configurable per deployment.

#### Scenario: Maximum duration
- **WHEN** a call's maximum duration is 10 minutes and the call reaches 10 minutes
- **THEN** the call ends and the app receives `Ended` with `cause: "max_duration"`

#### Scenario: Room full
- **WHEN** a room has 10 participants and another is added
- **THEN** the request fails with `room_full` and the room is unchanged

#### Scenario: Node at its limit
- **WHEN** a node with `max_rooms: 200` carries 200 rooms
- **THEN** a new INVITE receives `503` and `CreateCall` fails with `RESOURCE_EXHAUSTED`
- **AND** the 200 rooms are unaffected

### Requirement: The node runs no speech and captures no SIP

The node SHALL NOT run speech recognition, speech synthesis or turn detection, and SHALL NOT
capture SIP traces (out of scope for the first release). It SHALL record audio only when asked
through a `Record` operation (media-control) and SHALL write nothing otherwise.

#### Scenario: Speech stays above the node
- **WHEN** a call with speech recognition and synthesis runs end to end
- **THEN** the node receives and sends only RTP and control messages, never text

#### Scenario: Nothing recorded unless asked
- **WHEN** a call runs without any `Record` operation
- **THEN** the node writes no audio file

### Requirement: Rooms without an owner end

The node SHALL end, with `cause: "node_error"`, a room that has had no participant and no
`CreateCall` in progress for 30 s (configurable). A `CreateCall` that fails in an otherwise empty
room SHALL end the room at once with the call's outcome. A call whose app is gone is ended by the
control stream's keepalive (media-control), not by this rule.

#### Scenario: Placer died before anything joined
- **WHEN** a room is created with `CreateRoom` and nothing joins or dials into it for 30 s
- **THEN** the node ends it, frees its slot and publishes `room.ended` with `cause: "node_error"` on `roomr.events.room.<room_ref>`

#### Scenario: Room emptied
- **WHEN** the last participant leaves a room created with `CreateRoom` and nothing joins for 30 s
- **THEN** the node ends the room with `cause: "node_error"`

## ADDED Requirements

### Requirement: Two-party rooms on the same codec pass audio through

When a room has exactly two participants whose legs use the same codec, the node SHALL forward
each participant's RTP payloads to the other without decoding. When a third participant joins, the
node SHALL switch the room to mixing; when the room returns to two participants on the same
codec it MAY return to passthrough. Keypress detection SHALL keep working in passthrough.

#### Scenario: Payloads forwarded unchanged
- **WHEN** two PCMU participants are alone in a room and one sends a known payload sequence
- **THEN** the other receives the same payload bytes
- **AND** the node's decoder is not invoked for that room

#### Scenario: Third participant switches to mixing
- **WHEN** a third participant joins a passthrough room and sends a tone
- **THEN** both original participants hear the tone mixed with each other's audio

#### Scenario: Different codecs are mixed
- **WHEN** a room has one PCMU participant and one Opus participant
- **THEN** the node transcodes and mixes; the Opus participant receives Opus frames carrying the PCMU participant's audio

### Requirement: WebRTC participants terminate on the node

The node SHALL accept WebRTC participants through `Join` with an SDP offer (media-control) and
SHALL return an SDP answer. It SHALL run ICE on one configured UDP port per node, telling
participants apart by ICE username, SHALL secure media with DTLS-SRTP and SHALL offer Opus then
PCMU. No media relay in front of the node SHALL be required.

#### Scenario: Browser joins a room
- **WHEN** a controller calls `Join` with a browser's SDP offer for room `r1` where a SIP caller is present
- **THEN** the response carries an SDP answer, the browser connects over ICE and DTLS-SRTP on the node's WebRTC port
- **AND** the browser and the SIP caller hear each other

#### Scenario: Two peers share the port
- **WHEN** two browsers join rooms on the same node
- **THEN** both exchange media on the node's single WebRTC UDP port and neither hears the other's room

### Requirement: Inbound calls can join a room by header

When the configuration names a room header, an inbound INVITE that carries it SHALL join the room
with that ref if it exists on this node. If it does not exist the node SHALL create it with that
ref and add the caller (`onMissingRoom: create`, the default), or SHALL reject the INVITE with
`404 Not Found` (`onMissingRoom: reject`). `Start` on the control stream SHALL name the room. The
node MUST NOT redirect (no `3xx`) a call toward another node. Without a configured room header, the
node SHALL treat every header as opaque.

#### Scenario: Join an existing room
- **WHEN** room `r1` exists on the node and an INVITE arrives with `X-Room-Ref: r1` (the configured header)
- **THEN** the caller is added to `r1` and hears its other participants
- **AND** `Start` carries `room_ref: "r1"`

#### Scenario: Create on missing room
- **WHEN** no room `r2` exists and an INVITE arrives with `X-Room-Ref: r2` under the default policy
- **THEN** the node creates room `r2` with the caller as its only participant

#### Scenario: Reject on missing room
- **WHEN** `onMissingRoom: reject` is configured and an INVITE names a room that does not exist on this node
- **THEN** the caller receives `404 Not Found` and no room is created

#### Scenario: Never redirect
- **WHEN** an INVITE names a room that lives on another node
- **THEN** the node answers `404` or creates a local room per policy, and never answers with a `3xx`

### Requirement: Room joins can require a token

When room-header authentication is configured as `jwt`, the node SHALL require a token in the
configured token header and SHALL verify its signature with the configured public key, its expiry,
its audience and that its `room_ref` claim equals the room header. A missing, expired, malformed or
mismatched token SHALL be refused with `403 Forbidden`. The node SHALL hold no private key.
A token SHALL be bound to one `room_ref` and short-lived (its issuer sets a short `exp`); the node SHALL NOT track token ids, so a
token may be replayed only until it expires. The node SHALL remove the token header from
`Start.headers` and SHALL NOT log the token. Room refs the node generates SHALL be unguessable
(at least 128 random bits).

#### Scenario: Token not passed on
- **WHEN** a caller joins `r1` with a valid token
- **THEN** `Start.headers` does not contain the token header and no log line contains the token

#### Scenario: Generated refs are random
- **WHEN** the node creates 1,000 rooms without a given `room_ref`
- **THEN** every `room_ref` is distinct and carries at least 128 bits from a random source

#### Scenario: Valid token
- **WHEN** an INVITE carries `X-Room-Ref: r1` and a token signed by the configured key with `aud: media` and `room_ref: r1`
- **THEN** the caller joins `r1`

#### Scenario: Room mismatch
- **WHEN** the token's `room_ref` claim is `r9` and the header names `r1`
- **THEN** the caller receives `403 Forbidden`

#### Scenario: Expired or missing token
- **WHEN** the token is expired, or the token header is absent while auth is on
- **THEN** the caller receives `403 Forbidden`

### Requirement: The node knows no other component by name

The node SHALL learn every peer from its configuration or from request parameters: the outbound
proxy, the registrars, the session endpoint, the room and token header names and the NATS
address. It MUST NOT contain built-in SIP header names, component names or routing rules. Headers
on inbound INVITEs SHALL be passed to the app untouched in `Start.headers`; headers given in
`CreateCall` SHALL be sent on the INVITE untouched.

#### Scenario: Outbound headers pass through
- **WHEN** a controller calls `CreateCall` with `to.headers: { "X-DOD-Number": "+15550002", "X-Foo": "bar" }`
- **THEN** the INVITE sent to the proxy carries both headers with those exact values

#### Scenario: Default configuration interprets nothing
- **WHEN** the node runs with no room header configured and an INVITE carries any `X-` headers
- **THEN** the node's behavior does not depend on them and all of them appear in `Start.headers`

#### Scenario: Proxy is a parameter
- **WHEN** two `CreateCall` requests name different `to.proxy` values
- **THEN** each INVITE is sent to the proxy named in its own request

### Requirement: Port ranges are configured per leg type

The node SHALL take RTP ports for app legs from a configured range bound to its own address and
SHALL announce the chosen port on the control stream, so nodes on distinct addresses need no
coordination. For SIP and RTP legs that leave the cluster it SHALL use a configured public range
and advertised address. For WebRTC it SHALL use one configured UDP port. Two nodes on one host
SHALL be able to run with non-overlapping ranges.

#### Scenario: Same range on different addresses
- **WHEN** two nodes on different pod IPs both use ports 30000–30199 for app legs
- **THEN** both carry calls and no port conflict occurs

#### Scenario: Two nodes on one host
- **WHEN** two nodes on one host are configured with ranges 30000–30199 and 30200–30399 and distinct WebRTC ports
- **THEN** both start and both carry SIP and WebRTC calls

#### Scenario: Port announced on the stream
- **WHEN** a call starts
- **THEN** `Start` carries the node's RTP `ip` and `port` for that call, and RTP from the app to that address reaches the room

### Requirement: One call ref end to end

The node SHALL keep one call ref per call across SIP, `Start` and events, using an optional
configured call-ref header (`call_ref_header`, for example `X-Call-Ref`). When an inbound INVITE carries that header with a well-formed value, the value SHALL be the call's
`call_ref`; otherwise the node SHALL generate one. When `CreateCall`'s `to.headers` carries the
configured header, its value SHALL be the call's `call_ref` and SHALL be sent on the INVITE; a
`call_ref` field that is also set and differs SHALL fail with `INVALID_ARGUMENT` before any INVITE.
The same ref SHALL appear in `Start`, in every event and on the SIP leg.

#### Scenario: Inbound ref taken from the header
- **WHEN** `call_ref_header: X-Call-Ref` is configured and an INVITE carries `X-Call-Ref: abc123`
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

### Requirement: A silent app leg ends the call

The node SHALL end a call with `cause: "app_gone"` when the app leg of an answered call sends no
RTP for the app media timeout (configurable, 30 s by default), sending BYE on the SIP leg.

#### Scenario: App stops sending audio
- **WHEN** the app's RTP stops while its control stream stays open
- **THEN** after the app media timeout the node sends BYE to the caller and `Ended` with `cause: "app_gone"` on the stream

### Requirement: Draining is a signal with a bounded wait

On SIGTERM the node SHALL report that it is draining: `draining: true` in its heartbeat, its
readiness probe failing and `{sessions}` rendered as its room limit on REGISTER. It SHALL keep
serving its live rooms, their control streams and `Roomr` RPCs for them until every room has ended
or the configured maximum wait (`drain.max_wait`, default 1 h) has passed, then exit. Keeping new
calls away SHALL be the job of the layers that place them (controller placement and the SIP proxy
through registration).

#### Scenario: Readiness fails on SIGTERM
- **WHEN** a node with 3 live rooms receives SIGTERM
- **THEN** its readiness probe fails, its next heartbeat carries `draining: true` and the 3 rooms keep running

#### Scenario: Exit after the last room
- **WHEN** the last room of a draining node ends before `drain.max_wait`
- **THEN** the node publishes `node.down` and exits

#### Scenario: Maximum wait reached
- **WHEN** a short `drain.max_wait` passes while a draining node still has a room
- **THEN** the node ends it with `cause: "node_error"` and exits

### Requirement: The room limit is the only admission limit

The node SHALL refuse new calls for capacity only at `max_rooms`. It SHALL NOT refuse calls because
of CPU, memory or `cpu_idle`; resource control belongs to Kubernetes requests and limits.

#### Scenario: Loaded node still accepts
- **WHEN** a node's CPU is saturated and its `rooms` is below `max_rooms`
- **THEN** an INVITE is accepted and `CreateCall` succeeds
