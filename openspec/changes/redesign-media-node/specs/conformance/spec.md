## ADDED Requirements

### Requirement: Media node suite

The framework SHALL provide a fake session endpoint (a gRPC `Session.Connect` server that records
`Start`, answers or rejects on cue and asserts events) and a fake controller (a `MediaControl`
client), and SHALL run the `kind: media-control` scenario files against the fake media node and
against the Go node. The suite SHALL cover every `MediaControl` RPC, every control-stream message,
the heartbeat and event subjects, registration templates against the fake registrar, the room
header with and without a token, mix-minus across SIP, RTP and WebRTC participants, passthrough,
and the capacity refusal and retry. The 200-room load bar SHALL be re-run with the control stream
in place and reported as before, with an Opus run reported separately.

#### Scenario: Node tested alone
- **WHEN** the media node suite runs
- **THEN** the Go node talks only to the caller bot, the fake registrar, the fake session endpoint, the fake controller and NATS
- **AND** no gateway, apiserver or Routr process is started

#### Scenario: One scenario set for both nodes
- **WHEN** the suite runs against the fake node and the Go node
- **THEN** both load the same `media-control` scenario files from `mods/conformance` and both pass

#### Scenario: Capacity path exercised
- **WHEN** the fake controller places a call while the node reports `rooms` equal to `max_rooms`
- **THEN** the scenario asserts `RESOURCE_EXHAUSTED`, that no INVITE reached the caller bot, and that the controller retried another node
