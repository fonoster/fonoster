## ADDED Requirements

### Requirement: Roomr node suite

The framework SHALL provide a fake session endpoint (a gRPC `Session.Connect` server that records
`Start`, answers or rejects on cue and asserts events) and a fake controller (a `Roomr` client),
and SHALL run the `kind: media-control` scenario files against the fake Roomr node and the Go
node. The suite SHALL cover every `Roomr` RPC, every control-stream message, the heartbeat and
event subjects, registration templates, the room header, mix-minus, the health drain and the
capacity refusal.

#### Scenario: Node tested alone
- **WHEN** the Roomr node suite runs
- **THEN** the Go node talks only to the caller bot, the fake registrar, the fake session endpoint, the fake controller and NATS
- **AND** no AppBridge, apiserver or Routr process is started

#### Scenario: One scenario set for both nodes
- **WHEN** the suite runs against the fake node and the Go node
- **THEN** both load the same `media-control` scenario files from `mods/conformance` and both pass

#### Scenario: Capacity path exercised
- **WHEN** the fake controller places a call while the node reports `rooms` equal to `max_rooms`
- **THEN** the scenario asserts `RESOURCE_EXHAUSTED`, that no INVITE reached the caller bot, and that the controller retried another node

### Requirement: The Roomr load bar is re-run on the control stream

The 200-room load bar SHALL be re-run with the control stream in place and reported as before,
with an Opus run reported separately; the load generator SHALL read the node's heartbeats.

#### Scenario: Load report
- **WHEN** the load harness runs 200 rooms on 2 vCPU against a node using the control stream
- **THEN** the report gives the same measures as before, plus a separate Opus run, with room counts read from heartbeats

### Requirement: Roomr fakes cover both sides of every Roomr contract

The framework SHALL provide, for the Roomr suite: a gRPC `FakeRoomr` replacing `FakeNatsRoomr`'s
NATS role; a fake session endpoint that answers, rejects, stalls or is killed on cue; a fake
controller driving several nodes; the fake registrar, usable from YAML scenarios; a fake SIP
trunk that records Request-URIs and headers and answers on cue; NATS fault injection; config
overrides that shorten Roomr's timeouts and limits. Scenarios that test only the retired NATS
command path SHALL be removed.

#### Scenario: Stalled app
- **WHEN** a scenario sets the fake session endpoint to stall and the fake trunk answers an outbound call
- **THEN** the scenario can assert the node's ready timeout with a short limit in under 5 seconds

#### Scenario: Retired scenarios gone
- **WHEN** the `media-control` scenario directory is listed
- **THEN** none of the five retired NATS-only scenarios (`one-replica-claims`, `no-appbridge-answers`, `command-id-echoed`, `unknown-command-refused`, `ack-carries-results`) is present

#### Scenario: Fake trunk on cue
- **WHEN** a scenario cues the fake SIP trunk to answer `200`, `486`, `407` or nothing
- **THEN** the trunk answers that way and the scenario can assert each Request-URI and its headers

#### Scenario: NATS faults
- **WHEN** a scenario drops the node's NATS connection or its messages
- **THEN** the node keeps its calls and the scenario can assert the events that were lost
