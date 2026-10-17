## MODIFIED Requirements

### Requirement: media-control runs over NATS request and reply

Each media node SHALL serve commands as NATS requests on `media.<nodeId>.commands` and SHALL answer
every command with exactly one JSON reply: `{type: "ack", id, ...}` carrying any results (such as
`roomRef`, `participantRef` or `rtp`), or `{type: "error", id, code, message}`. Outcomes that take
time (dial progress, transfers, room end) SHALL arrive later as events. The node SHALL publish
every event on `media.<nodeId>.events.<roomRef>`, so a gateway subscribes only to its room and the
control plane to `media.*.events.>`. `room.create` MAY carry `callRef`, the API-originated call the
room is for; the node SHALL then also publish the room's `call.progress`, `call.answered` and
`room.ended` events, with `callRef` and `nodeId` added, on `calls.<callRef>.events`. A sender
SHALL treat a command with no reply within 2 seconds as failed.

#### Scenario: Ack carries results
- **WHEN** the control plane sends `room.create` `{id: "c1"}` to `media.node-a.commands`
- **THEN** the reply is `{type: "ack", id: "c1", roomRef: "<new room>"}`

#### Scenario: Events are scoped to the room
- **WHEN** the caller in room `r1` on node `node-a` presses `5`
- **THEN** a `dtmf` event is published on `media.node-a.events.r1`
- **AND** nothing is published on any other room's subject

#### Scenario: Call events on the call's subject
- **WHEN** the control plane sends `room.create` `{id: "c1", callRef: "call-1"}` and then dials the callee, who answers
- **THEN** `call.progress` and `call.answered` are published on `calls.call-1.events` as well as on the room's subject
- **AND** `participant.joined`, `dtmf` and other room events are not

#### Scenario: No reply
- **WHEN** a node does not reply to `hold` within 2 seconds
- **THEN** the gateway treats the command as failed and reports `error` to the app with `relatesTo` set to the command's id

### Requirement: Outbound calls are placed on a node chosen by the control plane

For an outbound call the control plane SHALL choose the node with the fewest active rooms among
non-draining nodes below their room limit in the session registry (NATS JetStream KV), SHALL ask
it to `room.create` and `participant.dial`, and SHALL record the room-to-node mapping in the
registry. The gateway SHALL open the app's session only after `call.answered`.

#### Scenario: Least-loaded node chosen
- **WHEN** the registry lists node A with 30 rooms, node B with 8 and node C draining, and an outbound call is requested
- **THEN** the control plane sends `room.create` and `participant.dial` to node B
- **AND** the registry maps the new room to node B

#### Scenario: Session opens at answer
- **WHEN** the dialed party answers
- **THEN** the node reports `call.answered`
- **AND** only then does the gateway open the app's session

### Requirement: Nodes report liveness

Each node SHALL publish `node.heartbeat` `{nodeId, rooms, maxRooms, draining}` on
`media.<nodeId>.heartbeat` every 2 seconds, where `maxRooms` is its room limit (media-node "Call
and room limits"). A node stopping on purpose SHALL publish `node.down` `{nodeId}` after its last
room ends. A gateway SHALL treat a node as down after 3 missed heartbeats (6 seconds), SHALL end
every session it owns on that node with `session.end` `reason: "error"`, and SHALL seal their
records with `node_error`.

#### Scenario: Heartbeats while alive
- **WHEN** a node is running
- **THEN** it publishes `node.heartbeat` with its room count and `draining` at least every 2 seconds

#### Scenario: Heartbeats report the room limit
- **WHEN** a node with a limit of 1 room holds one room and is sent another `room.create`
- **THEN** the reply is `{type: "error", code: "at_capacity"}`
- **AND** its heartbeat carries `rooms: 1` and `maxRooms: 1`

#### Scenario: Node killed
- **WHEN** a node carrying two calls owned by one gateway is killed
- **THEN** within 7 seconds both apps receive `session.end` with `reason: "error"`
- **AND** both records are sealed with failure `node_error`

#### Scenario: Clean shutdown
- **WHEN** a draining node's last room ends
- **THEN** it publishes `node.down` and gateways stop expecting heartbeats from it
