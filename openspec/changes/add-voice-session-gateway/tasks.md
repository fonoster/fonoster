> Build approved by the owner on 2026-10-15. Decisions and open items: see build-log.md.

## 1. Conformance assets

- [x] 1.1 Write JSON Schemas for every `native` message (lifecycle, speech, audio, control, subscribe, error) and generate TypeScript and Python types from them
- [ ] 1.2 Write language-neutral scenario files for every scenario in `voice-session` and `twilio-media-streams-flavor` (partial: mods/conformance/scenarios has 39 voice-session and 7 twilio files for 55 + 13 spec scenarios; the rest are covered only by mods/gateway/test/integration.test.ts)
- [x] 1.3 Build a scripted fake app (drives the gateway) and a fake media node (supplies recorded caller audio, records control commands)
- [x] 1.4 Build fake STT/TTS providers with deterministic output and injectable delay and failure
      (1.3 and 1.4 live in `mods/conformance`, built under `add-conformance-framework`)
- [x] 1.5 Add a stopwatch harness for the timing budgets: 50 ms or less added by the gateway (p95), `clear` silent within 40 ms
- [x] 1.6 Add a golden test that runs an unmodified Pipecat bot (`TwilioFrameSerializer`) against the `twilio` flavor
- [x] 1.7 Resolve the design's Open Questions (error codes, queue cap, keepalive, signature format, hang-up auth, limits) and update the specs

## 2. Implementation

- [x] 2.1 WebSocket client side of the gateway: dial out, sign the request, retry about 2–3 s, apply the fallback
- [x] 2.2 Session lifecycle: `session.start`, auto-answer, outbound-at-answer, `hangup`, socket close, `session.end` reasons
- [x] 2.3 Envelope handling: id echo, ignore unknown types and fields, `error` events
- [x] 2.4 Speech layer: streamed `speak`, `play`, per-item voice and language, `listen.update`, `subscribe`
- [x] 2.5 Output queue: agent audio, speak and play in one queue; `preempt`, `clear`, `mark`, `output.*` events with `heardText` and `heardMs`
- [x] 2.6 Audio layer: format conversion for the format menu, 20 ms caller frames, real-time playout (menu pcm16 8/16/24 kHz and pcmu 8 kHz; SIP Opus/PCMA/G.722 transcoded by the media node; AO-B4)
- [x] 2.7 Control: `dtmf`, `dtmf.send`, `transfer` (cold, warm, refer), `transfer.complete`, `hold`, `resume` through the `media-control` contract
- [x] 2.8 Handoff and listen-only sockets (tracks, side byte, `read_only`)
- [x] 2.9 App-configured audio filters before STT and turn detection
- [x] 2.10 Append every message to the call record
- [x] 2.11 `twilio` flavor: message mapping, base64 μ-law, mark/clear semantics, compatible Calls hang-up endpoint
- [x] 2.12 Application model: WebSocket URL, flavor, signing secret, speech defaults, filters, fallback

## 3. Migration and docs

- [x] 3.1 Remove `voice.proto`, its generated stubs and `mods/apiserver/src/voice/**` (CB-B1, CB-B4; the speech config schemas stay at their paths for app validation)
- [x] 3.2 Migration guide: raw gRPC voice apps, removed verbs (`record`, `setAudioFilters`, `mute`, `unmute`) (`docs/migrating-to-sessions.md`, now a "what changed" note)
- [x] 3.3 Docs: session protocol reference (both flavors), Pipecat guide (`base_url`, socket close)
- [x] 3.4 Release notes marking the BREAKING changes (`docs/release-notes-sessions.md`)
- [x] 3.5 Application migration: legacy Application rows to the app model (URL, flavor, signing secret, speech, fallback); Autopilot apps to the hosted Autopilot (CO-B7)
- [x] 3.6 Cutover runbook: side-by-side routing per app and per number, rollback, Asterisk retirement (`docs/operators/cutover.md`, CO-B8; rewritten as a one-window upgrade after the clean break, CB-B3)
