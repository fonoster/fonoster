# Spec Delta

## MODIFIED Requirements

### Requirement: Conversation events in the call record

Autopilot SHALL add to the call record, per turn, the user text, the reply text, what was heard,
interruptions, tool calls and results, knowledge searches, and timings from turn end to first token
and to first audio. Each tool call SHALL carry its name, outcome, start time, HTTP method and status,
duration, and its parameters and response (or error) as JSON text. Each knowledge search SHALL carry
the query, its start time, the top passages with their documents and scores, the duration, and
whether the reply went without it because it timed out or failed (with a short error). Parameters,
responses and passages SHALL be capped in size without leaving part of a possible card number at the
cut, and a tool's URL and headers SHALL NOT be recorded. Without a call record, the log SHALL hold
only tool names, outcomes, counts and durations, never parameters, responses, errors or queries.

#### Scenario: Complete turn trace

- **WHEN** a scripted call has one normal turn and one interrupted turn
- **THEN** the call record holds both turns with reply text, heard text and timings
- **AND** the interrupted turn is marked as interrupted

#### Scenario: Tool call details

- **WHEN** the model calls an HTTP tool with parameters during a turn
- **THEN** the turn's trace holds the tool's method, status, duration, parameters and response
- **AND** holds neither the tool's URL nor its headers

#### Scenario: Knowledge search details

- **WHEN** the agent's knowledge finds passages for the caller's words
- **THEN** the turn's trace holds the query, the top passages with their documents and scores, and the duration
- **AND** a search the reply did not wait for is recorded as timed out, with no passages
- **AND** a search that failed is recorded as failed, with a short error

#### Scenario: Details are capped

- **WHEN** a tool's parameters or response, or a passage, is longer than its cap
- **THEN** the trace holds it cut at the cap, ending with no partial number
