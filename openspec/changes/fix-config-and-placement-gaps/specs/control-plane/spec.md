## MODIFIED Requirements

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

#### Scenario: Node at its limit skipped
- **WHEN** node A reports it is at its session limit and node B, with more sessions, is below its limit
- **THEN** the call is placed on node B
