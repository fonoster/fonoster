## MODIFIED Requirements

### Requirement: The apiserver is a stateless control plane

The apiserver SHALL run as N interchangeable replicas that hold no per-call state. It SHALL serve
the management gRPC API with the same services and messages as today, Identity,
`GetCapabilities`, call creation and workspace webhook dispatch. It MUST NOT connect to Asterisk
ARI, terminate AudioSocket or carry call audio. A call's status events SHALL travel on the call's
own NATS subject, `calls.<callRef>.events`, published by the components that observe them (the
replica placing the call publishes `TRYING` and placement failures, the media node the room's
`call.progress`, `call.answered` and `room.ended`), so `TrackCall` on any replica follows any
call.

#### Scenario: Any replica serves any request
- **WHEN** a call is created through replica A and its hangup is requested through replica B
- **THEN** replica B finds the call in the session registry and the call ends

#### Scenario: Management API unchanged
- **WHEN** an existing SDK client lists numbers, creates an app and creates a call
- **THEN** every request succeeds with the same request and response messages as before the rebuild

#### Scenario: Losing a replica
- **WHEN** one of three apiserver replicas is killed during active calls
- **THEN** no active call ends and the remaining replicas serve every management request

#### Scenario: TrackCall always ends
- **WHEN** a TrackCall stream is open and its client goes away, a second TrackCall opens for the same call, the call's media node misses 3 heartbeats (or says `node.down`), no node takes the call within 30 s, or no final status comes within the maximum call duration
- **THEN** the replica forgets the first case's stream, serves both streams in the second, and ends the stream with `FAILED` in the others

#### Scenario: Call status survives the placing replica
- **WHEN** the replica that placed a call is killed while the call rings, and `TrackCall` for the call runs on another replica
- **THEN** that `TrackCall` still receives `ANSWER` when the callee answers, and ends when the room ends

### Requirement: Call creation picks the least-loaded media node

When creating an outbound call the control plane SHALL choose, from the session registry, the
media node in the target cell with the fewest active sessions that is not draining and is below
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
- **WHEN** every media node in the cell is draining or at its limit
- **THEN** call creation fails with a capacity error and no INVITE is sent

#### Scenario: Node at its limit skipped
- **WHEN** node A reports it is at its session limit and node B, with more sessions, is below its limit
- **THEN** the call is placed on node B

#### Scenario: Capacity error is synchronous
- **WHEN** a client calls `CreateCall` and no media node is eligible
- **THEN** `CreateCall` fails with `RESOURCE_EXHAUSTED` instead of returning a ref whose `TrackCall` reports `FAILED` later

#### Scenario: A full node sends the call to the next one
- **WHEN** node A's last heartbeat showed room but A refuses `room.create` with `at_capacity`
- **THEN** the call is placed on the next eligible node

#### Scenario: At most three nodes tried
- **WHEN** four eligible nodes each refuse `room.create` with `at_capacity`
- **THEN** `CreateCall` fails with `RESOURCE_EXHAUSTED` after three of them were asked, and the fourth gets no command
