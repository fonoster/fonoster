# Spec Delta

## ADDED Requirements

### Requirement: Voices carry an accent

A voice entry SHALL accept an optional `accent`, which the dashboard shows as a chip.

#### Scenario: Adding a voice with an accent

- **WHEN** an operator runs `fonoster-registry add-voice deepgram/flux-fernanda-es --models deepgram/flux --language es-MX --gender female --accent Mexican`
- **THEN** `show deepgram/flux-fernanda-es` prints accent `Mexican`

### Requirement: TTS models accept voices not in the catalog

Every TTS model SHALL accept any voice id under its provider that isn't in the catalog. The API
SHALL NOT validate the id or ask the vendor about it, and calls SHALL send it to the vendor as given.

#### Scenario: A voice ID

- **WHEN** an app is saved with voice `elevenlabs/AbC123` and TTS model `elevenlabs/eleven_v4_turbo`
- **THEN** the app is saved without a request to the vendor
- **AND** each TTS request of its calls names voice `AbC123`

### Requirement: Voices are synced from the vendors

`fonoster-registry sync-voices <provider> --file <catalog file>` SHALL write the voice entries for
the provider's listed models from the vendor's voice API, keep other entries as they are, and print
the voices it added and those the vendor no longer offers. For ElevenLabs it SHALL write premade
voices only.

#### Scenario: Private voices are never written

- **WHEN** the ElevenLabs account holds premade, cloned and generated voices
- **THEN** only the premade voices are written
