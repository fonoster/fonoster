# Spec Delta

## ADDED Requirements

### Requirement: The Calls page lists the workspace's records

The Calls page SHALL list the workspace's call records newest first, with the parties, when the call
started, its duration, direction and status. It SHALL filter by status and by period through the
records API, load further pages on request, and say when nothing matches.

#### Scenario: Newest first

- **WHEN** the workspace has records from today and yesterday
- **THEN** today's are listed first, each with its parties, start, duration, direction and status

#### Scenario: Filter by status

- **WHEN** the user picks Failed
- **THEN** the records API is asked for `status=failed` and only failed calls are listed

#### Scenario: More than one page

- **WHEN** the API returns a next page token
- **THEN** a Load more action fetches the next page with that token and appends it

### Requirement: The call detail reads as the conversation

The call detail SHALL be titled by the call's parties and SHALL show the direction, start time,
duration, the app or agent that took the call by name, and how the call ended in words. A failed call
SHALL show its failure reason and SIP status. The transcript SHALL list each turn with its side, its
start and its duration.

#### Scenario: A completed call

- **WHEN** the user opens a completed inbound call to the agent Front desk
- **THEN** the title names both parties, the facts name Front desk, and each turn shows who spoke, when and for how long

#### Scenario: A browser test call

- **WHEN** the user opens a call they placed with Talk to agent
- **THEN** the title names them (their email) and the agent, not the media node's internal names

#### Scenario: A failed call

- **WHEN** the user opens an outbound call that failed with `486 Busy Here`
- **THEN** the detail says the line was busy with SIP status 486, and shows no transcript or recording

### Requirement: Recordings play in the page

A recorded call's detail SHALL play the recording in the page and offer to download it as
`<callRef>.wav`. A call without a recording SHALL say so.

#### Scenario: Play and download

- **WHEN** the user opens a recorded call
- **THEN** an audio player plays the recording, and Download saves it as `<callRef>.wav`

#### Scenario: No recording

- **WHEN** the call was not recorded
- **THEN** the detail says there is no recording and offers no player

### Requirement: Unavailable records say why

Opening a record that was erased SHALL say the record was erased, and a record that doesn't exist SHALL
say so. Neither SHALL show a raw API error or keep loading.

#### Scenario: An erased record

- **WHEN** the user opens a call whose record was erased
- **THEN** the page says the record was erased, at once, with no raw error

#### Scenario: An unknown call

- **WHEN** the user opens a call ref the workspace doesn't have
- **THEN** the page says the call record wasn't found
