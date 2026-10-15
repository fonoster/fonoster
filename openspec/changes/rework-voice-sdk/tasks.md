> Build started 2026-10-15 under the owner's overnight go-ahead. Decisions: see build-log.md.

# Tasks

## 1. Conformance assets

- [x] 1.1 Write language-neutral SDK scenario files covering every scenario in
      `specs/voice-sdk/spec.md` (format defined by `add-conformance-framework`)
- [x] 1.2 Add a scripted fake gateway that plays scenario files to an SDK and records the
      messages it receives
- [x] 1.3 Add signature fixtures: valid, wrong secret, missing, stale timestamp

## 2. TypeScript SDK (`mods/voice`)

- [x] 2.1 Replace the gRPC server with a WebSocket `VoiceServer` (standalone and Express
      middleware) that verifies signed connections
- [x] 2.2 Implement the session object: message encoding, command ids, event dispatch,
      `SessionError` and `SessionEndedError`
- [x] 2.3 Implement `say(text)`, `say(stream)`, `stopSay`, `play`, `playDtmf`, `transfer`, `hold`,
      `resume`, `handoff`, `hangup`, `subscribe`, `on`
- [x] 2.4 Implement `gather` from `turn.ended` and `dtmf` (source, maxDigits, finishOnKey,
      timeout)
- [x] 2.5 Implement `session.audio` (`onFrame`, `send`, `mark`, `clear`)
- [x] 2.6 Implement the `(req, res)` wrapper, `answer()` no-op, `dial` alias and the explicit
      `signature: "legacy"` override
- [x] 2.7 Remove `record`, `setAudioFilters`, `mute`, `unmute` from types; runtime errors naming
      the replacement
- [x] 2.8 Pass every SDK scenario against the fake gateway

## 3. Python SDK (new package)

- [x] 3.1 Create the package (name per Open Question 2) with the same session model on
      `asyncio`
- [x] 3.2 Standalone server and ASGI mount with signature verification
- [x] 3.3 Implement the same methods, events, errors and `gather` rules as TypeScript
- [x] 3.4 Pass every SDK scenario against the fake gateway

## 4. Migration and docs

- [ ] 4.1 Retire `voice.proto` and the verb types in `mods/common`
- [ ] 4.2 Upgrade guide: version bump, removed methods and their replacements, `dial` to
      `transfer`, signing secret setup
- [ ] 4.3 Docs pages for TypeScript and Python with matching examples
- [ ] 4.4 Release notes flagging both breaking changes
