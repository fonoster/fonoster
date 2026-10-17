## Why

Today a voice application talks to Fonoster through `voice.proto`, a gRPC session the apiserver
dials. The apiserver drives Asterisk over ARI, terminates AudioSocket, and runs TTS, STT and audio
filters itself. Raw audio exists only inside that session (`startStream`), its only format is
"WAV" with no declared sample rate, and nothing speaks WebSocket or the Twilio Media Streams
protocol that most voice-AI frameworks (Pipecat included) already use.

That shape blocks four goals: an apiserver that scales horizontally, speech that is implemented
once and swappable, streams as a first-class product, and apps written in any language. This
change replaces verbs and streams with one contract, the **Session**, served by one component, the
**VoiceSessionGateway**.

## What Changes

- **A new component, the VoiceSessionGateway.** One gateway instance owns each call. It dials the
  app's WebSocket URL, speaks the session protocol to the app, and speaks to the media node with
  "commands down, audio and call events up". It runs in the voice worker, not the apiserver.
- **One session protocol, three layers.**
  - Speech: STT, streamed TTS, `play`, turn events, interruption reports.
  - Audio: raw binary frames, `mark`, `clear`.
  - Control: DTMF, transfer, hold, hangup.
  A client may use any mix of layers.
- **WebSocket only, two flavors.**
  - `native`: JSON text frames for messages, binary frames for audio.
  - `twilio`: exact Twilio Media Streams messages, so Pipecat and existing Twilio bots run unchanged.
- **Apps are URLs.** An app is a WebSocket URL, a flavor and speech defaults. A number points to
  an app. Autopilot is an app whose URL is the hosted Autopilot.
- **Signed connections.** The gateway signs every connection with an HMAC over the URL and a
  timestamp, using a per-app secret.
- **Handoff, listeners and fallback.**
  - Handoff: an app can hand the call to another app with a JSON payload.
  - Listeners: customers can attach listen-only sockets that pick their tracks.
  - Fallback: an unreachable app gets a short retry, then its fallback.
- **Auto-answer.** The gateway answers an inbound call once the app's socket is connected and
  verified. Outbound sessions open at answer.
- **BREAKING: `voice.proto` is retired.** The SDKs wrap the new protocol (see `rework-voice-sdk`).
  The verbs `record`, `setAudioFilters`, `mute` and `unmute` have no session equivalent.
  - Recording becomes app policy.
  - Audio filters become app config, applied by the gateway.
- **BREAKING: speech leaves the apiserver.** STT, TTS, audio filters, ARI and AudioSocket handling
  move out of `mods/apiserver`.

## Capabilities

### New Capabilities

- `voice-session`: the session protocol (native flavor), the gateway's behavior, routing,
  security, handoff, listeners, fallback and versioning.
- `twilio-media-streams-flavor`: the Twilio Media Streams compatible flavor and its hang-up
  endpoint.

### Modified Capabilities

None. `voice.proto` was never captured as an OpenSpec capability; its retirement is recorded here.

## Impact

- **New code:** the gateway (voice worker), session message schemas (JSON Schema, generated types
  for TypeScript and Python), a WebSocket server shared by both flavors.
- **Removed code:** `mods/apiserver/src/voice/**` (ARI, AudioSocket, STT, TTS, filters,
  verb handlers), `voice.proto` and its generated stubs.
- **Changed code:**
  - `mods/voice` and the SDKs (see `rework-voice-sdk`).
  - `mods/autopilot` (see `rework-autopilot`).
  - The Application model gains a WebSocket URL, a flavor, a signing secret, speech defaults,
    audio filters and a fallback.
- **Depends on:** `provider-registry` (catalog ids for speech), `turn-taking` (turn events come
  from the Speech layer).
- **Used by:** `call-record` (every message is appended to the call record), `rework-autopilot`,
  `rework-voice-sdk`, `add-conformance-framework`.
- **Out of scope:** the media node itself (specified in `add-media-node`), the management API (stays gRPC).
