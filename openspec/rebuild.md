# Fonoster rebuild: architecture specs

Status: **architecture in progress, build deferred.** A domain is "architecture done" when its
OpenSpec change is approved and its conformance suite is specified. Building starts only when the
owner says so.

Goal: world-class quality next to VAPI, LiveKit and Daily, with the depth spent **below the model**
(telephony, media, recording, data). Parts above the model (turn-taking, LLMs, vendors) stay
swappable behind small contracts.

## Layers

```
Your code (apps, Autopilot, Pipecat bots)
   │  WebSocket session: native flavor or Twilio flavor
VoiceSessionGateway (one per call, runs in the voice worker)
   │  Speech layer (STT, TTS, play, turn-taking) · Audio layer · Control
Media node (Go, behind Routr)  ── parked, specified later
   │  SIP + RTP
SIP edge (Routr + RTPEngine) ── carriers, WebRTC
```

Cross-cutting: provider registry (STT/TTS/LLM catalog), call record (vCon), conformance framework.

## Changes, in dependency order

| Change | Capability | Depends on |
| --- | --- | --- |
| `add-voice-session-gateway` | `voice-session`, `twilio-media-streams-flavor` | — |
| `add-turn-taking` | `turn-taking` | `voice-session` |
| `add-provider-registry` | `provider-registry` | — (used by the gateway's Speech layer) |
| `add-call-record` | `call-record` | `voice-session` |
| `rework-voice-sdk` | `voice-sdk` | `voice-session` |
| `rework-autopilot` | `autopilot` | `voice-session`, `turn-taking`, `voice-sdk`, `provider-registry` |
| `add-conformance-framework` | `conformance` | all of the above |

Not yet specified: the media node (Go), the control plane, deployment and regions, observability.

## Vocabulary (use these names exactly)

- **Session**: one call as seen by an app. It carries audio, emits events and accepts commands.
- **VoiceSessionGateway** (the gateway): one per call. Speaks the session protocol to apps over
  WebSocket and the MediaControl contract to the media node.
- **Flavors**: `native` (JSON text frames + binary audio frames) and `twilio` (Twilio Media
  Streams messages). WebSocket only; gRPC is not a session transport.
- **Layers**: Speech (STT, TTS, play, turn events, interruption reports), Audio (raw frames,
  `mark`, `clear`), Control (DTMF, transfer, hold, hangup).
- **App**: a WebSocket URL + flavor + speech defaults. A number points to an app. Autopilot is an
  app whose URL is our hosted Autopilot.
- **Listener**: a listen-only socket attached to a session (`tracks`: inbound | outbound | both).
- **Catalog id**: `<provider>/<model-or-voice>`, e.g. `deepgram/nova-3`, `elevenlabs/rachel`.
- **Turn Detector**: lives in the gateway; produces an end-of-thought estimate (0–1) and turn
  events. **Pacing policy** turns the estimate into actions.
- **Call record**: one vCon per call, built live, sealed and signed at hangup.

## Retired by this rebuild

- `voice.proto` (gRPC voice sessions). The SDKs wrap the new session protocol; the old
  `(req, res)` handler signature keeps working.
- Verbs `record`, `setAudioFilters`, `mute`, `unmute` (recording and filters become app policy).
- STT/TTS/audio filters inside the apiserver; the apiserver's ARI and AudioSocket handling.
- Silero VAD inside Autopilot (turn-taking moves into the gateway).

The decision log with rationale lives in each change's `design.md`. The planning doc:
https://claude.ai/code/artifact/529004cd-9fd5-4e62-9406-b7faceac3415
