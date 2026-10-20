# Spec Delta

## ADDED Requirements

### Requirement: The workspace has a Usage page

The sidebar SHALL list **Usage** (`/usage`) in every edition, whatever `billing.enabled` and
`costs.display` say. The page SHALL show the workspace's usage for a chosen period from
`Usage/GetUsage`: quantities only, never money.

#### Scenario: Community install

- **WHEN** a user of a self-hosted install with `billing.enabled` false opens Usage
- **THEN** the page shows the workspace's usage for the current month
- **AND** shows no price, cost or balance

#### Scenario: Choosing a period

- **WHEN** the user picks Last month
- **THEN** every figure on the page covers last month only

#### Scenario: No usage yet

- **WHEN** the workspace has no usage in the period
- **THEN** the page says there is no usage for that period instead of showing zeros

### Requirement: Usage shows minutes apart from test minutes

The Usage page SHALL show call minutes, with browser test minutes as a separate figure, and the
minutes of noise cancelling, answering-machine detections and recording minutes.

#### Scenario: Calls and tests

- **WHEN** a month has 120 minutes of calls and 15 minutes of browser tests
- **THEN** the page shows Calls 120 min and Tests 15 min as separate figures

### Requirement: Usage shows AI usage by vendor and key

The Usage page SHALL list AI usage (transcription seconds, speech characters, language-model and
embedding tokens) by provider and model, and SHALL say for each whether it ran on the workspace's own
key ("Your key") or the platform's ("Fonoster key"). Estimated token counts SHALL be marked.

#### Scenario: Own key and platform key

- **WHEN** a month has STT on the workspace's own key and TTS on the platform key
- **THEN** the STT row says Your key and the TTS row says Fonoster key

#### Scenario: Estimated tokens

- **WHEN** a provider's token counts were estimated
- **THEN** that row marks its tokens as estimated
