# Release notes: the session protocol

Draft for the release that makes the session protocol the default. Two changes are breaking.

## Breaking changes

1. **`voice.proto` is retired.** Voice apps are no longer gRPC servers. The VoiceSessionGateway
   opens one signed WebSocket to your app's URL for every call. Apps that use `@fonoster/voice`
   upgrade by bumping the version; apps that speak `voice.proto` directly must move to an SDK or to
   the [session protocol](./session-protocol.md). An app record that only has a gRPC endpoint is
   not dialed: its calls follow the app's fallback.
2. **`record()`, `setAudioFilters()`, `mute()` and `unmute()` are removed.** Calling them throws an
   error that names the replacement. Recording and audio filters are app configuration, and
   `hold()` / `resume()` replace mute / unmute.

Also required: a **signing secret**. The SDK servers refuse to start without one and refuse
connections that are not signed by the gateway. Rotation is immediate, with no overlap window.

## New

- A **Python SDK**, `fonoster-voice`, with the same methods, events, errors and `gather` rules as
  TypeScript. Both pass the same conformance scenarios.
- `(session)` handlers (`say`, `gather`, `play`, `transfer`, `hold`, `handoff`, events, raw audio).
  `(req, res)` handlers keep working through a thin wrapper.
- `say()` reports what the caller heard (`interrupted`, `heardText`, `heardMs`). Barge-in is the
  app's decision (`interruptible`).
- `say()` takes an async iterable, to stream model tokens into one utterance.
- Warm and `refer` transfers; `dial()` is now `transfer()` (`dial()` still works as a cold transfer).
- Twilio Media Streams flavor for Pipecat and similar bots.
- Listen-only sockets for monitoring.

## Deprecated (still working, log once)

- `stream()`: use `session.audio`. Frames are raw PCM16 16 kHz, not WAV.
- `sgather()`: use `session.on("turn.ended" | "transcript.partial" | "dtmf")`.

## Upgrade

See [Migrating to sessions](./migrating-to-sessions.md).
