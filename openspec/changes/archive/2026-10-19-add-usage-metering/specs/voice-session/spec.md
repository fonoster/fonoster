# Spec Delta

## ADDED Requirements

### Requirement: Autopilot reports model usage to the call

AppBridge SHALL accept `usage.report` from an Autopilot agent's session, carrying usage lines for
`llm.tokens.*` and `embedding.tokens` only, and SHALL add them to the call's usage. Like
`record.note`, it is reserved for Fonoster's own apps and SHALL NOT appear in the public protocol
reference or SDK documentation.

#### Scenario: Autopilot reports a turn's tokens

- **WHEN** an Autopilot agent sends `usage.report` with 1,200 `llm.tokens.in` and 340
  `llm.tokens.out` for provider `openai`, model `gpt-4o-mini`, `keySource: platform`
- **THEN** the call's sealed usage includes those quantities for that provider, model and key source
- **AND** no event is sent to the app and nothing is sent to the Roomr node

#### Scenario: Not an Autopilot agent

- **WHEN** an app of type `STREAM` sends `usage.report`
- **THEN** AppBridge answers with `error` `bad_message` and records no usage from it

#### Scenario: Meter outside the allowed set

- **WHEN** an Autopilot agent sends `usage.report` for `call.seconds`
- **THEN** AppBridge answers with `error` `bad_message` and records no usage from it
