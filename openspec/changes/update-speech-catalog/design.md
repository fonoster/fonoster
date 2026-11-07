# Design

## Goals

A tight editor that works the same for every vendor and model, and a catalog in the repository that
says exactly what Cloud offers.

## D1. Models

Recent, high quality generations. One generation back is listed when it earns its place: some voices
are better on it, or it costs less. A model with a shutdown date is not listed.

| Vendor | Model | Per 1,000 characters | Why |
| --- | --- | ---: | --- |
| Deepgram | Flux (`deepgram/flux`) | $0.045 | Latest. 42 languages, 266 voices |
| Deepgram | Aura-2 (`deepgram/aura-2`) | $0.03 | One back: cheaper, no shutdown date, 7 languages, 91 voices, and every voice agents use today |
| ElevenLabs | v4 Turbo (`elevenlabs/eleven_v4_turbo`) | $0.04 | Latest real-time model, 94 languages |
| ElevenLabs | Flash v2.5 (`elevenlabs/eleven_flash_v2_5`) | $0.04 | One back: low latency, and our premade voices are verified on it |

Left out: ElevenLabs Turbo v2 and v2.5 (deprecated), v4 (twice the price, no latency figure),
Deepgram Aura-1 (English only), and ElevenLabs v3 and v3 Conversational. v3 is the strict "one back"
for v4, but in probes from the Dominican Republic (three short Spanish requests each) v3
Conversational took 254 to 419 ms to first audio and v3 529 to 653 ms, against 183 to 201 ms for Flash
v2.5 and 207 to 228 ms for v4 Turbo. Neither v3 model honored speed: one sentence ran 6.24 s at 0.7
and 6.96 s at 1.2 on v3 Conversational, 6.08 s at both on v3. Flash v2.5 stays: fastest, cheapest
tier and speed works (8.73 s at 0.7, 4.55 s at 1.2).

Transcription: Deepgram Nova-3 only. Deepgram's model list gives Nova-3 71 languages and Nova-2 33,
and every Nova-2 language is in Nova-3. `deepgram/nova-2-phonecall` (English only) has three saved
configs in production; they move to Nova-3 and the row is deleted.

Every model passes a test before it is listed: first audio time on a short and a long reply, in
English and Spanish, from a host in the production region. Probes from the Dominican Republic, one
request each: Flux 216 ms, Aura-2 377 ms over HTTP.

Self-hosted installs keep the base catalog as it is today (Aura-2 with five voices, and Nova-3).
Operators add models and voices themselves, with the sync command or the registry CLI. Only Cloud's
catalog file changes.

## D2. Voices

The catalog holds every voice the vendor offers for a listed model, so developers find what suits
them. Counts today: Flux 266, Aura-2 91, ElevenLabs 21 premade.

A sync command reads the vendors' voice APIs and writes the voice entries of a catalog file. A person
reviews the change in a pull request, so the repository stays the source of truth.

| Field | Deepgram (`GET /v2/models`, `tts`) | ElevenLabs (`GET /v2/voices`) |
| --- | --- | --- |
| id | `deepgram/<canonical_name>` | `elevenlabs/<voice_id>` |
| label | `metadata.display_name` | `name`, up to the first ` - ` |
| models | The model its `architecture` names | Both ElevenLabs models |
| language | First of `languages` with a region (`es-MX`), else the first | `verified_languages[0].locale`, else `labels.language` |
| gender | Tag `feminine` → female, `masculine` → male | `labels.gender` |
| accent | `metadata.accent` | `labels.accent` |

For ElevenLabs, only `category: premade` voices are synced. Our ElevenLabs account also holds 31
cloned and generated voices, some made for customers, and those must never be listed.

Fields a vendor doesn't give are left out, and the chip isn't shown. A vendor with no voice API (for
example OpenAI) gets its voices written by hand in the same form.

## D3. The editor

```
┌ Voice ──────────────────────────────────────────────────────────┐
│ Vendor  [ Deepgram         ▾ ]    Model  [ Flux             ▾ ] │
│ [ Filter by name                ]                               │
│   Fernanda   (es-MX) (female) (Mexican)                     ○   │
│   Ernesto    (es-MX) (male)   (Mexican)                     ●   │
│   …                                                             │
│ Or enter a voice ID  [                        ]                 │
│ Speed   0.7× ──────●────── 1.2×        1.0×                     │
└─────────────────────────────────────────────────────────────────┘

┌ Transcriber ────────────────────────────────────────────────────┐
│ Provider [ Deepgram ▾ ]  Model [ Nova 3 ▾ ]  Language [ es-MX ▾ ]│
└─────────────────────────────────────────────────────────────────┘
```

- The filter matches the voice name only. The list isn't narrowed by the agent's language: choosing
  the voice is the developer's call.
- Changing the model keeps the voice if the new model has it, else picks the model's first voice.
- Every model has the voice ID field. A typed voice has no chips.
- Speed is the same 0.7× to 1.2× control for every model, shown as a multiplier of the voice's
  normal pace (`1.1×`). The API value stays a plain number (`1.1`).
- The transcriber's language list is the model's `languages`. The app's `speech.language` keeps
  meaning the transcriber's language.

## D4. Voice IDs that aren't in the catalog

Every TTS model accepts `speech.voice` of `<provider>/<any id>` with `speech.ttsModel` naming that
model. The field is the same for every vendor, with the placeholder "Voice ID", and the ID is passed
to the vendor as typed.

The ID is the developer's responsibility: it isn't validated, and the vendor isn't asked on save. A
wrong ID shows up when the agent speaks, as the vendor's error. A customer's private voice only works
with their own key.

## D5. Speed

One range for every vendor: `SpeechDefaults.speed` from 0.7 to 1.2 (0 means 1.0), the same control
for every model. It is the range all the models that honor speed accept, so 1.1 means about 10%
faster on each of them, with no rescaling. The adapter sends it the vendor's way:

| Model | Sent as |
| --- | --- |
| Flux, Aura-2 | `speed` query parameter |
| ElevenLabs Flash v2.5 | `voice_settings.speed` |
| ElevenLabs v4 Turbo | `voice_settings.speed`, which it ignores today |

Measured on one English sentence: Flux 9.60 s at 0.7, 6.08 s at 1.0, 4.40 s at 1.5; Aura-2 10.12,
5.52 and 4.20 s; Flash v2.5 8.64, 5.48 and 4.74 s at 0.7, 1.0 and 1.2. v4 Turbo accepts any speed,
even 0.6 and 1.3, and the audio stays about 6.1 s. The control still shows on v4 Turbo, so every
vendor looks the same; the providers reference says it has no effect there yet.

## D6. The TTS request

Adapters get `{ text, voice, model, speed }` and map speed to the vendor. The model comes from `speech.ttsModel`, else the voice's
first model. ElevenLabs sends `model_id` from it instead of the provider-wide setting. Deepgram's
voice name already names its model; Flux goes to `/v2/speak`, Aura-2 to `/v1/speak`.

## D7. Billing

`tts.characters` usage today carries the voice id as its model, so the rate card can price only per
vendor. It will carry the TTS model id, and a new rate card prices each model:

| Model | Credits per character |
| --- | ---: |
| `deepgram/flux` | 0.0045 |
| `deepgram/aura-2` | 0.003 |
| `elevenlabs/eleven_v4_turbo` | 0.004 |
| `elevenlabs/eleven_flash_v2_5` | 0.004 |

The card starts when this ships; card 2 starts on 2026-11-10 unchanged.

## D8. Defaults for new agents

New agents start on Flux. The voice follows the language picked when the agent is created, as today:

| Language | Today | New |
| --- | --- | --- |
| en-US | `deepgram/aura-2-thalia-en` | `deepgram/flux-hannah-en` |
| en-GB | `deepgram/aura-2-draco-en` | `deepgram/flux-kit-en` |
| es-419 | `deepgram/aura-2-celeste-es` | `deepgram/flux-alfredo-es` |
| es-MX | `deepgram/aura-2-estrella-es` | `deepgram/flux-fernanda-es` |
| es-ES | `deepgram/aura-2-nestor-es` | `deepgram/flux-aina-es` |
| multi | `deepgram/aura-2-celeste-es` | `deepgram/flux-fernanda-es` |

Saved agents keep their voices. When the Flux voice isn't offered, the default is the language's
voice from "Today", then the first offered voice. Self-hosted installs, whose base catalog has no
Flux, keep today's defaults that way.

## D9. Shape for more vendors

A new TTS vendor is an adapter, catalog entries (written by the sync command, or by hand) and one
rate card line per model. The editor needs no change.

## Risks

- **ElevenLabs billing:** our local ElevenLabs key fails with "failed or incomplete payment". If
  production uses the same account, ElevenLabs voices fail today.
- **List size:** close to 400 voices in the catalog file. The registry and the dashboard must handle
  it without delay.
- **Vendor changes:** a voice the vendor drops stays in our catalog until the next sync. The sync
  reports removed voices so they can be retired with a replacement.
