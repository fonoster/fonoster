## Why

Voice applications today run a gRPC server that holds a `voice.proto` session with the apiserver.
The rebuild replaces that with one WebSocket session protocol served by the VoiceSessionGateway
(see `add-voice-session-gateway`). The SDKs are how almost everyone reaches voice: Autopilot users
never see the protocol, and SDK users should be able to upgrade by bumping a version. This change
makes the TypeScript SDK a thin, typed client of the session protocol, keeps today's feel
(`await say()`, `await gather()`), and ships a Python SDK in the same release.

## What Changes

- **`VoiceServer` becomes a small WebSocket server.** It accepts connections from the gateway,
  verifies the HMAC-signed connection request with the app's signing secret, and hands each
  session to the handler. It can also mount into an existing Express (TS) or FastAPI/ASGI (Python)
  app instead of listening on its own port.
- **A new handler signature, `(session)`**, plus the old `(req, res)` signature kept as a thin
  wrapper over the session, so most apps upgrade without code changes.
- **Every method maps onto session messages**:
  - `say(text)` sends `speak` and resolves on `output.done` or `output.interrupted`, returning
    `{ interrupted, heardText }`.
  - `say(stream)` streams LLM tokens as `speak` pieces sharing one id.
  - `stopSay()` sends `clear`.
  - `gather()` keeps its options (`source`, `maxDigits`, `finishOnKey`, `timeout`) but is built
    by the SDK from `turn.ended` and `dtmf` events.
  - `play()` sends `play`, `playDtmf()` sends `dtmf.send`, `dial()` becomes `transfer()`.
  - `stream()` becomes `session.audio` (`onFrame`, `send`, `mark`, `clear`).
  - `sgather()` becomes event subscriptions (`turn.ended`, `transcript.partial`, `dtmf`).
- **`answer()` becomes a no-op.** The gateway answers as soon as the app's socket is connected
  and verified.
- **BREAKING:** `voice.proto` is retired. Apps that speak it directly, without the SDK, must move
  to the session protocol.
- **BREAKING:** `record()`, `setAudioFilters()`, `mute()` and `unmute()` are removed. Recording
  and audio filters become app policy configured on the app, and hold covers "the caller hears
  nothing".
- **A Python SDK** ships in the same release as TypeScript and passes the same language-neutral
  conformance scenarios.

## Capabilities

### New Capabilities

- `voice-sdk`: the TypeScript and Python voice SDKs as clients of the session protocol — server,
  handler signatures, method-to-message mapping, compatibility wrapper, removals, and parity
  between languages.

### Modified Capabilities

None. There is no existing `voice-sdk` spec; the behavior of today's `@fonoster/voice` is
described here for the first time.

## Impact

- **Affected code:** `mods/voice` (rewritten on top of a WebSocket client of the session
  protocol), a new Python package, `mods/autopilot` (consumes the new SDK; see
  `rework-autopilot`), `mods/common` (`voice.proto` and verb types removed or deprecated).
- **Out of scope:** the management API SDK (`@fonoster/sdk`: numbers, agents, apps, calls) stays
  gRPC and is unchanged.
- **Dependencies:** `add-voice-session-gateway` defines every message this SDK sends and receives.
  `add-conformance-framework` provides the scenario files and fake gateway the SDKs are tested
  against.
- **Users:** a major version for `@fonoster/voice`. Apps using removed methods change those
  calls; everyone else bumps the version.
