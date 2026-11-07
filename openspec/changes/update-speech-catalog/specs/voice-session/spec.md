# Spec Delta

## ADDED Requirements

### Requirement: Speech speed reaches the vendor

An app's `speech.speed` SHALL be sent to the TTS vendor with each request, and a speed of 0 or unset
SHALL be sent as none. Each adapter SHALL send it in the vendor's own form. The API SHALL reject a
speed outside 0.7 to 1.2 with `INVALID_ARGUMENT` naming `speech.speed`.

#### Scenario: ElevenLabs

- **WHEN** an app has speed 1.1 and an ElevenLabs voice on Flash v2.5
- **THEN** each TTS request carries `voice_settings.speed` 1.1

#### Scenario: Deepgram

- **WHEN** an app has speed 1.1 and the voice `deepgram/flux-fernanda-es`
- **THEN** each TTS request carries the query parameter `speed=1.1`

#### Scenario: Out of range

- **WHEN** an app is saved with speed 1.3
- **THEN** the save fails with `INVALID_ARGUMENT` naming `speech.speed`
