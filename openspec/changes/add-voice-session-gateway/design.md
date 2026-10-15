## Context

The current call path:

```
Asterisk ──ARI──► apiserver (VoiceDispatcher) ──gRPC voice.proto──► voice app (SDK server)
    └─AudioSocket──► apiserver (STT, TTS, filters, AMD mapping)
```

Problems with it:

- **Pinned calls.** Every call is tied to the apiserver replica that holds its ARI channel and
  AudioSocket.
- **Speech in the wrong place.** Speech runs in the control plane, so Autopilot cannot measure
  or choose it.
- **Streams are hidden.** Raw audio is reachable only through `startStream` inside a gRPC session.
  There is no WebSocket and no Twilio compatibility.
- **Blocking verbs only.** Every verb is a request/response pair. Only `say` can be cut short,
  via `stopSay`.

Twilio validates the target split with two products ([Media Streams], [ConversationRelay]): an
audio pipe, and a text-in/text-out speech layer. Media Streams is μ-law 8 kHz only and needs REST
for call control. ConversationRelay is a separate product. This change unifies both in one session.

[Media Streams]: https://www.twilio.com/docs/voice/media-streams/websocket-messages
[ConversationRelay]: https://www.twilio.com/docs/voice/conversationrelay/websocket-messages

## Goals / Non-Goals

**Goals:**

- One contract for every app: Autopilot, SDK apps, raw WebSocket bots and Pipecat.
- The apiserver holds no media and no speech, so its replicas are interchangeable.
- Speech is implemented once, on our side, and reached from any language.
- Pipecat and Twilio bots run unchanged.
- Every message is recordable in the call record.

**Non-Goals:**

- Media node internals (SIP, RTP, codecs, DTMF detection, rooms, transfer mechanics). They are
  specified in `add-media-node`.
- A webhook or TwiML-style mode. It is deferred.
- A gRPC session transport.
- Conference, AMD as a verb, and pause/resume recording.

## Decisions

**VS1. Session replaces verbs and streams.**
- What it is: a session comes from an inbound call, an outbound call or a handoff. It carries
  audio, emits events and accepts commands.
- Verbs become SDK convenience methods built from messages.
- Rejected: an async verb redesign with handles per verb. The owner found no benefit over
  `say` plus `stopSay`.
- Rejected: keeping `voice.proto` frozen beside the new protocol. The owner chose retirement,
  because Autopilot users are unaffected and SDK users get a wrapper.

**VS2. Three layers in one protocol.**
- Speech, Audio and Control, mixable per client.
- Rejected: separate products as Twilio does. Mixing layers is the advantage. Autopilot needs
  Speech plus turn events, Pipecat needs Audio plus Control.

**VS3. Speech runs in the gateway, not in clients.**
- Rejected: a WebAssembly speech module embedded in every SDK. WASI has no WebSocket interface,
  so each host language would still need networking glue.
- Client-side speech would also break model retirement and the provider catalog: every customer
  would need vendor keys and SDK upgrades.

**VS4. WebSocket only (native and twilio flavors).**
- Measured per 20 ms PCM16 16 kHz frame (640 bytes), the overheads are similar:

  | Transport | Overhead |
  | --- | --- |
  | WebSocket binary | ~1–2% |
  | gRPC | ~3% |
  | Twilio flavor (base64 inside JSON) | ~2× |

- Latency is equal: both run over TCP and framing adds well under 1 ms.
- WebSocket wins on reach: proxies, CDNs and browsers.
- It also gives one connection per call (isolation) and one server for both flavors.
- Rejected: gRPC bidirectional streaming.

**VS5. Apps are a WebSocket URL, a flavor and speech defaults (G2).**
- Autopilot is an app whose URL is the hosted Autopilot. Outbound calls name an app the same way.
- Rejected: running built-in apps inside the gateway. Autopilot would stop being an ordinary
  client and could not be tested the same way.

**VS6. The gateway dials out.**
- Rejected: apps connecting in. That needs a discovery race and is not how Twilio and Pipecat
  work.

**VS7. Signed connection request (G3).**
- The header carries an HMAC-SHA256 of the URL and a timestamp, made with a per-app signing
  secret.
- Rejected: a secret in the URL, which leaks into logs.
- Rejected: mutual TLS by default, which is too much setup.

**VS8. Handoff with data (G4).**
- The gateway closes the old socket, opens the target app's, and puts the payload in
  `session.start.handoff`.

**VS9. Listen-only sockets (G5).**
- `tracks` is `inbound` (default), `outbound` or `both`. With `both`, the sides arrive as
  separate tagged frames and are never mixed, as in Twilio and Telnyx.
- Native binary frames sent by the gateway begin with one byte holding a track id. `session.start`
  lists the tracks (`id`, `side`, `kind`, `codec`), and the listener options select track ids.
- Why a track id and not a side: the room contract is track-based (`add-media-node`, MN1), so a
  future video track is just another id. Rejected: a side byte, which would need a new frame
  format for video.

**VS9b. Transfer keeps the caller in the room by default (MN2).**
- `transfer.mode` is `cold` (default), `warm` or `refer`. Cold and warm dial the new party into the
  caller's room, so recording and the call record stay complete. Warm keeps the app's session until
  `transfer.complete`. `refer` asks the media node to step out with SIP REFER to save capacity.
- Rejected: REFER as the default (the earlier tentative choice), because with rooms staying costs
  little and stepping out loses recording and visibility. Rejected: room only, because some
  deployments want the capacity back.

**VS10. Unreachable app: retry about 2–3 s with ringing, then fall back (G6).**
- The fallback is either a fallback app URL, or a spoken message followed by hangup.
- Rejected: failing fast, because short blips would drop callers.

**VS11. App drops mid-call: hang up.**
- Rejected: reconnect windows, which need session state to survive.

**VS12. Auto-answer on verified connect (S2).**
- The caller never waits on app code. Rejecting calls is done by routing rules.

**VS13. Outbound sessions open at answer (M2).**
- Call progress goes to the API caller and the call record.

**VS14. One output queue (M4).**
- Agent audio frames, `speak` and `play` share one queue.
- New items queue by default. `preempt: true` stops what is playing and goes first.
- `clear` empties the whole queue.
- `mark` returns when reached, or with `cleared: true` when dropped. These are Twilio's semantics.

**VS15. Interruption report.**
- `output.interrupted` carries `heardText` and `heardMs`, so clients can keep their history
  honest. This mirrors ConversationRelay's `utteranceUntilInterrupt`.

**VS16. Turn events come from the gateway (G1).**
- The raw end-of-thought estimate is opt-in through `subscribe` (M1). Specified in `turn-taking`.

**VS17. Provider failure becomes an `error` event, with no automatic switching (P6).**

**VS18. Audio filters are app configuration.**
- The gateway applies them to caller audio before STT and turn detection. This replaces the
  `setAudioFilters` verb.

**VS19. Additive-only versioning.**
- `session.start.protocol` is `fonoster.session.v1`.
- Clients and the gateway ignore unknown message types and unknown fields.
- A breaking change would need a new protocol name.

**VS20. Twilio flavor scope.**
- It uses exact Media Streams messages and μ-law 8 kHz.
- Closing the socket hangs up.
- A compatible endpoint, `POST /2010-04-01/Accounts/{accountSid}/Calls/{callSid}.json` with
  `Status=completed`, lets Pipecat's `auto_hang_up` work after setting `base_url`.
- There is no transfer and no TwiML.

**VS21. No platform "thinking" signal; apps play their own filler.**
- The protocol has no `agent.state` or similar message. An app that wants comfort noise or a
  filler sound while it prepares a reply plays it itself, with `play` or Audio-layer frames, and
  stops it when it speaks (`preempt: true` on the reply, or `clear`).
- Rejected: an explicit `agent.state` message with the gateway playing configured filler (one more
  message and a config surface for something apps can already do), and the gateway inferring
  "thinking" from the gap between `turn.ended` and the first `speak` (it can't tell thinking from
  deliberate silence).

## Risks / Trade-offs

- **Retiring `voice.proto` breaks raw gRPC users.** This affects apps that call it without the SDK.
  Mitigation: release notes and a major SDK version.
- **TCP head-of-line blocking on lossy client links.** Mitigation: apps normally run in data
  centers, close to the gateway. Timing is measured by the conformance budgets (gateway overhead
  of 50 ms or less at p95; `clear` silences within 40 ms).
- **One gateway per call is a single point of failure for that call.** If it dies, the call ends.
  The call record is still sealed from what was appended (see `call-record`).
- **The Twilio flavor caps audio at 8 kHz.** That is accepted for compatibility; the native flavor
  offers better formats.
- **Pipecat users have no transfer on the Twilio flavor.** It is a known gap until a native-flavor
  Pipecat integration exists.

## Open Questions

1. **Error codes (proposed starter set):**
   - `bad_message`: unparseable, or missing required fields
   - `unknown_command`
   - `read_only`: a listener sent a command
   - `not_supported_by_flavor`
   - `provider_unavailable`
   - `provider_timeout`
   - `invalid_catalog_id`
   - `feature_not_supported`: e.g. the voice doesn't fit the model
   - `transfer_failed`
   - `queue_full`
   - `play_fetch_failed`
   - `internal`

   Fatal or not is defined per code.
2. **Playback queue cap.** The maximum queued audio, in seconds or bytes, before `queue_full`.
   Proposed: 120 s of audio.
3. **Hang-up endpoint authentication.** Which credentials Basic auth maps to: the workspace
   access key and an API secret, or a per-app token.
4. **Keepalive.** WebSocket ping interval and the idle timeout before a silent socket counts as
   dropped. Proposed: ping every 10 s, dropped after 30 s.
5. **Signature header name and format.** The exact canonical string, and the clock-skew window.
   Proposed: `X-Fonoster-Signature`, ±5 min.
6. **Handoff limits.** The maximum payload size, and loop protection for repeated handoffs.
7. **Listener limits.** The maximum listeners per call, and how a listener is attached (API call
   or app config).
8. **Which audio formats the native flavor offers.** The menu decided earlier: μ-law 8 kHz, PCM16
   at 8, 16 and 24 kHz, and Opus. Still to settle: Opus framing over WebSocket.
