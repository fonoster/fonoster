## ADDED Requirements

### Requirement: Agent pickers offer the catalog

The agent editor's language model, voice and transcriber pickers SHALL offer only the catalog's
usable providers, models and voices for the workspace (`GetCapabilities`), shown by label. A new
agent SHALL default to offered items. A saved agent whose item is no longer offered SHALL keep it,
shown as unavailable.

#### Scenario: Only usable providers are offered

- **WHEN** the catalog lists `fake` and `deepgram` and the workspace can use only `fake`
- **THEN** the voice, transcriber and language model pickers offer only `fake` items
- **AND** a new agent is created with `fake` models and voice

#### Scenario: A key makes a vendor pickable

- **WHEN** the owner stores a Deepgram key and reopens the agent
- **THEN** the voice and transcriber pickers also offer Deepgram's voices and models

#### Scenario: A saved item that is no longer offered

- **WHEN** an agent uses `deepgram/aura-2-thalia-en` and the workspace's Deepgram key was removed
- **THEN** the voice picker shows it as unavailable and saving keeps it

#### Scenario: Models Autopilot cannot run are not offered

- **WHEN** the catalog has no model for a provider (Google, Anthropic)
- **THEN** the language model picker does not offer that provider
