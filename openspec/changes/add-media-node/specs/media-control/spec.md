# media-control

## ADDED Requirements

### Requirement: Commands go down, audio and call events come up

The `media-control` contract SHALL carry commands from the VoiceSessionGateway or the control plane
to a media node, and audio and call events from the node back up. Commands SHALL be: `answer`,
`room.create`, `participant.add`, `participant.dial`, `participant.remove`, `transfer`, `hold`,
`resume`, `dtmf.send`, `listener.attach`, `listener.detach`, `room.end` and `hangup`. Events SHALL
be: `call.incoming`, `call.progress`, `call.answered`, `participant.joined`, `participant.left`,
`dtmf`, `transfer.result` and `room.ended`. Every command SHALL carry an `id`, and every event it
causes SHALL echo that `id`. Unknown command or event types MUST be ignored by the receiver, so the
contract only ever grows.

#### Scenario: Command id echoed
- **WHEN** the gateway sends `hold` `{id: "c7", roomRef: "r1", participantRef: "p-caller"}`
- **THEN** the node's acknowledgement carries `id: "c7"`

#### Scenario: Unknown command ignored
- **WHEN** the gateway sends a command with `type: "room.mute_all"`
- **THEN** the node replies with `unknown_command` and the room is unchanged

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
receive. The node SHALL send each selected track as its own stream, never mixed together, and
SHALL send the listener nothing it did not select. Listeners SHALL NOT be able to send audio into
the room.

#### Scenario: Recording listener gets both sides
- **WHEN** a recording listener attaches selecting the caller's track and the session participant's track
- **THEN** it receives two separate streams, one per track

#### Scenario: Listener cannot speak
- **WHEN** a listener sends audio
- **THEN** the room's participants do not hear it
