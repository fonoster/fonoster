## ADDED Requirements

### Requirement: The dev stack offers fake providers next to the real ones

The dev container SHALL add the fake provider to the catalog and leave every real provider as the
bundle configures it: no dev config may point a real provider's name at a fake. The dev API server
SHALL have no platform credentials, so a workspace is offered the fake provider plus the vendors it
stored keys for, and a new agent works with no vendor key.

#### Scenario: A fresh dev container needs no keys

- **WHEN** a fresh dev container runs `npm run dev`, the owner creates an agent and calls it
- **THEN** the agent was created with the fake models and voice
- **AND** the caller hears the agent through the fake STT, TTS and LLM

#### Scenario: A vendor key takes effect on the next call

- **WHEN** the owner stores a Deepgram key in the dashboard and switches the agent's voice and transcriber to Deepgram ones
- **THEN** the next call uses Deepgram, with no config edit or restart
