# Spec Delta

## MODIFIED Requirements

### Requirement: Agent pickers offer the catalog

The agent editor's language model, voice and transcriber pickers SHALL offer the catalog's
providers, models and voices (`GetCapabilities`), shown by label. A new agent SHALL default to
offered items, and to a keyless provider's items when the catalog has one, since those work with no
key. A saved agent whose item is no longer offered SHALL keep it, shown as unavailable. Opening a
saved agent SHALL show every saved field as it was saved.

#### Scenario: A new agent prefers keyless providers

- **WHEN** the catalog lists `fake` and `deepgram`
- **THEN** the voice, transcriber and language model pickers offer both
- **AND** a new agent is created with `fake` models and voice

#### Scenario: A saved item that is no longer offered

- **WHEN** an agent uses `deepgram/aura-2-thalia-en` and Deepgram was removed from the catalog
- **THEN** the voice picker shows it as unavailable and saving keeps it

#### Scenario: Models Autopilot cannot run are not offered

- **WHEN** the catalog has no model for a provider (Google, Anthropic)
- **THEN** the language model picker does not offer that provider

#### Scenario: A saved agent opens with its configuration

- **WHEN** the user opens an agent saved with a system prompt, first message, language model, transcriber and voice
- **THEN** the editor shows each field with its saved value, decoded from the API's `Struct` configs
