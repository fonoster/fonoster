# Migrating to sessions

Fonoster used to run your voice app as a gRPC server (`voice.proto`) that the apiserver talked to.
Every call now reaches your app as one WebSocket **session** that the VoiceSessionGateway opens to
your app's URL ([session protocol](./session-protocol.md)). This guide covers what changes, in the
order most people need it.

Two breaking changes ship together:

1. `voice.proto` is retired. An app that spoke it directly, without the SDK, must move to the
   session protocol or to an SDK.
2. `record()`, `setAudioFilters()`, `mute()` and `unmute()` are removed.

Everything else keeps working: a handler written as `async (req, res) => { ... }` runs unchanged.

## Which path are you on?

| You have | Do this |
| --- | --- |
| `@fonoster/voice` with `new VoiceServer().listen(async (req, res) => ...)` | [Bump the SDK](#1-sdk-users-bump-the-version), set the signing secret, update the app |
| A Twilio Media Streams bot (Pipecat, for example) | [Use the Twilio flavor](#4-twilio-flavor-with-pipecat), no code change |
| Your own gRPC server speaking `voice.proto` | Use an SDK, or implement [the protocol](./session-protocol.md) |
| An Autopilot assistant | Nothing. Autopilot is an ordinary app of the platform |

## 1. SDK users: bump the version

```sh
npm install @fonoster/voice@latest          # TypeScript
pip install fonoster-voice                  # Python (new)
```

During the transition the session-based server is imported from `@fonoster/voice/session`; the
default export of `@fonoster/voice` is still the gRPC server. In the major version the session
server becomes the default.

```ts
// before
import VoiceServer from "@fonoster/voice";
new VoiceServer().listen(async (req, res) => {
  await res.answer();
  await res.say("Hello");
  await res.hangup();
});

// after: same handler, new import, and a signing secret
import { VoiceServer } from "@fonoster/voice/session";
new VoiceServer({ port: 3000, signingSecret: process.env.APP_SIGNING_SECRET }).listen(
  async (req, res) => {
    await res.answer(); // a no-op now: the gateway answers when your socket connects
    await res.say("Hello");
    await res.hangup();
  }
);
```

The server refuses to start without a signing secret (set `signingSecret` or
`APP_SIGNING_SECRET`). It refuses any connection that is not signed by the gateway.

New code should prefer the `(session)` signature: `async (session) => { await session.say(...) }`.
The methods are the same, plus `hold`, `handoff`, events and `audio`. See
[the voice SDK](./voice-sdk.md) and `mods/voice/examples`.

### Removed and deprecated methods

Removed. They throw an error that names the replacement:

| Method | Replacement |
| --- | --- |
| `record()` | Recording is an app policy: set it on the app (`off`, `on`, `on after consent prompt`). The recording is attached to the call record |
| `setAudioFilters()` | Audio filters are part of the app's configuration |
| `mute()` | `hold()` (the caller hears silence or music) |
| `unmute()` | `resume()` |

Renamed:

| Before | After |
| --- | --- |
| `dial(number)` | `transfer(to, { mode })`. `res.dial()` still works and is a cold transfer. `mode` is `cold`, `warm` (use `completeTransfer()`) or `refer` |
| `answer()` | Nothing to do. It stays as a no-op |

Deprecated. They keep working and log a warning once:

| Before | After | Difference |
| --- | --- | --- |
| `stream()` | `session.audio` (`onFrame`, `send`, `mark`, `clear`) | Frames are raw audio in the session's format (PCM16 16 kHz by default), not the old WAV stream |
| `sgather()` | `session.on("turn.ended" \| "transcript.partial" \| "dtmf")` | Payloads are `{ speech \| digit, responseTime }` |

### Behavior that changed

- **Barge-in is your app's decision.** The gateway never stops the agent on its own. `say()` and
  `play()` are `interruptible` by default and the SDK clears them when the caller starts talking;
  pass `interruptible: false` to keep talking. The result of `say()` tells you what was heard:
  `{ interrupted, heardText, heardMs }`.
- **Type-ahead.** Keypresses and speech that arrive before `gather()` count toward the next
  `gather()` (up to 32).
- **Timeouts.** `gather({ timeout })` is milliseconds in TypeScript and seconds in Python.
- **Errors.** A command the gateway rejects rejects its promise with `SessionError`; when the
  session ends, pending calls reject with `SessionEndedError`.

## 2. App model changes

An app is now a record with these fields (Dashboard: Apps, preview at `/w/<workspace>/preview`):

| Field | Meaning |
| --- | --- |
| `url` | `ws://` or `wss://` address the gateway dials. Replaces the gRPC endpoint. Apps that only have a gRPC endpoint are **not** dialed; their calls follow the fallback |
| `flavor` | `native` (session protocol) or `twilio` (Twilio Media Streams) |
| `signingSecret` | Signs every connection request. Shown once when created or rotated |
| `speech` | Default `voice` and `language` as **catalog ids** (`elevenlabs/rachel`, `en-US`) rather than vendor settings |
| `audio` | Native flavor format: `pcm16` at 8, 16 or 24 kHz, or `pcmu` at 8 kHz (default `pcm16` 16 kHz) |
| `fallback` | Another app, or a message spoken before hanging up, used when your URL cannot be reached (after about 2.5 s of ringing) |
| `listeners` | Up to 4 listen-only sockets (`url`, `tracks`: `inbound`, `outbound`, `both`) for monitoring and analytics |
| recording policy | `off`, `on`, `on after consent prompt`. Apps cannot override it |

A number points to an app; Routr passes the app to the gateway, which connects to its URL.

### Signing secret

Set up the secret in three steps: create (or rotate) it on the app, copy it, and deploy it to your
app as `APP_SIGNING_SECRET`. **Rotation is immediate and has no overlap window**, so an app still
holding the old secret refuses calls until it is redeployed. Rotate during a quiet period.

## 3. Verifying the signature yourself

The SDKs verify it for you. If you implement the protocol directly, check both headers on the
upgrade request: `X-Fonoster-Timestamp` (Unix seconds) and `X-Fonoster-Signature`, the lowercase hex
HMAC-SHA256 of `<timestamp>.<url>` with the signing secret, where `<url>` is the app's URL exactly as
configured (query string included). Reject a timestamp more than 300 seconds from your clock, and
compare in constant time.

TypeScript:

```ts
import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";

export function verify(configuredUrl: string, headers: IncomingHttpHeaders, secret: string) {
  const signature = headers["x-fonoster-signature"];
  const timestamp = Number(headers["x-fonoster-timestamp"]);
  if (typeof signature !== "string" || !Number.isFinite(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${configuredUrl}`).digest();
  const given = Buffer.from(signature, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
```

Python:

```python
import hashlib
import hmac
import time


def verify(configured_url: str, headers: dict[str, str], secret: str) -> bool:
    h = {k.lower(): v for k, v in headers.items()}
    try:
        timestamp = int(h["x-fonoster-timestamp"])
        signature = h["x-fonoster-signature"]
    except (KeyError, ValueError):
        return False
    if abs(time.time() - timestamp) > 300:
        return False
    expected = hmac.new(secret.encode(), f"{timestamp}.{configured_url}".encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
```

Behind a proxy, the URL the gateway signs is the one configured on the app, not the one your server
sees. Pass the configured value, not `request.url`.

## 4. Twilio flavor with Pipecat

An app built for Twilio Media Streams needs no code change: set `flavor` to `twilio` and `url` to
its WebSocket address. The gateway sends `connected`, `start` (`streamSid` is the `sessionRef`,
`callSid` is the `callRef`, μ-law 8 kHz), `media`, `dtmf`, `mark` and `stop`, and accepts `media`,
`mark` and `clear`. Barge-in works the way Pipecat expects: its `clear` empties the output queue.

There is no Speech layer, transfer or TwiML in this flavor. To hang up, close the socket, or let
the serializer call the compatible endpoint
`POST {base}/2010-04-01/Accounts/{accountSid}/Calls/{callSid}.json` with `Status=completed`:

```python
serializer = TwilioFrameSerializer(
    stream_sid=call_data["stream_id"],
    call_sid=call_data["call_id"],
    account_sid=ACCOUNT_SID,
    auth_token=AUTH_TOKEN,
    base_url="https://<your-gateway>",   # points auto_hang_up at Fonoster instead of Twilio
    params=TwilioFrameSerializer.InputParams(auto_hang_up=True),
)
```

`python/pipecat-golden/golden_bot.py` is an unmodified Pipecat bot that the conformance suite runs
against the gateway.

## 5. Checklist

- [ ] Bump `@fonoster/voice` (or install `fonoster-voice`) and change the import
- [ ] Create the app with its `url`, flavor, speech defaults and fallback; copy the signing secret
- [ ] Set `APP_SIGNING_SECRET` in the app's environment
- [ ] Replace `record`, `setAudioFilters`, `mute` and `unmute`
- [ ] Decide recording as app policy
- [ ] Check `dial()` callers: use `transfer()` for warm and refer transfers
- [ ] Re-point numbers at the new app; keep the old app as the fallback until you are confident
