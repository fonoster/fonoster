# Spec Delta

## MODIFIED Requirements

### Requirement: Redacted copies protect personal data

When redaction is enabled for a workspace, sealing SHALL produce a redacted version alongside the
original:

- personal data masked in the transcript and messages
- personal data masked in every string of the turn decisions and app notes, including tool call
  parameters and responses and knowledge searches
- the same spans beeped in the audio

The original SHALL be readable only by roles granted unredacted access. Default reads SHALL return
the redacted version.

#### Scenario: A card number is masked

- **WHEN** redaction is on and a caller speaks a card number during a fixture call
- **THEN** the redacted version's transcript shows the number masked
- **AND** the redacted recording has the matching span beeped
- **AND** the original still contains it

#### Scenario: A card number in a tool call is masked

- **WHEN** an app note records a tool call whose parameters or response, or a knowledge search whose query, holds a card number
- **THEN** the redacted version's app notes show the number masked
- **AND** the original still contains it

#### Scenario: Restricted original

- **WHEN** a user without unredacted access fetches the record
- **THEN** they receive the redacted version
- **AND** a request for the original is refused
