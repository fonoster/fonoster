# control-plane Specification

## Purpose
The apiserver as a stateless control plane and how it places and controls calls on media nodes.
## Requirements
### Requirement: The gateway is its own TypeScript deployable

The VoiceSessionGateway SHALL run as its own deployable, written in TypeScript, scaled
independently of the apiserver and the media node. It SHALL host the STT, TTS and audio-filter
code that the apiserver runs today, and the apiserver MUST NOT run any of it.

#### Scenario: Scaling gateways alone
- **WHEN** an operator raises the gateway replica count from 2 to 4 and leaves the apiserver and media nodes unchanged
- **THEN** new sessions are spread across 4 gateway replicas
- **AND** no apiserver or media node restarts

#### Scenario: No speech in the apiserver
- **WHEN** a call with STT, TTS and an audio filter runs end to end
- **THEN** no STT, TTS or filter request originates from an apiserver process

### Requirement: The apiserver is a stateless control plane

The apiserver SHALL run as N interchangeable replicas that hold no per-call state. It SHALL serve
the management gRPC API with the same services and messages as today, Identity,
`GetCapabilities`, call creation and workspace webhook dispatch. It MUST NOT connect to Asterisk
ARI, terminate AudioSocket or carry call audio.

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

### Requirement: Call creation picks the least-loaded media node

When creating an outbound call the control plane SHALL choose, from the session registry, the
media node in the target cell with the fewest active sessions that is not draining, and SHALL send
it the `media-control` commands that create the room and dial the callee.

#### Scenario: Least-loaded node chosen
- **WHEN** the registry shows node A with 40 sessions, node B with 12 and node C draining with 3
- **THEN** the call is placed on node B

#### Scenario: No capacity
- **WHEN** every media node in the cell is draining or at its limit
- **THEN** call creation fails with a capacity error and no INVITE is sent

### Requirement: Calls leave only by the workspace's own numbers

CreateCall SHALL accept `from` only as an E.164 number that is one of the caller's workspace's
Numbers, because `from` travels as `X-Dod-Number` and picks the trunk the call leaves by. `to` SHALL
be an E.164 number, a SIP user or a `sip:`/`sips:` URI without parameters. A malformed `from` or
`to` SHALL fail with `INVALID_ARGUMENT`; a `from` that is not one of the workspace's Numbers (another
workspace's or none) SHALL fail with `PERMISSION_DENIED`, before any media node is asked.

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
like a missing one. Reading or updating a number or ACL of another workspace SHALL fail with
`PERMISSION_DENIED`, as for every other resource. Routr has no notion of workspaces; the apiserver
enforces this.

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

#### Scenario: One CDR series per call

- **WHEN** three apiserver replicas consume Routr's `routr.call.*` events (queue group
  `apiserver-cdr`) for one SIP-originated call, and the replicas restart mid-call
- **THEN** the call has exactly one CDR series with one ref: a SIP call's ref derives from Routr's
  call id, and an API call's ref is kept per call id in the KV bucket `fonoster_call_refs` (24 h)

#### Scenario: Registry survives a replica restart
- **WHEN** an apiserver replica restarts during 50 active calls
- **THEN** all 50 entries are still present in the session registry with their node and room refs

#### Scenario: No audio on the bus
- **WHEN** a 60-second call runs end to end
- **THEN** no NATS message carries audio frames

