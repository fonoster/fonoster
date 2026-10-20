# Spec Delta

## MODIFIED Requirements

### Requirement: The record contains the call's parties, timing, transcript, messages and turns

A sealed call record SHALL contain:

- the parties
- the start, answer and end times
- the direction
- the transcript per turn and per side, with timings
- every session message in both directions, in order, with timestamps (audio frames excluded)
- the turn decisions with their outcomes
- any provider substitution or deprecation warning
- the call's usage lines (see `usage-metering`)

SIP traces are out of scope for the first release (roomr MN10, owner decision 2026-10-15).

It SHALL NOT contain full log output, LLM prompts or responses, or per-turn audio clips.

#### Scenario: Session messages are captured both ways

- **WHEN** an app sends `speak` and AppBridge answers with `output.started` and `output.done`
- **THEN** the record contains all three messages, in order, with their `id` and timestamps
- **AND** contains no audio frame payloads

#### Scenario: Turn decisions carry outcomes

- **WHEN** AppBridge emits `turn.ended` and the caller resumes speaking within the cut-off window
  after the agent starts
- **THEN** the record holds that turn decision marked as a false cut-off

#### Scenario: A deprecated model used on a call is recorded

- **WHEN** a call uses a catalog id that is deprecated
- **THEN** the record contains a deprecation warning naming that catalog id

#### Scenario: LLM exchanges are excluded

- **WHEN** an Autopilot call makes LLM requests with a system prompt
- **THEN** the record contains the agent's spoken text
- **AND** contains neither the system prompt nor the raw LLM requests and responses

#### Scenario: Usage is sealed with the call

- **WHEN** a call that used STT, TTS and an LLM is sealed
- **THEN** the record and its index entry contain the call's usage lines, one per meter, provider and
  key source
- **AND** the usage lines are covered by the record's signature

## ADDED Requirements

### Requirement: Records of calls that reach no app carry no vendor usage

A minimal record sealed for a call that never reached an app SHALL contain usage lines only for what
the call consumed before it ended, and SHALL contain no `call.seconds` line when the call was never
answered.

#### Scenario: Rejected call

- **WHEN** an inbound call is rejected before it is answered
- **THEN** its minimal record contains no usage lines
