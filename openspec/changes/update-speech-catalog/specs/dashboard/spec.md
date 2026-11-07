# Spec Delta

## ADDED Requirements

### Requirement: The voice picker is vendor, model, voice

The agent editor SHALL pick a voice in three steps: a vendor, one of its TTS models, then one of
that model's voices. The voice list SHALL show each voice's label with its language, gender and
accent as chips when the catalog has them, and SHALL offer a filter that matches the label. The list
SHALL NOT be narrowed by the agent's language.

#### Scenario: Filtering by name

- **WHEN** the developer picks Deepgram, then Flux, and types `fer`
- **THEN** the list shows Fernanda with the chips `es-MX`, `female` and `Mexican`
- **AND** voices whose label doesn't contain `fer` are hidden

#### Scenario: Changing the model

- **WHEN** the agent uses an ElevenLabs premade voice on v4 Turbo and the developer picks Flash v2.5
- **THEN** the same voice stays selected

### Requirement: Developers can enter a voice ID

The voice picker SHALL offer a voice ID field for every TTS model, with the same placeholder for
every vendor. A saved voice ID SHALL show without chips.

#### Scenario: A Deepgram voice ID

- **WHEN** the developer picks Deepgram Flux and enters `flux-kit-en`
- **THEN** the agent saves voice `deepgram/flux-kit-en` with TTS model `deepgram/flux`

### Requirement: One speed control for every model

The voice picker SHALL offer the same speed control, from 0.7× to 1.2×, for every TTS model, and
SHALL show speed as a multiplier (`1.1×`).

#### Scenario: Switching vendors keeps the speed

- **WHEN** the agent has speed 1.1 on Flux and the developer picks ElevenLabs Flash v2.5
- **THEN** the speed control still ranges from 0.7× to 1.2× and shows 1.1×

### Requirement: The transcriber picker is provider, model, language

The agent editor SHALL pick the transcriber as a provider, one of its STT models, then a language
from that model's languages, in that order.

#### Scenario: Languages come from the model

- **WHEN** the developer picks Deepgram, then Nova 3
- **THEN** the language list holds Nova 3's languages from the catalog
