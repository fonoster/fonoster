# turn-taking

## MODIFIED Requirements

### Requirement: Turn-taking runs in the gateway's Speech layer

The VoiceSessionGateway SHALL run turn-taking for every session that uses the Speech layer, so
that apps receive turn events without implementing voice activity detection or endpointing
themselves.

#### Scenario: A simple speech app gets turn events

- **WHEN** an app connects with the fonoster protocol and uses only the Speech layer
- **AND** the caller says a sentence and then stays silent
- **THEN** the app receives `turn.user_started` when the caller starts speaking
- **AND** receives `turn.ended` with the caller's final `text` after the caller finishes
- **AND** the app never received or processed raw audio

#### Scenario: Audio-only sessions do not require turn-taking

- **WHEN** an app uses only the Audio layer and does not use the Speech layer
- **THEN** the gateway does not emit `turn.*` events to it
