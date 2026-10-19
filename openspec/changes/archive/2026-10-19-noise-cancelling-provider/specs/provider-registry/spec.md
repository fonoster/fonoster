# Spec Delta

## ADDED Requirements

### Requirement: Noise cancelling is a provider capability

A provider entry MAY serve the capability `nc` (noise cancelling) next to `stt`, `tts` and
`llm`. The built-in adapter `aicoustics` SHALL serve `nc`. A provider serving `nc` SHALL follow
every rule of this spec: it is managed by the operator utility, it is offered to a workspace under
the same rule as speech providers, and the catalog never holds its key.

#### Scenario: Registering the ai-coustics provider

- **WHEN** an operator runs `fonoster-registry add-provider aicoustics --adapter aicoustics --capabilities nc --credential-ref aicoustics-default`
- **THEN** the provider is stored as `active` with capability `nc` and `credentialRef: aicoustics-default`

#### Scenario: An unknown capability is refused

- **WHEN** an operator runs `add-provider aicoustics --adapter aicoustics --capabilities denoise`
- **THEN** the command exits non-zero naming the unknown capability
- **AND** nothing is written

#### Scenario: The provider is listed with its capability

- **WHEN** provider `aicoustics` is active and offered to workspace W
- **THEN** `GetCapabilities` for W lists `aicoustics` with capability `nc` and `keyless: false`

## MODIFIED Requirements

### Requirement: Each layer resolves the credentials of the providers it calls

Each consumer SHALL resolve credentials only for the provider kinds it calls itself, once, at
session start: the VoiceSessionGateway for speech providers (STT and TTS) and for noise-cancelling
providers (`nc`), and Autopilot for its LLM provider, through the same registry API scoped to the
session's workspace. The credential is
the workspace's own key for that provider if one is stored, otherwise the platform key named by
`credentialRef`. Credentials MUST NOT travel in the session protocol. Workspace keys SHALL be stored as encrypted workspace Secrets and
MUST be write-only.

#### Scenario: A workspace brings its own key

- **WHEN** workspace W stored its own Deepgram key and a session in W uses `deepgram/nova-3`
- **THEN** the gateway calls Deepgram with W's key, not the platform key

#### Scenario: No workspace key falls back to the platform key

- **WHEN** workspace W stored no Deepgram key and the platform credential `deepgram-default` is configured
- **THEN** the gateway calls Deepgram with the platform key

#### Scenario: Autopilot resolves its LLM key

- **WHEN** an Autopilot session in workspace W uses `openai/gpt-4o-mini` and W stored its own OpenAI key
- **THEN** Autopilot resolves W's OpenAI key from the registry and calls OpenAI with it
- **AND** the gateway never resolves or sees an LLM credential

#### Scenario: A workspace key is never returned

- **WHEN** any API method reads workspace W's Secrets
- **THEN** the response contains the Secret's name and metadata but never its value
- **AND** neither logs nor the call record contain the value

#### Scenario: The noise-cancelling filter uses the workspace's key

- **WHEN** workspace W stored its own ai-coustics key and a session in W runs an app whose filters list `aiCoustics`
- **THEN** the gateway starts the filter with W's key, not the platform key

#### Scenario: The noise-cancelling filter falls back to the platform key

- **WHEN** workspace W stored no ai-coustics key and the platform credential `aicoustics-default` is configured
- **THEN** the gateway starts the filter with the platform key

#### Scenario: No credential at all for the filter

- **WHEN** an app's filters list `aiCoustics` and neither a workspace key nor a platform credential exists for `aicoustics`
- **THEN** the call continues with unfiltered audio
- **AND** the call record contains a `filter.failed` event whose reason names the missing provider credential
