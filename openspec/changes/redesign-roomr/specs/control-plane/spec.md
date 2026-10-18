## MODIFIED Requirements

### Requirement: The gateway is its own TypeScript deployable

The VoiceSessionGateway SHALL run as its own deployable, written in TypeScript, scaled
independently of the apiserver and the Roomr node. It SHALL host the STT, TTS and audio-filter
code that the apiserver runs today, and the apiserver MUST NOT run any of it. The gateway SHALL
serve the Roomr node's control stream (`Session.Connect`, media-control) behind one stable session
endpoint (a Kubernetes Service in Helm, a service name in Compose), which the Roomr node is
configured with; the node opens one connection per call, so the endpoint spreads calls across
replicas.

#### Scenario: Scaling gateways alone
- **WHEN** an operator raises the gateway replica count from 2 to 4 and leaves the apiserver and Roomr nodes unchanged
- **THEN** new sessions are spread across 4 gateway replicas
- **AND** no apiserver or Roomr node restarts

#### Scenario: No speech in the apiserver
- **WHEN** a call with STT, TTS and an audio filter runs end to end
- **THEN** no STT, TTS or filter request originates from an apiserver process

#### Scenario: Calls spread through the session endpoint
- **WHEN** 100 inbound calls arrive while 4 gateway replicas sit behind the session endpoint
- **THEN** the Roomr node opens 100 control streams and more than one replica receives them

### Requirement: Call creation picks the least-loaded Roomr node

When creating an outbound call the control plane SHALL choose, from the Roomr node heartbeats
(media-control), an eligible node in the target cell: heartbeat younger than 6 seconds (a node
that stopped heartbeating or said `node.down` is not eligible), `rooms < max_rooms`, in the
call's region. It SHALL score each eligible node as
`1 - rooms / max_rooms` and SHALL call `CreateCall` on the highest-scoring node with the callee,
the carrier proxy and the pass-through headers the proxy routes on (`X-DOD-Number`). When the node
answers `RESOURCE_EXHAUSTED` or `UNAVAILABLE` the control plane SHALL try the next eligible node,
up to 3 nodes in all, and SHALL fail the API request synchronously with a capacity error when none
accepts or none is eligible. It SHALL move to another node only on `RESOURCE_EXHAUSTED` or
`UNAVAILABLE`; on an ambiguous outcome (deadline exceeded, connection lost after sending) it SHALL
retry `CreateCall` on the same node with the same `call_ref` and parameters, and SHALL NOT dial the
call on another node.

#### Scenario: Least-loaded node chosen
- **WHEN** heartbeats show node A with 40 rooms of 200, node B with 12 of 200 and node C whose heartbeats stopped
- **THEN** `CreateCall` is sent to node B

#### Scenario: Node at its limit skipped
- **WHEN** node A reports `rooms` equal to `max_rooms` and node B, with more rooms but a higher limit, is below its limit
- **THEN** the call is placed on node B

#### Scenario: Refusal triggers a retry
- **WHEN** the highest-scoring node answers `RESOURCE_EXHAUSTED`
- **THEN** the control plane calls `CreateCall` on the next node and the API caller sees one successful call

#### Scenario: No capacity
- **WHEN** every Roomr node in the cell has stopped heartbeating or is at its limit
- **THEN** call creation fails with a capacity error before the API request returns and no INVITE is sent

#### Scenario: Timeout retried on the same node
- **WHEN** `CreateCall` on node B times out
- **THEN** the control plane repeats `CreateCall` with the same `call_ref` on node B, never on another node
- **AND** the callee receives one INVITE

### Requirement: NATS carries everything internal except audio

Internal events, capacity reports, the session registry and webhook dispatch SHALL use NATS: media
node heartbeats and call events as published messages (media-control), events on JetStream with
queue groups, the session registry as a JetStream KV bucket written by the control plane (the
Roomr node writes nothing to it and uses core NATS only), and webhook dispatch as a JetStream
consumer. Media commands SHALL NOT travel over NATS: the control plane calls `Roomr` over
gRPC and the gateway speaks the per-call control stream. Call audio MUST NOT travel over NATS.

#### Scenario: Events processed once
- **WHEN** three apiserver replicas consume `call.ended` events through one queue group
- **THEN** each event is processed by exactly one replica
- **AND** exactly one `call.ended` webhook is attempted per subscribed workspace

#### Scenario: Registry survives a replica restart
- **WHEN** an apiserver replica restarts during 50 active calls
- **THEN** all 50 entries are still present in the session registry with their node and room refs

#### Scenario: No commands on the bus
- **WHEN** an outbound call is placed and later hung up through the API
- **THEN** `CreateCall` and `EndCall` reach the node over gRPC and no command message is published on NATS

#### Scenario: No audio on the bus
- **WHEN** a call runs for one minute
- **THEN** no NATS message carries audio samples

### Requirement: The apiserver is a stateless control plane

The apiserver SHALL run as N interchangeable replicas that hold no per-call state. It SHALL serve
the management gRPC API with the same services and messages as today, Identity,
`GetCapabilities`, call creation and workspace webhook dispatch. It MUST NOT connect to Asterisk
ARI, terminate AudioSocket or carry call audio. A call's status events SHALL travel on NATS
subjects keyed by the call, published by the components that observe them: the replica placing
the call publishes `TRYING` and placement failures on `calls.<callRef>.events`, and the Roomr node
publishes the call's events (`call.ringing`, `call.answered`, `call.ended`) on
`roomr.events.<call_ref>` (media-control "Events on NATS are keyed by call with sequence numbers
and metadata"), so `TrackCall` on any replica follows any call.

#### Scenario: Any replica serves any request
- **WHEN** a call is created through replica A and `TrackCall` for it is opened through replica B
- **THEN** replica B streams the call's statuses from `calls.<callRef>.events` and `roomr.events.<call_ref>` until the call ends

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
- **THEN** that `TrackCall` still receives `ANSWER` when the callee answers, and ends when the node publishes `call.ended` on `roomr.events.<call_ref>`

## ADDED Requirements

### Requirement: Outbound calls are registered before they are placed

The control plane SHALL write the call's `placements.<callRef>` entry (`call_ref` → `node_ref`) to
the session registry before it calls `CreateCall`, and SHALL update it when it moves to another node. A sweep SHALL
remove an entry, and close its call record with `FAILED`, when the entry's node is down (no
heartbeat for 6 s, or `node.down`) or the node answers `NOT_FOUND` for the call, so a replica that
crashes between the write and the RPC leaves nothing behind.

#### Scenario: Entry written first
- **WHEN** an outbound call is placed
- **THEN** the registry holds `placements.<callRef>` with the `node_ref` before the node receives `CreateCall`

#### Scenario: Replica crashes mid-call creation
- **WHEN** a replica writes the entry and is killed before `CreateCall` reaches the node
- **THEN** a sweep on another replica removes the entry and the call record ends `FAILED`

### Requirement: NATS outages are best effort

While NATS is unreachable live calls SHALL keep running, and events published during the outage
MAY be lost. The control plane SHALL NOT replay or reconstruct lost events; the existing sweeps
(node down, gateway lost, maximum duration) SHALL close the call records and registry entries
those events would have closed once NATS returns.

#### Scenario: call.ended lost
- **WHEN** a call ends while NATS is unreachable and NATS then returns
- **THEN** a sweep closes the call's record and removes its registry entry
- **AND** no active call was ended by the outage

### Requirement: The gateway drains on SIGTERM

On SIGTERM a gateway replica SHALL fail its readiness probe, so the session endpoint stops sending
it new streams, and SHALL keep its open control streams and app sockets until they end or the
configured maximum wait (default 1 h) passes, then exit. Its `Session` gRPC server SHALL NOT set a
maximum connection age.

#### Scenario: Live sessions survive SIGTERM
- **WHEN** a gateway replica with 5 live sessions receives SIGTERM
- **THEN** its readiness fails, new calls land on other replicas and the 5 sessions run until they end

#### Scenario: Maximum wait reached
- **WHEN** a short maximum wait passes while a draining replica still has a session
- **THEN** the replica ends the session and exits
