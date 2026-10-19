## ADDED Requirements

### Requirement: A provider may name its endpoints

A provider entry MAY name the URL of each capability it serves (`endpoints.tts`, `endpoints.stt`,
`endpoints.llm`). An endpoint SHALL be an `http`, `https`, `ws` or `wss` URL without user
information, and MUST NOT hold a credential. A service that calls the provider SHALL use, in
order: its own config's endpoint for that provider, the catalog's endpoint, the adapter's default.

#### Scenario: A provider is reached at its catalog endpoint

- **WHEN** provider `fake` names `endpoints.llm: http://fakes:7003` and Autopilot's config has no endpoint for `fake`
- **THEN** an assistant using `fake/llm` calls `http://fakes:7003`

#### Scenario: Service config wins over the catalog

- **WHEN** provider `ollama` names `endpoints.llm: http://ollama:11434` and Autopilot's config sets `endpoints.ollama: http://gpu-1:11434`
- **THEN** Autopilot calls `http://gpu-1:11434`

#### Scenario: An endpoint with a credential is refused

- **WHEN** an operator applies a provider with `endpoints.tts: https://user:pass@tts.example.com`
- **THEN** the command exits non-zero and nothing is written

### Requirement: A provider without a credential reference needs no key

A provider entry MAY omit `credentialRef`. Such a provider (a local model server, the fakes) is
keyless: services SHALL call it without a key, and it SHALL be usable by every workspace.

#### Scenario: A keyless provider is called without a key

- **WHEN** provider `fake` has no `credentialRef` and an assistant uses `fake/llm`
- **THEN** Autopilot calls the fake LLM with no key and resolves no credential

### Requirement: Catalog entries may carry a display label

Providers, models and voices MAY carry a `label`, a human-readable name ("Aura 2 Thalia", "Fake
transcriber"). Labels SHALL be returned with the catalog, and the dashboard SHALL show an entry's
label when it has one and its catalog id otherwise.

#### Scenario: A labeled voice

- **WHEN** voice `deepgram/aura-2-thalia-en` has label `Aura 2 Thalia`
- **THEN** `GetCapabilities` returns the label and the dashboard's voice picker shows `Aura 2 Thalia`

### Requirement: Services reach catalog providers they do not configure

The gateway SHALL be able to use any active catalog provider whose adapter ships in the running
version, also when its own config does not list it: a keyless provider with no key, any other
with the workspace's own key. Its config remains the place for platform keys and per-provider
overrides.

#### Scenario: A workspace key reaches a provider missing from the gateway config

- **WHEN** the catalog has provider `elevenlabs`, the gateway config does not list it, and workspace W stored its own ElevenLabs key
- **THEN** a session in W using an ElevenLabs voice calls ElevenLabs with W's key

#### Scenario: A keyless catalog provider needs no gateway config

- **WHEN** the catalog has keyless provider `fake` with `endpoints.tts` and the gateway config does not list it
- **THEN** a session using a `fake/` voice synthesizes through the fake TTS

## MODIFIED Requirements

### Requirement: Only usable providers are offered

`GetCapabilities` and the dashboard SHALL list a provider, model or voice only when it is `active`
or `deprecated`, its adapter exists in the running version, and a credential is available to the
asking workspace or the provider is keyless. Provider items SHALL say whether they are keyless, and
the dashboard MUST NOT ask for a key for a keyless provider. Retired items MUST NOT be offered.

#### Scenario: A provider without a credential is hidden

- **WHEN** provider `elevenlabs` is active, no platform credential `elevenlabs-default` is configured, and workspace W has no ElevenLabs key
- **THEN** `GetCapabilities` for W does not list `elevenlabs` or its voices

#### Scenario: Bringing a key makes the provider appear

- **WHEN** workspace W then stores its own ElevenLabs key
- **THEN** `GetCapabilities` for W lists `elevenlabs` and its active voices

#### Scenario: A keyless provider is listed without a key

- **WHEN** provider `fake` has no `credentialRef` and the platform's credentials do not include one for it
- **THEN** `GetCapabilities` lists `fake` with `keyless: true` and its models and voices
- **AND** the dashboard's vendor keys screen does not offer `fake`
