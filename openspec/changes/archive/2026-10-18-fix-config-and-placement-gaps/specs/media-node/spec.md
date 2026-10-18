## MODIFIED Requirements

### Requirement: Call and room limits

The node SHALL end any call that exceeds the maximum duration, 4 hours by default and lowerable
per app, and SHALL refuse to add an eleventh participant to a room by default. It SHALL hold at
most `maxRooms` rooms at once, 200 by default (the capacity bar): beyond it, `room.create` SHALL
be refused with `at_capacity` and an INVITE with 503, and the node SHALL report itself full to
Routr. All three limits SHALL be configurable per deployment.

#### Scenario: Maximum duration
- **WHEN** an app's maximum duration is 10 minutes and a call reaches 10 minutes
- **THEN** the call ends and the app receives `session.end` with `reason: "timeout"`

#### Scenario: Room full
- **WHEN** a room has 10 participants and another is added
- **THEN** the request fails with `room_full` and the room is unchanged

#### Scenario: Node full
- **WHEN** a node with `maxRooms: 2` holds two rooms and gets `room.create`
- **THEN** the reply is an error with code `at_capacity` and no room is created
- **AND** after one of the rooms ends, the next `room.create` succeeds
