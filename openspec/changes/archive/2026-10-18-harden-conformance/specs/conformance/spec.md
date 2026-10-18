## ADDED Requirements

### Requirement: End-to-end caller bot

An end-to-end suite SHALL place real SIP calls through Routr to an Autopilot app using a caller
bot, and MUST run on every nightly build.

#### Scenario: Nightly call

- **WHEN** the nightly build runs
- **THEN** the caller bot completes a scripted conversation with the Autopilot
- **AND** a sealed call record exists for that call

## MODIFIED Requirements

### Requirement: Gateway latency pass bar (T1)

The gateway timing suite SHALL measure the time the gateway itself adds, with provider time
subtracted. At p95 the gateway MUST add at most 50 ms from `speak` text arriving to the first audio
frame sent to the media node, and at most 50 ms from caller audio arriving to it reaching STT. A
`clear` MUST silence the call within 40 ms.

#### Scenario: Text to first audio

- **WHEN** the fake TTS returns audio after a fixed 200 ms delay
- **AND** 200 `speak` commands are timed
- **THEN** the p95 of (first audio frame time − `speak` time − 200 ms) is at most 50 ms

#### Scenario: Caller audio to STT

- **WHEN** the app has started listening and the caller starts speaking
- **AND** 200 calls are timed
- **THEN** the p95 of (first audible frame at the fake STT − first audible caller packet sent by the
  fake media node) is at most 50 ms

#### Scenario: Clear

- **WHEN** audio is playing and the app sends `clear`
- **THEN** the fake media node receives no further output audio later than 40 ms after the `clear`

### Requirement: CI cadence

Fake-based suites SHALL run on every pull request. End-to-end and load suites SHALL run nightly.
A failing suite MUST block the merge of a pull request that affects its contract.

#### Scenario: Pull request touching the gateway

- **WHEN** a pull request changes the gateway
- **THEN** the session protocol, Twilio protocol (fake parts) and SDK suites run before merge
