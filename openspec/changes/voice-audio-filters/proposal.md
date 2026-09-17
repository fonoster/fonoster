## Why

Background voices reach the speech engine and the autopilot reacts to them. A caller's TV, radio,
or the person next to them gets transcribed, the agent answers the television, and the
conversation derails.

Two approaches were tried and rejected on evidence:

- **Deepgram streaming diarization.** Live tests split one speaker into up to six speaker IDs,
  merged a TV into the caller's ID, and in one session collapsed everyone into one. Deepgram
  streams only its v1 diarizer and returns no speaker confidence; the stronger v2 diarizer is
  batch-only.
- **The browser's WebRTC noise suppression**, as a proxy for classic noise suppression. No audible
  improvement on a real call: it targets steady noise, and a television is speech.

What works is filtering the audio **before** it reaches speech-to-text, which is what every
production voice-agent stack does (LiveKit, Pipecat, Retell and Vapi all place a primary-speaker
filter in front of the transcriber). ai-coustics **Quail Voice Focus** keeps the primary speaker
and suppresses competing voices, runs on CPU at 16 kHz with about 30 ms of delay, and has an
official Node SDK with prebuilt glibc binaries that match our `node:22-slim` images.

The filter was measured against real Deepgram transcription on a real call recording — word error
rate, background leakage, latency and CPU per stream — and confirmed to work well, using a
throwaway harness kept outside this change. This change delivers the feature itself: applications
ask for filters, the apiserver runs them.

## What Changes

- **A new verb, `SetAudioFilters`.** A voice application declares the filters it wants for the
  session before answering. `VoiceOutStream.set_audio_filters_request = 20`,
  `VoiceInStream.set_audio_filters_response = 19`. Options travel as a `Struct`; **no secret ever
  crosses the wire**.
- **`@fonoster/voice` gains `voice.setAudioFilters([...])`** and an `aiCoustics()` helper, so apps
  get types instead of bare strings:

  ```ts
  await voice.setAudioFilters([aiCoustics({ enhancementLevel: 0.8 })]);
  await voice.answer();
  ```

- **The apiserver runs one chain per call** at the single point where caller audio forks
  (`transcribeOnConnection`), so both the speech engine and the application's media stream —
  and therefore the autopilot's VAD — receive filtered audio.
- **The autopilot declares filters in its assistant config** (`audioFilters`), which is the same
  block whether it comes from `config/assistant.{yaml,json}` or from an Application's
  `intelligence.config` created with `fonoster applications:create -f app.yaml`. Assistant files
  may now be YAML as well as JSON.
- **`@ai-coustics/aic-sdk` is an optional dependency** and the license key is read from
  `AIC_SDK_LICENSE` in the apiserver process only. Without the SDK or the key, filtering is
  unavailable and every call continues exactly as it does today.

## Impact

- **Affected specs:** `voice-audio-filters` (new).
- **Affected code:** `mods/common` (proto, stream content constants, assistant schema),
  `mods/voice` (verb, `VoiceResponse`, filter helpers), `mods/apiserver` (verb handler, voice
  client, audio fork), `mods/autopilot` (assistant loader, voice wrapper).
- **Behavior when no filters are requested:** byte-identical to today, with no chain allocated.
- **Latency:** about 30 ms added to the audio the agent hears, on sessions that opt in.
- **Licensing:** Fonoster stays MIT. The ai-coustics SDK is proprietary and optional; operators
  bring their own key.
- **Not included:** per-application filter records in the database, dashboard UI, a Krisp filter
  (the registry already accommodates one), worker-pool sizing guidance, and the pre-existing
  duplicate-transcript bug in the Deepgram engine's UtteranceEnd fallback.
