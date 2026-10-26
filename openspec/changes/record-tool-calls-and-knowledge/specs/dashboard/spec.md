# Spec Delta

## MODIFIED Requirements

### Requirement: The call detail shows how the agent did

The call detail SHALL show, from the record alone, how long the caller waited for each answer (from
the caller's last word to the agent's first audio, per answered turn, with the median), the usage the
call recorded as quantities without prices, and the number of turns per side, the interruptions and
the tools called. Each tool call SHALL show its method, status and latency when the record has them,
with its parameters and response one click away; each knowledge search SHALL show the query, the
source and the top match, or that it failed. Tool calls and searches SHALL be placed at the time they
started when the record has it. An agent turn the caller cut off SHALL say when. Export JSON SHALL save the
record's vCon as the API returned it. What the record does not carry SHALL be left out, not
estimated.

#### Scenario: Response time, tools and usage

- **WHEN** the user opens a call where the agent answered 100 ms after the caller stopped, called `get_hours`, and used speech-to-text and LLM tokens
- **THEN** the answer shows first audio 100 ms, Response time shows p50 100 ms, the timeline shows the `get_hours` tool call as ok, and Usage lists the speech-to-text seconds and the LLM tokens with no price

#### Scenario: Tool calls and knowledge searches

- **WHEN** the user opens a call where the agent searched its knowledge and called `get_hours` with a card number among the parameters
- **THEN** the timeline shows Searched knowledge with the query, the source, the time and the top match
- **AND** the tool call shows its method, status and latency, and its parameters and response when expanded, with the card number masked

#### Scenario: An interrupted answer

- **WHEN** the caller cut the agent off
- **THEN** the agent's turn says when it was interrupted and In this call counts one interruption

#### Scenario: Export the record

- **WHEN** the user picks Export JSON
- **THEN** the vCon is saved as `<callRef>.vcon.json`
