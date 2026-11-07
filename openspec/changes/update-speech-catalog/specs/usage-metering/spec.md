# Spec Delta

## ADDED Requirements

### Requirement: TTS usage names the TTS model

`tts.characters` usage SHALL carry the TTS model's catalog id as its model, not the voice's.

#### Scenario: A Flux voice

- **WHEN** an agent speaks 120 characters with voice `deepgram/flux-fernanda-es` on a platform key
- **THEN** the usage line is `tts.characters`, provider `deepgram`, model `deepgram/flux`, quantity 120
