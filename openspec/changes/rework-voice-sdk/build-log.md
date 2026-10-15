# Build log: rework-voice-sdk

Decisions taken while building, for the owner to review. Each can be reversed.

## 2026-10-15 (overnight, owner asleep)

### SDK1. The new SDK ships next to the old one until the cutover

- The session-protocol SDK lives in `mods/voice/src/session/` and is imported as
  `@fonoster/voice/session` (a root `session.js` shim; no `exports` map, so existing deep imports
  keep working). The gRPC `VoiceServer` stays the default export.
- Why: Autopilot and every published app still run on `voice.proto`, and production still runs on
  Asterisk; replacing the default export now would break `next` for everyone. At the cutover the
  default export flips and the gRPC code is removed (task 4.1).

### SDK2. `session.handoffPayload`, not `session.handoff`

- The spec named both the `session.start` handoff payload and the `handoff(app, payload)` method
  `handoff`. The method keeps the name; the payload is `session.handoffPayload`. The spec scenario
  "A call reaches a standalone server" was corrected.

### SDK3. Behaviour the spec left open

- Command ids are deterministic per session: `say-1`, `play-2`, `transfer-3`, ... (the Python SDK
  must use the same scheme so both send identical frames).
- `gather()` default timeout: 4000 ms; the timer restarts on each digit (inter-digit timeout) and
  pauses while the caller speaks (from `turn.user_started` until `turn.ended`).
- Type-ahead: `dtmf` and `turn.ended` events that arrive while no `gather` is pending are kept (up
  to 32) and consumed, in order, by the next `gather`.
- `source` accepts `"speech_and_dtmf"` and today's `"speech,dtmf"`; default is both.
- `say()` resolves `heardMs` on `output.done` with the time between `output.started` and
  `output.done` (the protocol does not report it on done).
- `say(stream)` ends with an empty `speak` (`text: ""`, `last: true`), also when the stream throws.
- `playDtmf`, `hold`, `resume`, `subscribe`, `stopSay` resolve once sent (the protocol has no
  acknowledgement for them); a later `error` for them is emitted as a session `error` event.
- `transfer()` resolves when the session ends with `reason: transfer`; `handoff()` with
  `reason: handoff`; `hangup()` with any end.
- A handler that throws hangs up the call.
- The legacy `res.stream()` and `res.sgather()` throw errors naming `session.audio` and
  `session.on(...)`; the spec only lists record/setAudioFilters/mute/unmute as removed. Review:
  shims could be written if existing apps need them.
- Mounting: `new VoiceServer({ path }).attach(httpServer, handler)` (works with Express's
  underlying server). There is no Express `app.use()` middleware, because WebSocket upgrades do not
  pass through Express middleware.

### SDK4. Conformance

- 24 voice-sdk scenarios (one per wire-expressible spec scenario) with fixtures in
  `mods/conformance/scenarios/voice-sdk/FIXTURES.md`; the TypeScript SDK passes all of them.
- Connection-level behaviour (signature cases, mounting, removed methods, hang-up mid-gather,
  crashing handlers) is covered by SDK unit tests, not scenarios; the Python SDK needs the same
  tests.
- The scenario format gained `next: true` on `expect` (no skipping).

### SDK5. The Python SDK

- Package `fonoster-voice` (open question 1), import `fonoster.voice`, in `python/fonoster-voice`
  (outside the npm workspaces). Python 3.11+ (for `typing.NotRequired`), depends only on `websockets`.
- Same session model, ids and messages as TypeScript, Pythonic names: `stop_say`, `play_dtmf`,
  `complete_transfer`, `from_` (since `from` is a keyword), `heard_text`, `handoff_payload`;
  `gather(timeout=...)` is in seconds; results are dataclasses.
- `VoiceServer(...).listen(handler)` / `@server.handler` + `server.run()`; `voice_asgi_app(handler,
  signing_secret=...)` mounts into FastAPI/Starlette. Sync handlers raise `TypeError`.
- `(req, res)` handlers are supported by arity too, for fixture parity with TypeScript.
- Passes all 24 voice-sdk scenarios with the Python runner (`python/fonoster-conformance`), plus
  unit tests for signatures, ASGI mount, sync handlers, removed methods, session end and crashes.
- Python message types are not generated from `session.v1.json` yet (gateway task 1.1).

### Not done
- Migration docs and release notes (4.x).

## 2026-10-15 (morning, with the owner)

### SDK6. `res.stream()` and `res.sgather()` keep working, deprecated (owner decision)

- Rebuilt on the session: `stream()` gives `onPayload` (AUDIO_IN payloads with raw frames in the
  session's format), `write`, `close`; `sgather()` gives `onPayload` with `{speech | digit,
  responseTime}` from `turn.ended` and `dtmf`, and starts listening with an empty `subscribe`.
  Both log a deprecation warning once and are marked `@deprecated`.
- Difference to note in the upgrade guide: `stream()` payloads carry raw frames in the session's
  audio format (PCM16 16 kHz by default), not the old "WAV" stream.

## 2026-10-15 (dashboard stream: docs and packaging)

### DX-B1. Migration docs live in `docs/`, release notes are a draft page

- `docs/migrating-to-sessions.md` is the upgrade guide (4.2): SDK bump, removed and deprecated
  methods, `dial` to `transfer`, app model fields, signing secret setup and rotation, verification
  snippets in TypeScript and Python, and the Twilio flavor with Pipecat (`base_url` for `auto_hang_up`).
- `docs/release-notes-sessions.md` flags both breaking changes (4.4). It is a draft to paste into the
  GitHub release; the version number is left to the release job.

### DX-B2. `voice.proto` is marked deprecated, not deleted (4.1 left open)

- The legacy apiserver voice path (`VoiceDispatcher`, handlers and their tests) and the default
  export of `@fonoster/voice` still import `voice.proto` and the verb types. Deleting them would break
  the build for code owned by other streams, so the file only carries a DEPRECATED header. Delete
  both together with the apiserver voice path at cutover.

### DX-B3. Python packaging

- `fonoster-voice` now has authors, classifiers (`Typing :: Typed`), keywords, project URLs, a
  `py.typed` marker and an sdist limited to source and README. `uv build` produces the sdist and wheel;
  the wheel installs into a clean venv and imports. `python -m build` is not installed here, `uv build`
  is the equivalent. Publishing is `uv publish` with a PyPI token (documented in its README); the
  version follows the npm packages.

### DX-B4. Examples

- TypeScript examples in `mods/voice/examples` (outside `src`, not compiled by the package build) are
  type-checked against `src/session`. Python examples in `python/fonoster-voice/examples`. Handlers
  are annotated `(session: Session)` because the handler union does not infer the parameter under
  `strict`.
