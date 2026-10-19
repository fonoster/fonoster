## MODIFIED Requirements

### Requirement: Implementations ship fake provider adapters

Every implementation that uses STT, TTS or LLM providers (the gateway, Autopilot) SHALL include a
`fake` adapter per capability that speaks the fake provider protocol documented in
`mods/conformance/PROVIDERS.md`: TTS as HTTP `POST /v1/synthesize`, STT as a WebSocket at
`/v1/listen`, and LLM as OpenAI-compatible `POST /v1/chat/completions`. The `fake` adapter SHALL
be a built-in adapter like any vendor's, and a fake provider SHALL be an ordinary catalog provider:
the registry, the API server, the services and the dashboard MUST NOT treat it differently from
other providers, and services MUST NOT have a test-mode switch. The fake provider's catalog entries
SHALL live in `mods/conformance/fakes.catalog.yaml`, which test and development stacks add to their
catalog. The production catalog MUST NOT list a fake provider.

#### Scenario: A rewrite uses the same fakes

- **WHEN** the gateway is reimplemented in another language
- **THEN** its `fake` adapters reach the same fake providers over the network
- **AND** the session protocol suite runs with no change to the fakes

#### Scenario: Fakes are not available in production

- **WHEN** the bundle's test suite reads `ops/bundle/config/catalog.yaml`
- **THEN** no provider in it uses the `fake` adapter

#### Scenario: A stack adds the fakes like any catalog

- **WHEN** the API server starts with `catalog.files` listing `mods/conformance/fakes.catalog.yaml`
- **THEN** the registry has provider `fake` with its models and voice, and they are offered like any provider's
