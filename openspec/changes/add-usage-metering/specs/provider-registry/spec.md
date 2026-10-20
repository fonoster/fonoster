# Spec Delta

## ADDED Requirements

### Requirement: Language models must report usage

The `llm` feature vocabulary SHALL include the hard feature `usage`: the model's vendor reports
token counts for every request, streamed or not. An `llm` model SHALL be `active` only with `usage`,
and `fonoster-registry` SHALL refuse to add or activate one without it.

#### Scenario: Adding a model without usage

- **WHEN** an operator runs `fonoster-registry add-model acme/fast-1 --type llm --features tool-calling`
- **THEN** the command exits non-zero with `llm models must declare the usage feature`
- **AND** nothing is written

#### Scenario: Conformance proves the feature

- **WHEN** the conformance suite runs against every active `llm` model
- **THEN** each model reports usage for a completed streamed reply and for a reply read to its end
  after an interruption

### Requirement: Missing usage leads to retirement

When an active `llm` model records `usage_missing` on a completed request, operators SHALL be alerted
with the catalog id and SHALL deprecate it with the existing `deprecate-model` command until its
vendor reports usage again. Nothing SHALL deprecate it automatically.

#### Scenario: Alert names the model

- **WHEN** a call records `usage_missing` for `groq/llama-x`
- **THEN** an operator alert names `groq/llama-x` and the number of affected requests in the last
  hour
- **AND** the model stays `active` until an operator deprecates it
