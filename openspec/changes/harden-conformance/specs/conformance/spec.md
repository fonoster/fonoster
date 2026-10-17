## ADDED Requirements

### Requirement: End-to-end caller bot

An end-to-end suite SHALL place real SIP calls through Routr to an Autopilot app using a caller
bot, and MUST run on every nightly build.

#### Scenario: Nightly call

- **WHEN** the nightly build runs
- **THEN** the caller bot completes a scripted conversation with the Autopilot
- **AND** a sealed call record exists for that call

## MODIFIED Requirements

### Requirement: CI cadence

Fake-based suites SHALL run on every pull request. End-to-end and load suites SHALL run nightly.
A failing suite MUST block the merge of a pull request that affects its contract.

#### Scenario: Pull request touching the gateway

- **WHEN** a pull request changes the gateway
- **THEN** the session protocol, Twilio protocol (fake parts) and SDK suites run before merge
