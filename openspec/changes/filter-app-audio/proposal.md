# Proposal

## Why

Noise cancelling only works for apps that use the Speech layer. AppBridge starts an app's filters
with speech recognition, on the app's first Speech command, and sends the filtered audio only to
speech recognition and turn detection. So:

- A Twilio-protocol app is never filtered. It has no Speech layer.
- A Fonoster-protocol app that only streams audio is never filtered.
- A Fonoster-protocol app that uses speech gets filtered transcripts, but the caller audio streamed
  to it is raw.

The dashboard offers the *Noise cancelling* select to every app, so these apps save a setting that
does nothing.

## What Changes

- AppBridge starts an app's filters when the session starts, for both protocols, whether or not the
  app uses the Speech layer.
- The caller audio streamed to the app is the filtered audio. Speech recognition and turn detection
  get the same filtered audio, as today.
- Call recordings and answering-machine detection stay unfiltered. Both take the caller's audio from
  the Roomr node directly, not from AppBridge, so nothing changes for them. Unfiltered recordings
  serve auditing.
- Listen-only sockets keep getting the raw audio, as today.
- The rule (owner decision, 2026-11-08): only the AI and the app hear filtered audio, meaning the
  app's stream, speech recognition and turn detection. Everything else stays raw. LiveKit works the same way:
  agent-side noise cancellation never reaches its recordings or other subscribers.
- `nc.seconds` is metered from the session start instead of the first Speech command.

## Not in this change

- A switch for a listen-only socket to receive filtered audio. Add it only if a customer needs it.
- Filtering the app leg (the agent's audio).
- New filters or vendors.
