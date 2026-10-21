# Fonoster rebuild: architecture specs

Status: **build approved 2026-10-15.** AppBridge, both SDKs, the Autopilot engine, call records,
the registry core and the conformance framework are built side by side on `next`; the Go Roomr node
is next, after the media-control amendments from the 2026-10-15 spec review. Decisions made while
building live in each change's `build-log.md`.

Goal: world-class quality next to VAPI, LiveKit and Daily, with the depth spent **below the model**
(telephony, media, recording, data). Parts above the model (turn-taking, LLMs, vendors) stay
swappable behind small contracts.

## Layers

```
Your code (apps, Autopilot, Pipecat bots)
   │  WebSocket session: native flavor or Twilio flavor
AppBridge (one per call, runs in the voice worker)
   │  Speech layer (STT, TTS, play, turn-taking) · Audio layer · Control
   │  per-call control stream (gRPC, node → AppBridge) + RTP
Roomr node (Go, behind Routr)  ── SIP and media edge: SIP legs, rooms (audio mixer), listeners;
   │  SIP + RTP                    see add-roomr, redesign-roomr
SIP edge (Routr + RTPEngine) ── carriers, WebRTC
```

Cross-cutting: provider registry (STT/TTS/LLM catalog), call record (vCon), workspace webhooks,
conformance framework.

## Changes, in dependency order

| Change | Capability | Depends on |
| --- | --- | --- |
| `add-voice-session-appbridge` | `voice-session`, `twilio-media-streams-flavor` | — |
| `add-turn-taking` | `turn-taking` | `voice-session` |
| `add-provider-registry` | `provider-registry` | — (used by AppBridge's Speech layer) |
| `add-call-record` | `call-record` | `voice-session` |
| `rework-voice-sdk` | `voice-sdk` | `voice-session` |
| `rework-autopilot` | `autopilot` | `voice-session`, `turn-taking`, `voice-sdk`, `provider-registry` |
| `add-roomr` | `roomr`, `media-control` | `voice-session`, `call-record` |
| `add-workspace-webhooks` | `workspace-webhooks` | `call-record`, `provider-registry` |
| `add-platform` | `control-plane`, `observability`, `deployment`, `regions` | all of the above except `conformance` |
| `add-conformance-framework` | `conformance` | all of the above |

Roomr node in one line (redesign-roomr): the SIP and media edge, not an app server. The
apiserver calls its `Roomr` gRPC service (`CreateCall`, `EndCall`, `CreateRoom`, `EndRoom`,
`AddParticipant`, `RemoveParticipant`); each call opens one `Session.Connect` control stream from
the node to AppBridge's Service (port 50071) carrying `Start`, `Answer`, `Ready`, `Reject`,
transfers, hold, DTMF, listeners and `Hangup`, with app audio as RTP beside it; NATS carries only
heartbeats and events. Rooms are audio mixers on one node; Routr balances nodes with
least-sessions from `X-Session-Count`; the node reads one `roomr.yaml` (`-config`); optional SIP
TLS, SDES-SRTP and gRPC TLS; sipgo and livekit/media-sdk are reused as libraries.

Platform in one line: AppBridge is its own TypeScript deployable; the apiserver is a stateless
control plane; NATS carries events, heartbeats and the session registry, call control is gRPC
(AppBridge audio is RTP); OpenTelemetry
everywhere; Compose and Helm both official; one global control plane with many cells; private
regions ship in v1 and are customer-operated (we only sync config).

## Vocabulary (use these names exactly)

- **Session**: one call as seen by an app. It carries audio, emits events and accepts commands.
- **AppBridge** (AppBridge): one per call. Speaks the session protocol to apps over
  WebSocket and serves the Roomr node's per-call control stream (`Session.Connect`).
- **Flavors**: `native` (JSON text frames + binary audio frames) and `twilio` (Twilio Media
  Streams messages). WebSocket only; gRPC is not a session transport.
- **Layers**: Speech (STT, TTS, play, turn events, interruption reports), Audio (raw frames,
  `mark`, `clear`), Control (DTMF, transfer, hold, hangup).
- **App**: a WebSocket URL + flavor + speech defaults. A number points to an app. Autopilot is an
  app whose URL is our hosted Autopilot.
- **Listener**: a listen-only socket attached to a session (`tracks`: inbound | outbound | both).
- **Catalog id**: `<provider>/<model-or-voice>`, e.g. `deepgram/nova-3`, `elevenlabs/rachel`.
- **Turn Detector**: lives in AppBridge; produces an end-of-thought estimate (0–1) and turn
  events. **Pacing policy** turns the estimate into actions.
- **Call record**: one vCon per call, built live, sealed and signed at hangup.
- **Room**: lives on one Roomr node and mixes audio for its participants (each hears everyone
  but themselves). Participants have **tracks** with a `kind` (`audio` in v1) and a codec.
- **Participant**: a SIP leg, AppBridge's session, or a listener (fork).
- **MediaControl**: the contracts with the Roomr node: `Roomr` gRPC (control plane to node) and
  the `Session` control stream (node to AppBridge), plus heartbeats and events on NATS.

## Retired by this rebuild

- `voice.proto` (gRPC voice sessions) and the `(req, res)` handler signature. The rebuild is an
  incompatible release (owner decision 2026-10-15): `@fonoster/voice` is the session SDK.
- Verbs `record`, `setAudioFilters`, `mute`, `unmute` (recording and filters become app policy).
- STT/TTS/audio filters inside the apiserver; the apiserver's ARI and AudioSocket handling;
  Asterisk itself (every app-linked number points at the Roomr nodes).
- The previous Autopilot engine (xstate machine, Silero VAD, gRPC voice server).
- Silero VAD inside Autopilot (turn-taking moves into AppBridge).

The decision log with rationale lives in each change's `design.md`. The planning doc:
https://claude.ai/code/artifact/529004cd-9fd5-4e62-9406-b7faceac3415
