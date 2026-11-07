# Tasks

## 1. Decide

- [ ] 1.1 Probe each model in design D1 from a production-region host: first audio, English and Spanish, short and long replies, and speed taking effect
- [ ] 1.2 Confirm the ElevenLabs account production uses is paid up

## 2. Catalog

- [ ] 2.1 `accent` on voice entries (registry, store, CLI, `GetCapabilities`)
- [ ] 2.2 Sync command: Deepgram `GET /v2/models` and ElevenLabs premade voices into catalog voice entries, reporting removed voices (unit test on recorded responses)
- [ ] 2.3 Cloud catalog: the four TTS models, their voices, Nova-3 only; the base catalog is unchanged
- [ ] 2.4 Move production's `nova-2-phonecall` configs to Nova-3 and delete the row

## 3. Calls

- [ ] 3.1 `SpeechDefaults.speed`: proto, API validation (0.7 to 1.2), SDK, CLI
- [ ] 3.2 TTS adapters take `model` and `speed`; Deepgram Flux on `/v2/speak`; ElevenLabs `model_id` per request
- [ ] 3.3 Voice IDs not in the catalog, for every TTS model, passed to the vendor as typed
- [ ] 3.4 `tts.characters` carries the TTS model id; new rate card per model (unit test)

## 4. Dashboard

- [ ] 4.1 Voice picker: vendor, model, voices with name filter and chips, voice ID, speed (vitest)
- [ ] 4.2 Transcriber picker: provider, model, language from the model (vitest)
- [ ] 4.3 New agents default to the Flux voices in design D8, falling back to today's (vitest)

## 5. Docs

- [ ] 5.1 Build an agent, providers reference, provider catalog (sync command, new fields), changelog
