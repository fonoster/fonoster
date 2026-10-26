# Spec Delta

## MODIFIED Requirements

### Requirement: Conversation events in the call record

Autopilot SHALL add to the call record, per turn, the user text, the reply text, what was heard,
interruptions, tool calls and results, and timings from turn end to first token and to first
audio. For a reply that finished playing, the turn SHALL also say where the wait went: `llmMs`, from
turn end to the first sentence handed to speech, and `ttsMs`, from that sentence to its first audio.
A turn the caller cut off SHALL carry neither, even when an earlier round of it played to the end,
and so SHALL a turn whose first audio was other speech (a tool's start message).

#### Scenario: Complete turn trace

- **WHEN** a scripted call has one normal turn and one interrupted turn
- **THEN** the call record holds both turns with reply text, heard text and timings
- **AND** the interrupted turn is marked as interrupted

#### Scenario: Where the wait went

- **WHEN** the model takes 300 ms to answer and the first audio starts 200 ms after the first sentence is handed to speech, and the reply plays to the end
- **THEN** the turn's note has `llmMs` of about 300 and `ttsMs` of about 200
- **AND** a later reply the caller cuts off has neither

#### Scenario: Speech ahead of the reply

- **WHEN** a tool's start message plays before the reply
- **THEN** the turn's note has neither `llmMs` nor `ttsMs`
