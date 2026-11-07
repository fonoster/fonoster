# Proposal

## Why

The voice and transcriber pickers don't match how developers choose speech. Today the agent's
language sits in the transcriber row, voices are a short hand-picked Aura-2 list that the language
doesn't filter, there is no model choice, no speed, and no way to use a voice we don't list.

Developers choose a voice by trying vendors and models. The editor should let them do that, with a
short list of current models and all of each model's voices, and nothing more.

## What Changes

- Voice picker: vendor, then model, then that model's voices, with a filter by name. Each voice
  shows its name and small chips (language, gender, accent). Developers can also enter a voice ID,
  and change the speed.
- Transcriber picker: provider, model, then language, with the model's own languages.
- Models (design D1): Deepgram Flux and Aura-2, ElevenLabs v4 Turbo and Flash v2.5, and Deepgram
  Nova-3 for transcription. Nova-2 Phone Call goes, because Nova-3 covers every language Nova-2 does.
- Voices (D2): every voice the vendor offers for a listed model, in the catalog files in the
  repository, written by a sync command from the vendors' voice APIs. For ElevenLabs that means its
  premade voices only.
- Catalog: voices gain `accent`. Every TTS model accepts a voice ID that isn't in the catalog.
- Apps: `speech.speed`, one 0.7 to 1.2 range for every vendor; each adapter sends it the vendor's way.
- Billing: TTS usage is keyed by the TTS model instead of the voice, so each model can have its own
  price. A new rate card prices the four TTS models at vendor cost.

## Not in this change

- Deepgram Flux for transcription (`flux-general-en`, `flux-general-multi`). It brings its own turn
  detection, which touches turn-taking, so it needs its own evaluation.
- A Flux WebSocket adapter. Flux over HTTP gave first audio in 216 ms in one probe; a WebSocket comes
  only if the test shows HTTP falls short.
- Playing voice samples, voice cloning, and listing a customer's own ElevenLabs voices.
- Other settings: stability, similarity, style, seed and output formats.
- More TTS vendors. The catalog shape is meant to take them without changes.
