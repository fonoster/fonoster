## MODIFIED Requirements

### Requirement: The gateway is its own TypeScript deployable

The VoiceSessionGateway SHALL run as its own deployable, written in TypeScript, scaled
independently of the apiserver and the media node. It SHALL host the STT, TTS and audio-filter
code that the apiserver runs today, and the apiserver MUST NOT run any of it. The gateway SHALL
serve the media node's control stream (`Session.Connect`, media-control) behind one stable session
endpoint (a Kubernetes Service in Helm, a service name in Compose), which the media node is
configured with; the node opens one connection per call, so the endpoint spreads calls across
replicas.

#### Scenario: Scaling gateways alone
- **WHEN** an operator raises the gateway replica count from 2 to 4 and leaves the apiserver and media nodes unchanged
- **THEN** new sessions are spread across 4 gateway replicas
- **AND** no apiserver or media node restarts

#### Scenario: No speech in the apiserver
- **WHEN** a call with STT, TTS and an audio filter runs end to end
- **THEN** no STT, TTS or filter request originates from an apiserver process

#### Scenario: Calls spread through the session endpoint
- **WHEN** 100 inbound calls arrive while 4 gateway replicas sit behind the session endpoint
- **THEN** the media node opens 100 control streams and more than one replica receives them

### Requirement: Call creation picks the least-loaded media node

When creating an outbound call the control plane SHALL choose, from the media node heartbeats
(media-control), an eligible node in the target cell: heartbeat younger than 6 seconds, not
draining, `rooms < max_rooms`, in the call's region. It SHALL score each eligible node as
`1 - rooms / max_rooms` and SHALL call `CreateCall` on the highest-scoring node with the callee,
the carrier proxy and the pass-through headers the proxy routes on (`X-DOD-Number`). When the node
answers `RESOURCE_EXHAUSTED` or `UNAVAILABLE` the control plane SHALL try the next eligible node,
up to 3 nodes in all, and SHALL fail the API request synchronously with a capacity error when none
accepts or none is eligible.

#### Scenario: Least-loaded node chosen
- **WHEN** heartbeats show node A with 40 rooms of 200, node B with 12 of 200 and node C draining with 3
- **THEN** `CreateCall` is sent to node B

#### Scenario: Node at its limit skipped
- **WHEN** node A reports `rooms` equal to `max_rooms` and node B, with more rooms but a higher limit, is below its limit
- **THEN** the call is placed on node B

#### Scenario: Refusal triggers a retry
- **WHEN** the highest-scoring node answers `RESOURCE_EXHAUSTED`
- **THEN** the control plane calls `CreateCall` on the next node and the API caller sees one successful call

#### Scenario: No capacity
- **WHEN** every media node in the cell is draining or at its limit
- **THEN** call creation fails with a capacity error before the API request returns and no INVITE is sent

### Requirement: NATS carries everything internal except audio

Internal events, capacity reports, the session registry and webhook dispatch SHALL use NATS: media
node heartbeats and call events as published messages (media-control), events on JetStream with
queue groups, the session registry as a JetStream KV bucket, and webhook dispatch as a JetStream
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
the call publishes `TRYING` and placement failures on `calls.<callRef>.events`, and the media node
publishes the call's events (`call.ringing`, `call.answered`, `call.ended`) on
`roomr.events.<call_ref>` (media-control "Events on NATS are keyed by call with sequence numbers
and labels"), so `TrackCall` on any replica follows any call.

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
- **WHEN** a TrackCall stream is open and its client goes away, a second TrackCall opens for the same call, the call's media node misses 3 heartbeats (or says `node.down`), no node takes the call within 30 s, or no final status comes within the maximum call duration
- **THEN** the replica forgets the first case's stream, serves both streams in the second, and ends the stream with `FAILED` in the others

#### Scenario: Call status survives the placing replica
- **WHEN** the replica that placed a call is killed while the call rings, and `TrackCall` for the call runs on another replica
- **THEN** that `TrackCall` still receives `ANSWER` when the callee answers, and ends when the node publishes `call.ended` on `roomr.events.<call_ref>`
