# Spec Delta

## ADDED Requirements

### Requirement: A workspace key that cannot be read never falls back

A session SHALL use the platform key for a provider only when the workspace key lookup answered that
the workspace has no key for it. A lookup that fails or takes longer than 3 seconds SHALL NOT fall
back to the platform key; the provider is unavailable to that session with the reason
`key_unavailable`.

#### Scenario: The key store fails before an inbound call is answered

- **WHEN** a call arrives for an app whose voice is `deepgram/aura-2-thalia-en` and the lookup of the
  workspace's Deepgram key fails
- **THEN** AppBridge rejects the call with SIP 503 before answering
- **AND** records `call.failed` with `reason: key_unavailable` naming `deepgram`, and sends the
  `call.failed` webhook
- **AND** Deepgram is never called with the platform key for that call

#### Scenario: A slow key store is the same as a failed one

- **WHEN** the lookup of the workspace's Deepgram key answers after 4 seconds
- **THEN** the call is rejected with `reason: key_unavailable`, as when the lookup fails

#### Scenario: No key stored still uses the platform key

- **WHEN** the lookup answers that workspace W has no Deepgram key and `deepgram-default` is configured
- **THEN** the call proceeds on the platform key

#### Scenario: A provider first needed mid-call

- **WHEN** the lookup of the workspace's ElevenLabs key failed, the app's own voice is Deepgram, and
  the app sends `speak` with voice `elevenlabs/rachel`
- **THEN** AppBridge answers with `error` code `key_unavailable`, `fatal: false`, related to that
  command
- **AND** nothing is sent to ElevenLabs

#### Scenario: Noise cancelling with an unreadable key

- **WHEN** an app's filters list `aiCoustics` and the lookup of the workspace's ai-coustics key fails
- **THEN** the call is rejected with `reason: key_unavailable` naming `aicoustics`

#### Scenario: Autopilot cannot read the workspace's LLM key

- **WHEN** an Autopilot session's lookup of the workspace's OpenAI key fails
- **THEN** Autopilot speaks the agent's system error message and hangs up
- **AND** the call record holds a note with reason `key_unavailable`
- **AND** OpenAI is never called with the platform key for that session

#### Scenario: An eval cannot read the workspace's key

- **WHEN** an eval runs and the lookup of the workspace's key for the agent's provider fails
- **THEN** the eval ends with an error naming `key_unavailable` and calls no model
