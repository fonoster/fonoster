## ADDED Requirements

### Requirement: Media node suite

The framework SHALL provide a fake session endpoint (a gRPC `Session.Connect` server that records
`Start`, answers or rejects on cue and asserts events) and a fake controller (a `Roomr`
client), and SHALL run the `kind: media-control` scenario files against the fake media node and
against the Go node. The suite SHALL cover every `Roomr` RPC, every control-stream message,
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

### Requirement: Roomr fakes cover both sides of every Roomr contract

The framework SHALL provide, for the Roomr suite: a gRPC `FakeRoomr` that replaces the NATS role
of `FakeMediaNode`; a fake session endpoint that can answer, reject, stall (never `Answer` or
`Ready`) or be killed on cue; a fake controller driving several fake or real nodes; the fake
registrar, reachable from YAML scenarios; a fake SIP trunk/proxy that records each Request-URI and
its headers and answers `200`, `486`, `407` or nothing on cue; a headless WebRTC peer (pion) with
the mix-minus checker; NATS fault injection (drop the connection, drop messages); and config
overrides that shorten every Roomr timeout and limit so scenarios run in seconds. Scenarios that
test only the retired NATS command path (`one-replica-claims`, `no-gateway-answers`,
`command-id-echoed`, `unknown-command-refused`, `ack-carries-results`) SHALL be removed.

#### Scenario: Stalled app
- **WHEN** a scenario sets the fake session endpoint to stall and the fake trunk answers an outbound call
- **THEN** the scenario can assert the node's ready timeout with a short limit in under 5 seconds

#### Scenario: Retired scenarios gone
- **WHEN** the `media-control` scenario directory is listed
- **THEN** none of the five retired NATS-only scenarios is present
