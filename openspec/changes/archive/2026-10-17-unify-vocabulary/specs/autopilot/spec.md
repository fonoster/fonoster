# autopilot

## RENAMED Requirements

- FROM: `### Requirement: Autopilot is an ordinary session app`
- TO: `### Requirement: Autopilot is an ordinary application`

## MODIFIED Requirements

### Requirement: Autopilot is an ordinary application

Autopilot SHALL run as a hosted `VoiceServer` and SHALL use only public session messages of the
fonoster protocol. It MUST NOT depend on any private interface to the gateway or the media node.

#### Scenario: A call reaches Autopilot like any app

- **WHEN** a number points to an app whose URL is the hosted Autopilot
- **AND** the gateway opens a signed fonoster-protocol session with `session.start`
- **THEN** Autopilot verifies the signature, loads the assistant for that app and speaks the first message with `speak`
- **AND** every message it sends is part of the public session protocol

#### Scenario: Bad signature

- **WHEN** a connection arrives without a valid signature
- **THEN** Autopilot rejects it before loading any assistant
