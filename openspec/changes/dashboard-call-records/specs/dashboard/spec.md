# Spec Delta

## ADDED Requirements

### Requirement: The Calls page lists the workspace's records

The Calls page SHALL list the workspace's call records newest first, each with its start, the agent
or app by name, the customer, the workspace's number, the duration and the status in words. It SHALL
filter by period, direction, agent or app, and status through the records API, load further pages on
request, show how many calls are listed, export them as CSV, and say when nothing matches.

#### Scenario: Newest first

- **WHEN** the workspace has records from today and yesterday, and a call that failed busy
- **THEN** today's are listed first, each with its start, agent, customer, Fonoster number, duration and status
- **AND** the busy call's status reads Busy

#### Scenario: Filter by status

- **WHEN** the user picks Failed
- **THEN** the records API is asked for `status=failed` and only failed calls are listed

#### Scenario: More than one page

- **WHEN** the API returns a next page token
- **THEN** a Load more action fetches the next page with that token and appends it
- **AND** the count says more calls exist until the last page is loaded

#### Scenario: Filter by direction and agent

- **WHEN** the user picks Outbound, then all directions and the agent Front desk
- **THEN** the records API is asked for `direction=outbound`, then for `appRef` of Front desk, and only those calls are listed

#### Scenario: Export CSV

- **WHEN** the user picks Export CSV
- **THEN** the listed calls are saved as `calls.csv`, one row per call with its ref, start, direction, agent, parties, duration and status

### Requirement: The call detail reads as the conversation

The call detail SHALL be titled by the customer and the agent or app by name, with the direction,
start, duration, status and the workspace's number. Its transcript SHALL be a timeline of the turns
(side, start, duration), the tools called and how the call ended in words; a failed call SHALL show
its failure reason and SIP status. Turn decisions and notes SHALL be on an Events tab.

#### Scenario: A completed call

- **WHEN** the user opens a completed inbound call to the agent Front desk
- **THEN** the title names the caller and Front desk, and each turn shows who spoke, when and for how long

#### Scenario: A browser test call

- **WHEN** the user opens a call they placed with Talk to agent
- **THEN** the title names them (their email) and the agent, not the media node's internal names

#### Scenario: A failed call

- **WHEN** the user opens an outbound call that failed with `486 Busy Here`
- **THEN** the detail says the line was busy with SIP status 486, and shows no transcript or recording

### Requirement: Recordings play in the page

A recorded call's detail SHALL play the recording in the page, drawn as its waveform, seek where the
user clicks, show the position and length, and offer to download it as `<callRef>.wav`. A call
without a recording SHALL say so.

#### Scenario: Play and download

- **WHEN** the user opens a recorded call
- **THEN** an audio player plays the recording, and Download saves it as `<callRef>.wav`

#### Scenario: No recording

- **WHEN** the call was not recorded
- **THEN** the detail says there is no recording and offers no player

### Requirement: The call detail shows how the agent did

The call detail SHALL show, from the record alone, how long the caller waited for each answer (from
the caller's last word to the agent's first audio, per answered turn, with the median), the usage the
call recorded as quantities without prices, and the number of turns per side, the interruptions and
the tools called. An agent turn the caller cut off SHALL say when. Export JSON SHALL save the record's
vCon as the API returned it. What the record does not carry SHALL be left out, not estimated.

#### Scenario: Response time, tools and usage

- **WHEN** the user opens a call where the agent answered 100 ms after the caller stopped, called `get_hours`, and used speech-to-text and LLM tokens
- **THEN** the answer shows first audio 100 ms, Response time shows p50 100 ms, the timeline shows the `get_hours` tool call as ok, and Usage lists the speech-to-text seconds and the LLM tokens with no price

#### Scenario: An interrupted answer

- **WHEN** the caller cut the agent off
- **THEN** the agent's turn says when it was interrupted and In this call counts one interruption

#### Scenario: Export the record

- **WHEN** the user picks Export JSON
- **THEN** the vCon is saved as `<callRef>.vcon.json`

### Requirement: Unavailable records say why

Opening a record that was erased SHALL say the record was erased, and a record that doesn't exist SHALL
say so. Neither SHALL show a raw API error or keep loading.

#### Scenario: An erased record

- **WHEN** the user opens a call whose record was erased
- **THEN** the page says the record was erased, at once, with no raw error

#### Scenario: An unknown call

- **WHEN** the user opens a call ref the workspace doesn't have
- **THEN** the page says the call record wasn't found
