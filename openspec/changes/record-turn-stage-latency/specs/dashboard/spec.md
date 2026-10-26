# Spec Delta

## MODIFIED Requirements

### Requirement: The call detail shows how the agent did

The call detail SHALL show, from the record alone, how long the caller waited for each answer (from
the caller's last word to the agent's first audio, per answered turn, with the median), the usage the
call recorded as quantities without prices, and the number of turns per side, the interruptions and
the tools called. When the agent's turn note says where the wait went, the answer's bar SHALL be split
into LLM and Text-to-speech, with the rest of the wait as Other, so the bar always spans the wait. An
agent turn the caller cut off SHALL say when. Export JSON SHALL save
the record's vCon as the API returned it. What the record does not carry SHALL be left out, not
estimated.

#### Scenario: Response time, tools and usage

- **WHEN** the user opens a call where the agent answered 100 ms after the caller stopped, called `get_hours`, and used speech-to-text and LLM tokens
- **THEN** the answer shows first audio 100 ms, Response time shows p50 100 ms, the timeline shows the `get_hours` tool call as ok, and Usage lists the speech-to-text seconds and the LLM tokens with no price

#### Scenario: Where the wait went

- **WHEN** the answer's `autopilot.turn` note has `llmMs` 60 and `ttsMs` 30
- **THEN** Response time splits that answer's 100 ms bar into LLM 60 ms, Text-to-speech 30 ms and Other 10 ms, with a legend
- **AND** stages longer than the wait are scaled down to fit it, and the bar's label names the scaled values
- **AND** an answer whose note has no stage timings keeps a single bar

#### Scenario: An interrupted answer

- **WHEN** the caller cut the agent off
- **THEN** the agent's turn says when it was interrupted and In this call counts one interruption

#### Scenario: Export the record

- **WHEN** the user picks Export JSON
- **THEN** the vCon is saved as `<callRef>.vcon.json`
