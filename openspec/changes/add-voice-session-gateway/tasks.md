> Build deferred: do not start until the owner approves the build.

## 1. Conformance assets

- [ ] 1.1 Write JSON Schemas for every `native` message (lifecycle, speech, audio, control, subscribe, error) and generate TypeScript and Python types from them
- [ ] 1.2 Write language-neutral scenario files for every scenario in `voice-session` and `twilio-media-streams-flavor`
- [ ] 1.3 Build a scripted fake app (drives the gateway) and a fake media node (supplies recorded caller audio, records control commands)
- [ ] 1.4 Build fake STT/TTS providers with deterministic output and injectable delay and failure
- [ ] 1.5 Add a stopwatch harness for the timing budgets: 50 ms or less added by the gateway (p95), `clear` silent within 40 ms
- [ ] 1.6 Add a golden test that runs an unmodified Pipecat bot (`TwilioFrameSerializer`) against the `twilio` flavor
- [ ] 1.7 Resolve the design's Open Questions (error codes, queue cap, keepalive, signature format, hang-up auth, limits) and update the specs

## 2. Implementation

- [ ] 2.1 WebSocket client side of the gateway: dial out, sign the request, retry about 2–3 s, apply the fallback
- [ ] 2.2 Session lifecycle: `session.start`, auto-answer, outbound-at-answer, `hangup`, socket close, `session.end` reasons
- [ ] 2.3 Envelope handling: id echo, ignore unknown types and fields, `error` events
- [ ] 2.4 Speech layer: streamed `speak`, `play`, per-item voice and language, `listen.update`, `subscribe`
- [ ] 2.5 Output queue: agent audio, speak and play in one queue; `preempt`, `clear`, `mark`, `output.*` events with `heardText` and `heardMs`
- [ ] 2.6 Audio layer: format conversion for the format menu, 20 ms caller frames, real-time playout
- [ ] 2.7 Control: `dtmf`, `dtmf.send`, `transfer` (cold, warm, refer), `transfer.complete`, `hold`, `resume` through the `media-control` contract
- [ ] 2.8 Handoff and listen-only sockets (tracks, side byte, `read_only`)
- [ ] 2.9 App-configured audio filters before STT and turn detection
- [ ] 2.10 Append every message to the call record
- [ ] 2.11 `twilio` flavor: message mapping, base64 μ-law, mark/clear semantics, compatible Calls hang-up endpoint
- [ ] 2.12 Application model: WebSocket URL, flavor, signing secret, speech defaults, filters, fallback

## 3. Migration and docs

- [ ] 3.1 Remove `voice.proto`, its generated stubs and `mods/apiserver/src/voice/**`
- [ ] 3.2 Migration guide: raw gRPC voice apps, removed verbs (`record`, `setAudioFilters`, `mute`, `unmute`)
- [ ] 3.3 Docs: session protocol reference (both flavors), Pipecat guide (`base_url`, socket close)
- [ ] 3.4 Release notes marking the BREAKING changes
