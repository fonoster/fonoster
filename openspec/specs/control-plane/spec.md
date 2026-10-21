# control-plane Specification

## Purpose
The apiserver as a stateless control plane and how it places and controls calls on Roomr nodes.

## Requirements

### Requirement: AppBridge is its own TypeScript deployable

AppBridge SHALL run as its own deployable, written in TypeScript, scaled
independently of the apiserver and the Roomr node. It SHALL host the STT, TTS and audio-filter
code that the apiserver runs today, and the apiserver MUST NOT run any of it.

#### Scenario: Scaling AppBridge replicas alone
- **WHEN** an operator raises AppBridge replica count from 2 to 4 and leaves the apiserver and Roomr nodes unchanged
- **THEN** new sessions are spread across 4 AppBridge replicas
- **AND** no apiserver or Roomr node restarts

#### Scenario: No speech in the apiserver
- **WHEN** a call with STT, TTS and an audio filter runs end to end
- **THEN** no STT, TTS or filter request originates from an apiserver process

### Requirement: The apiserver is a stateless control plane

The apiserver SHALL run as N interchangeable replicas that hold no per-call state. It SHALL serve
the management gRPC API with the same services and messages as today, Identity,
`GetCapabilities`, call creation and workspace webhook dispatch. It MUST NOT connect to Asterisk
ARI, terminate AudioSocket or carry call audio. A call's status events SHALL travel on the call's
own NATS subject, `calls.<callRef>.events`, published by the components that observe them (the
replica placing the call publishes `TRYING` and placement failures, the Roomr node the room's
`call.progress`, `call.answered` and `room.ended`), so `TrackCall` on any replica follows any
call.

#### Scenario: Any replica serves any request
- **WHEN** a call is created through replica A and `TrackCall` for it is opened through replica B
- **THEN** replica B streams the call's statuses from `calls.<callRef>.events` until the call ends

#### Scenario: Management API unchanged
- **WHEN** an existing SDK client lists numbers, creates an app and creates a call
- **THEN** every request succeeds with the same request and response messages as before the rebuild

#### Scenario: Losing a replica
- **WHEN** one of three apiserver replicas is killed during active calls
- **THEN** no active call ends and the remaining replicas serve every management request

#### Scenario: TrackCall always ends
- **WHEN** a TrackCall stream is open and its client goes away, a second TrackCall opens for the same call, the call's Roomr node misses 3 heartbeats (or says `node.down`), no node takes the call within 30 s, or no final status comes within the maximum call duration
- **THEN** the replica forgets the first case's stream, serves both streams in the second, and ends the stream with `FAILED` in the others

#### Scenario: Call status survives the placing replica
- **WHEN** the replica that placed a call is killed while the call rings, and `TrackCall` for the call runs on another replica
- **THEN** that `TrackCall` still receives `ANSWER` when the callee answers, and ends when the room ends

### Requirement: Call creation picks the least-loaded Roomr node

When creating an outbound call the control plane SHALL choose, from the session registry, the
Roomr node in the target cell with the fewest active sessions that is not draining and is below
the session limit its heartbeat reports, and SHALL send it the `media-control` commands that
create the room and dial the callee. When the chosen node refuses `room.create` because it is
full or draining, or does not reply, the control plane SHALL try the next eligible node, at most
3 nodes per call. `CreateCall` SHALL return only once a node has accepted the call's room; when no
node is eligible or every node tried refuses, `CreateCall` SHALL fail at once with gRPC
`RESOURCE_EXHAUSTED`, and the call SHALL not appear as created.

#### Scenario: Least-loaded node chosen
- **WHEN** the registry shows node A with 40 sessions, node B with 12 and node C draining with 3
- **THEN** the call is placed on node B

#### Scenario: No capacity
- **WHEN** every Roomr node in the cell is draining or at its limit
- **THEN** call creation fails with a capacity error and no INVITE is sent

#### Scenario: Node at its limit skipped
- **WHEN** node A reports it is at its session limit and node B, with more sessions, is below its limit
- **THEN** the call is placed on node B

#### Scenario: Capacity error is synchronous
- **WHEN** a client calls `CreateCall` and no Roomr node is eligible
- **THEN** `CreateCall` fails with `RESOURCE_EXHAUSTED` instead of returning a ref whose `TrackCall` reports `FAILED` later

#### Scenario: A full node sends the call to the next one
- **WHEN** node A's last heartbeat showed room but A refuses `room.create` with `at_capacity`
- **THEN** the call is placed on the next eligible node

#### Scenario: At most three nodes tried
- **WHEN** four eligible nodes each refuse `room.create` with `at_capacity`
- **THEN** `CreateCall` fails with `RESOURCE_EXHAUSTED` after three of them were asked, and the fourth gets no command

### Requirement: Calls leave only by the workspace's own numbers

CreateCall SHALL accept `from` only as an E.164 number that is one of the caller's workspace's
Numbers, because `from` travels as `X-Dod-Number` and picks the trunk the call leaves by. `to` SHALL
be an E.164 number, a SIP user or a `sip:`/`sips:` URI without parameters. A malformed `from` or
`to` SHALL fail with `INVALID_ARGUMENT`; a `from` that is not one of the workspace's Numbers (another
workspace's or none) SHALL fail with `PERMISSION_DENIED`, before any Roomr node is asked.

#### Scenario: Another workspace's number
- **WHEN** workspace A calls CreateCall with `from` set to a Number of workspace B
- **THEN** the call fails with `PERMISSION_DENIED` and no room is created

#### Scenario: Own number
- **WHEN** workspace A calls CreateCall with `from` set to one of its Numbers
- **THEN** the call is placed with that number as `X-Dod-Number`

#### Scenario: Header injection in a party
- **WHEN** `from` or `to` contains CR or LF
- **THEN** the call fails with `INVALID_ARGUMENT`

### Requirement: SIP resources reference only their own workspace

Creating or updating an agent, trunk, number or domain SHALL check that every resource it references
(`domainRef`, `credentialsRef`, `accessControlListRef`, `inboundCredentialsRef`,
`outboundCredentialsRef`, `trunkRef`, each egress policy's `numberRef`) belongs to the caller's
workspace. A reference to another workspace's resource SHALL fail with `INVALID_ARGUMENT`, reported
like a missing one. Reading, updating or deleting a number or ACL of another workspace SHALL fail
with `NOT_FOUND`, as for every other resource (management-api). Routr has no notion of workspaces;
the apiserver enforces this.

#### Scenario: Trunk with another workspace's credentials
- **WHEN** workspace A creates a trunk whose `outboundCredentialsRef` names workspace B's credentials
- **THEN** the request fails with `INVALID_ARGUMENT` and Routr is not asked to create it

#### Scenario: Agent in another workspace's domain
- **WHEN** workspace A creates or updates an agent with `domainRef` naming workspace B's domain
- **THEN** the request fails with `INVALID_ARGUMENT`

### Requirement: NATS carries everything internal except audio

Internal commands, events, the session registry and webhook dispatch SHALL use NATS:
`media-control` as request and reply, events on JetStream with queue groups, the session registry
as a JetStream KV bucket, and webhook dispatch as a JetStream consumer. Call audio MUST NOT travel
over NATS.

#### Scenario: Events processed once
- **WHEN** three apiserver replicas consume `call.ended` events through one queue group
- **THEN** each event is processed by exactly one replica
- **AND** exactly one `call.ended` webhook is attempted per subscribed workspace

#### Scenario: Registry survives a replica restart
- **WHEN** an apiserver replica restarts during 50 active calls
- **THEN** all 50 entries are still present in the session registry with their node and room refs

#### Scenario: No audio on the bus
- **WHEN** a 60-second call runs end to end
- **THEN** no NATS message carries audio frames
