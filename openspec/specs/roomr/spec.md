# roomr Specification

## Purpose
The Go Roomr node: SIP and RTP handling, codecs, rooms and recording.
## Requirements
### Requirement: Rooms mix audio for their participants

A room SHALL live on exactly one Roomr node and SHALL mix audio so that each participant receives
the sum of every other participant's audio and never its own (mix-minus). Every participant SHALL
have one or more tracks, each with a `kind` and a `codec`. In v1 the only supported `kind` SHALL be
`audio`; a request for any other kind MUST be refused with `unsupported_track_kind` and MUST NOT
change the room.

#### Scenario: Mix-minus with three participants
- **WHEN** participants A, B and C are in a room and only A and B send a known tone each
- **THEN** C receives both tones mixed
- **AND** A receives only B's tone, and B receives only A's tone

#### Scenario: Silence is not echoed
- **WHEN** a participant is alone in a room and speaks
- **THEN** it receives silence

#### Scenario: Video track refused in v1
- **WHEN** a participant is added with a track of `kind: "video"`
- **THEN** the request fails with `unsupported_track_kind`
- **AND** the room and its other participants are unchanged

### Requirement: Inbound calls become rooms

When an INVITE arrives from Routr, the node SHALL create a room, add the caller as a SIP-leg
participant, read `X-App-Ref`, `X-Call-Ref` and `X-Call-Direction` and the `To` user (the ingress
number), and send `call.incoming` so that one AppBridge replica claims the call and opens the app's
session (media-control). Routr's headers are the source of truth for which app gets the call, so
the node SHALL accept INVITEs only from its trusted sources (Routr's addresses). The deployments
SHALL set them: the Compose bundle to Routr's address, the Helm chart to the private ranges by
default, and the chart SHALL refuse to render an empty list unless `allowAnySource` is set for
development. The node SHALL NOT answer the call until AppBridge asks it to, and SHALL refuse it
with `503` when no AppBridge claims it.

#### Scenario: Inbound call reported with its headers
- **WHEN** Routr sends an INVITE with `X-App-Ref: app-1`, `X-Call-Ref: call-9` and `To: sip:+15550001@...`
- **THEN** the node creates one room with the caller as its only SIP-leg participant
- **AND** sends a `call.incoming` request with `appRef: "app-1"`, `callRef: "call-9"` and `to: "+15550001"`
- **AND** sends no 200 OK before an `answer` command

#### Scenario: INVITE from an untrusted source
- **WHEN** an INVITE with `X-App-Ref: app-1` arrives from an address outside the trusted sources
- **THEN** the node refuses it and sends no `call.incoming`

#### Scenario: Chart without trusted sources
- **WHEN** the Helm chart is rendered with `roomr.trustedSources` empty and `allowAnySource` unset
- **THEN** rendering fails with a message naming `roomr.trustedSources`

### Requirement: Supported codecs

The node SHALL negotiate PCMU, PCMA, G.722 and Opus on SIP legs and SHALL transcode between a leg's
codec and the room's internal format. It SHALL refuse an offer with none of these codecs with
`488 Not Acceptable Here`.

#### Scenario: Each codec carries audio both ways
- **WHEN** a test caller offers only one of PCMU, PCMA, G.722 or Opus and sends a known tone
- **THEN** the call is answered with that codec
- **AND** the tone reaches the other room participants, and their audio reaches the caller

#### Scenario: No common codec
- **WHEN** a caller offers only GSM
- **THEN** the node answers `488 Not Acceptable Here`

### Requirement: DTMF is detected three ways

The node SHALL detect keypresses sent as RFC 4733 events, as SIP INFO, and as in-band tones. In-band
detection SHALL run only when neither RFC 4733 nor SIP INFO is in use on the leg. Each keypress
SHALL be reported once, with the digit and its source.

#### Scenario: RFC 4733
- **WHEN** a caller with `telephone-event` negotiated presses `5`
- **THEN** one `dtmf` event with `digit: "5"` and `source: "rfc4733"` is reported

#### Scenario: SIP INFO
- **WHEN** a caller sends SIP INFO with `Signal=7`
- **THEN** one `dtmf` event with `digit: "7"` and `source: "sip_info"` is reported

#### Scenario: In-band fallback
- **WHEN** a caller with no `telephone-event` negotiated plays the tone for `#`
- **THEN** one `dtmf` event with `digit: "#"` and `source: "inband"` is reported

#### Scenario: No double report
- **WHEN** a caller sends `1` as RFC 4733 events and the tone is also audible in the audio
- **THEN** exactly one `dtmf` event is reported

### Requirement: Nodes register to Routr with their session count

Each node SHALL register to Routr as a peer and SHALL include `X-Session-Count` with its current
number of active rooms in every REGISTER. It SHALL re-register at a short fixed interval and
SHALL also re-register when its count changes by more than a configured threshold, so Routr's
`least-sessions` algorithm sees fresh load.

#### Scenario: Count sent on registration
- **WHEN** a node with 12 active rooms registers
- **THEN** the REGISTER carries `X-Session-Count: 12`

#### Scenario: Routr prefers the lighter node
- **WHEN** node A reports 40 sessions and node B reports 5, and a new inbound call arrives
- **THEN** Routr sends the INVITE to node B

### Requirement: Draining nodes take no new rooms

On SIGTERM a node SHALL report itself full to Routr, SHALL refuse new rooms, SHALL keep existing
rooms running, and SHALL exit when all its rooms have ended or a configured maximum wait has
passed.

#### Scenario: Drain
- **WHEN** a node with 3 active rooms receives SIGTERM
- **THEN** Routr stops sending it new calls
- **AND** the 3 rooms continue until they end
- **AND** the node exits after the last room ends

#### Scenario: Maximum wait
- **WHEN** a draining node still has rooms after the maximum wait
- **THEN** it ends those rooms, and their apps receive `session.end` with `reason: "error"`

### Requirement: A crashed node's calls end cleanly

When a node stops without draining, every call it carried SHALL end, each affected call record
SHALL be sealed with the failure `node_error`, and each affected app SHALL receive `session.end`
with `reason: "error"`. AppBridges detect the loss from missed `node.heartbeat` messages
(media-control). Calls MUST NOT be migrated to another node.

#### Scenario: Node killed mid-call
- **WHEN** a node carrying a call is killed
- **THEN** the app receives `session.end` with `reason: "error"`
- **AND** the call record is sealed and lists the node failure

### Requirement: Rooms without an owner end

The node SHALL end, with `reason: "node_error"`, a room that has no participant and no
`participant.dial` in progress for 30 s (its placer is gone), and a room whose owning AppBridge
(the `bridgeRef` of the claim reply, or of a command such as `participant.dial`) the node has
heard on `appbridge.heartbeat` and then not for 20 s. A dial that fails in an otherwise empty room
SHALL end the room at once with the dial's outcome. Both times SHALL be configurable; an AppBridge
the node never heard is never judged gone.

#### Scenario: Placer died before the dial
- **WHEN** a room is created with `room.create` and nothing joins or dials into it for 30 s
- **THEN** the node ends it, frees its slot and reports `room.ended`, also on `calls.<callRef>.events`

#### Scenario: AppBridge killed mid-call
- **WHEN** AppBridge that claimed an answered call stops sending heartbeats for 20 s
- **THEN** the node sends BYE to the caller and ends the room with `reason: "node_error"`

### Requirement: Optional TLS and SRTP between the edge and the node

The node SHALL support plain SIP and RTP, and TLS signaling with SRTP media, chosen per deployment.
With encryption on, the node MUST refuse unencrypted SIP and RTP from the edge.

#### Scenario: Encrypted deployment
- **WHEN** a deployment enables encryption and Routr sends an INVITE over TLS offering SRTP
- **THEN** the call is answered with SRTP and audio flows

#### Scenario: Plain call refused when encryption is required
- **WHEN** encryption is enabled and an INVITE arrives over plain TCP
- **THEN** the node refuses the call

### Requirement: Call and room limits

The node SHALL end any call that exceeds the maximum duration, 4 hours by default and lowerable
per app, and SHALL refuse to add an eleventh participant to a room by default. It SHALL hold at
most `maxRooms` rooms at once, 200 by default (the capacity bar): beyond it, `room.create` SHALL
be refused with `at_capacity` and an INVITE with 503, and the node SHALL report itself full to
Routr. All three limits SHALL be configurable per deployment.

#### Scenario: Maximum duration
- **WHEN** an app's maximum duration is 10 minutes and a call reaches 10 minutes
- **THEN** the call ends and the app receives `session.end` with `reason: "timeout"`

#### Scenario: Room full
- **WHEN** a room has 10 participants and another is added
- **THEN** the request fails with `room_full` and the room is unchanged

#### Scenario: Node full
- **WHEN** a node with `maxRooms: 2` holds two rooms and gets `room.create`
- **THEN** the reply is an error with code `at_capacity` and no room is created
- **AND** after one of the rooms ends, the next `room.create` succeeds

### Requirement: The node does not capture SIP, record or run speech

The node SHALL NOT write recordings, capture SIP traces, run speech recognition or synthesis, or
run turn detection. Recording and AMD SHALL reach audio only as listeners. SIP trace capture is
out of scope for the first release (MN10).

#### Scenario: Recording is a listener
- **WHEN** a call's app has recording on
- **THEN** a recording listener is attached to the room through `media-control`
- **AND** the node writes no audio file itself

### Requirement: Capacity bar

A node on 2 vCPU SHALL hold 200 concurrent rooms, each with one G.711 caller and one session
participant, with zero dropped audio frames and every injected keypress reported. Opus-heavy load
SHALL be measured and reported separately.

#### Scenario: Load test
- **WHEN** the load harness runs 200 G.711 caller-plus-session rooms on a 2 vCPU node for 30 minutes and injects keypresses
- **THEN** no audio frame is dropped
- **AND** every injected keypress is reported exactly once

