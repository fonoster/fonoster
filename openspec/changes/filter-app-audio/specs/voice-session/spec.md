# Spec Delta

## MODIFIED Requirements

### Requirement: Audio filters come from app configuration

Filtered audio is for the AI only. The gateway SHALL start the app's configured audio filters when the session starts, for every
protocol, whether or not the app uses the Speech layer. It SHALL apply them to the caller's audio
before that audio reaches the app's stream, speech recognition and turn detection. Call recordings,
answering-machine detection and listen-only sockets SHALL get the caller's unfiltered audio. A
filter that needs a provider credential SHALL receive the one the gateway resolved from the registry
for the session's workspace (provider-registry). Filtering failures MUST degrade to unfiltered audio
and SHALL be reported in the call record, whether they happen when the filter starts or later in the
call.

#### Scenario: Filter configured
- **WHEN** an app's config lists an audio filter
- **THEN** STT and the Turn Detector receive filtered caller audio from the moment speech starts (B18), including the 500 ms kept before it

#### Scenario: A Fonoster app that only streams audio
- **WHEN** a `fonoster` app lists an audio filter and never sends a Speech command
- **THEN** the caller audio frames the app receives are filtered

#### Scenario: A Twilio app
- **WHEN** a `twilio` app lists an audio filter
- **THEN** the caller audio in the `media` events the app receives is filtered

#### Scenario: Recordings and listeners stay unfiltered
- **WHEN** an app that lists an audio filter is recorded and has a listen-only socket
- **THEN** the recording and the listen-only socket carry the caller's unfiltered audio

#### Scenario: Filter unavailable
- **WHEN** the configured filter cannot be created
- **THEN** the call continues with unfiltered audio
- **AND** the call record contains a filter failure event

#### Scenario: Filter fails during the call
- **WHEN** a running filter throws or returns frames of the wrong length
- **THEN** the rest of the call continues with unfiltered audio
- **AND** the call record contains a `filter.failed` event with the filter's name and the reason

#### Scenario: Credential comes from the registry, never from the app
- **WHEN** an app's filter configuration carries a key or a license in its options
- **THEN** the option is rejected and the filter is not built
- **AND** the gateway starts the filter only with the credential it resolved for the workspace
