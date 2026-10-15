# Fonoster rebuild: architecture specs

Status: **build approved 2026-10-15.** The gateway, both SDKs, the Autopilot engine, call records,
the registry core and the conformance framework are built side by side on `next`; the Go media node
is next, after the media-control amendments from the 2026-10-15 spec review. Decisions made while
building live in each change's `build-log.md`.

Goal: world-class quality next to VAPI, LiveKit and Daily, with the depth spent **below the model**
(telephony, media, recording, data). Parts above the model (turn-taking, LLMs, vendors) stay
swappable behind small contracts.

## Layers

```
Your code (apps, Autopilot, Pipecat bots)
   │  WebSocket session: native flavor or Twilio flavor
VoiceSessionGateway (one per call, runs in the voice worker)
   │  Speech layer (STT, TTS, play, turn-taking) · Audio layer · Control
Media node (Go, behind Routr)  ── rooms (audio mixer), SIP legs, forks; see add-media-node
   │  SIP + RTP
SIP edge (Routr + RTPEngine) ── carriers, WebRTC
```

Cross-cutting: provider registry (STT/TTS/LLM catalog), call record (vCon), workspace webhooks,
conformance framework.

## Changes, in dependency order

| Change | Capability | Depends on |
| --- | --- | --- |
| `add-voice-session-gateway` | `voice-session`, `twilio-media-streams-flavor` | — |
| `add-turn-taking` | `turn-taking` | `voice-session` |
| `add-provider-registry` | `provider-registry` | — (used by the gateway's Speech layer) |
| `add-call-record` | `call-record` | `voice-session` |
| `rework-voice-sdk` | `voice-sdk` | `voice-session` |
| `rework-autopilot` | `autopilot` | `voice-session`, `turn-taking`, `voice-sdk`, `provider-registry` |
| `add-media-node` | `media-node`, `media-control` | `voice-session`, `call-record` |
| `add-workspace-webhooks` | `workspace-webhooks` | `call-record`, `provider-registry` |
| `add-platform` | `control-plane`, `observability`, `deployment`, `regions` | all of the above except `conformance` |
| `add-conformance-framework` | `conformance` | all of the above |

Media node in one line: rooms are audio mixers with a track-based (video-ready) contract; "add a
participant to a room" serves inbound, outbound and transfer (cold/warm in the room, optional SIP
REFER); Routr balances nodes with least-sessions from `X-Session-Count`; rooms stay on one node;
optional TLS + SRTP to the edge; sipgo and livekit/media-sdk are reused as libraries.

Platform in one line: the gateway is its own TypeScript deployable; the apiserver is a stateless
control plane; NATS carries everything internal except audio (gateway audio is RTP); OpenTelemetry
everywhere; Compose and Helm both official; one global control plane with many cells; private
regions ship in v1 and are customer-operated (we only sync config).

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
- **Room**: lives on one media node and mixes audio for its participants (each hears everyone
  but themselves). Participants have **tracks** with a `kind` (`audio` in v1) and a codec.
- **Participant**: a SIP leg, the gateway's session, or a listener (fork).
- **MediaControl**: the contract between the gateway or control plane and the media node.

## Retired by this rebuild

- `voice.proto` (gRPC voice sessions). The SDKs wrap the new session protocol; the old
  `(req, res)` handler signature keeps working.
- Verbs `record`, `setAudioFilters`, `mute`, `unmute` (recording and filters become app policy).
- STT/TTS/audio filters inside the apiserver; the apiserver's ARI and AudioSocket handling.
- Silero VAD inside Autopilot (turn-taking moves into the gateway).

The decision log with rationale lives in each change's `design.md`. The planning doc:
https://claude.ai/code/artifact/529004cd-9fd5-4e62-9406-b7faceac3415
