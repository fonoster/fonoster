# Spec Delta

## MODIFIED Requirements

### Requirement: Barge-in stops speech and keeps history honest

When the caller interrupts, Autopilot SHALL stop its speech with `clear` and SHALL store in the
history only the text the caller heard. It SHALL keep reading the interrupted model response to its
end without speaking it, so the vendor's usage report for the request is received.

#### Scenario: Interrupted reply

- **WHEN** Autopilot is speaking reply `r1` and the session sends `turn.user_started`
- **THEN** Autopilot sends `clear`
- **AND WHEN** the session sends `output.interrupted` for `r1` with `heardText` "We open at nine."
- **THEN** the history holds "We open at nine." for that reply, marked as interrupted, and not the full text

#### Scenario: Barge-in disabled

- **WHEN** the agent disallows barge-in and the session sends `turn.user_started` while Autopilot speaks
- **THEN** Autopilot sends no `clear`

#### Scenario: A new turn cancels an in-flight reply

- **WHEN** Autopilot is thinking about turn A and the session sends `turn.ended` for turn B
- **THEN** the generation for turn A is discarded, read to its end for its usage, and nothing from it
  enters the history
- **AND** Autopilot answers turn B with turns A and B in the history as user messages

#### Scenario: An interrupted reply is still metered

- **WHEN** the caller interrupts reply `r1` while the model is still streaming it
- **THEN** no further text from `r1` is spoken or added to the history
- **AND** Autopilot reads the response to its end and reports the vendor's token counts for it
