# conformance

## RENAMED Requirements

- FROM: `### Requirement: Twilio flavor suite runs an unmodified Pipecat bot`
- TO: `### Requirement: Twilio protocol suite runs an unmodified Pipecat bot`

## MODIFIED Requirements

### Requirement: Twilio protocol suite runs an unmodified Pipecat bot

The Twilio protocol suite SHALL run an unmodified Pipecat bot using its Twilio serializer against
the gateway, and MUST cover audio in both directions, barge-in through `clear`, caller DTMF,
hangup by closing the socket, and hangup through Pipecat's `auto_hang_up` with `base_url` pointing
at Fonoster.

#### Scenario: Pipecat hangs up through the compatible endpoint

- **WHEN** the Pipecat bot ends its pipeline with `auto_hang_up` enabled and `base_url` set to Fonoster
- **THEN** the gateway receives the hang-up request and ends the call
- **AND** the call record shows `session.end` with `reason: app_hangup`

### Requirement: CI cadence

Fake-based suites SHALL run on every pull request. Load suites SHALL run nightly.
A failing suite MUST block the merge of a pull request that affects its contract.

#### Scenario: Pull request touching the gateway

- **WHEN** a pull request changes the gateway
- **THEN** the session protocol, Twilio protocol (fake parts) and SDK suites run before merge
