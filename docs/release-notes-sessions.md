# Release notes: the session protocol

Draft for the release that makes the session protocol the only voice path. It is a new,
incompatible release: there are no compatibility shims.

## Breaking changes

1. **`voice.proto` is retired.** Voice apps are no longer gRPC servers. The VoiceSessionGateway
   opens one signed WebSocket to your app's URL for every call. Apps that speak `voice.proto`
   directly must move to an SDK or to the [session protocol](./session-protocol.md). An app record
   that only has a gRPC endpoint is not dialed: its calls follow the app's fallback.
2. **`@fonoster/voice` is the session SDK.** Handlers take one argument, the session. The gRPC
   `VoiceServer`, `VoiceResponse`, `(req, res)` handlers, `stream()`, `sgather()` and `dial()` are
   gone; `@fonoster/voice/session` stays as an alias for this release only.
3. **`record()`, `setAudioFilters()`, `mute()` and `unmute()` are removed.** Recording and audio
   filters are app configuration, and `hold()` / `resume()` replace mute / unmute.
4. **Asterisk is retired.** The Go media nodes answer every app-linked number
   (`sip:medianode@default`); the apiserver no longer talks ARI, serves `/api/recordings/:id`
   or creates the `sip:voice@default` peer. API-originated calls (`CreateCall`) are placed on the
   media nodes. `fonoster.yaml` loses `mediaService`, `amd`, `audioFilters`, `routr.defaultPeer`
   and `routr.engines`.
5. **Autopilot is the hosted session engine.** The previous engine (xstate machine, Silero VAD,
   gRPC voice server) is gone; `fonoster/autopilot` runs `mods/autopilot/src/session` and reads
   `autopilot-session.yaml`.

Also required: a **signing secret**. The SDK servers refuse to start without one and refuse
connections that are not signed by the gateway. Rotation is immediate, with no overlap window.

## New

- A **Python SDK**, `fonoster-voice`, with the same methods, events, errors and `gather` rules as
  TypeScript. Both pass the same conformance scenarios.
- `(session)` handlers (`say`, `gather`, `play`, `transfer`, `hold`, `handoff`, events, raw audio).
- `say()` reports what the caller heard (`interrupted`, `heardText`, `heardMs`). Barge-in is the
  app's decision (`interruptible`).
- `say()` takes an async iterable, to stream model tokens into one utterance.
- Cold, warm and `refer` transfers.
- Twilio Media Streams flavor for Pipecat and similar bots.
- Listen-only sockets for monitoring.

## Upgrade

See [What changed](./migrating-to-sessions.md).
