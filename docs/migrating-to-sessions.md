# What changed: voice sessions

Fonoster used to run your app as a gRPC server (`voice.proto`) that the apiserver talked to,
with Asterisk in front. Every call now reaches your app as one WebSocket **session** that the
AppBridge opens to your app's URL ([session protocol](./session-protocol.md)), and the Go
Roomr nodes carry the audio. This is a new, incompatible release: nothing from the gRPC stack keeps
working, and there are no compatibility shims.

What is gone:

- `voice.proto`, the gRPC `VoiceServer`, `VoiceResponse` and `(req, res)` handlers.
- `stream()`, `sgather()`, `record()`, `setAudioFilters()`, `mute()`, `unmute()` and `dial()`.
- Asterisk, its dialplan and the apiserver's ARI handling; `/api/recordings/:id` and the
  `{appRef}_{id}.wav` recordings (recordings are part of the call record now).
- The previous Autopilot engine (xstate machine, Silero VAD, gRPC voice server). Autopilot is the
  hosted session engine (`mods/autopilot/src/session`).
- In `fonoster.yaml`: `mediaService`, `amd`, `audioFilters`, `routr.defaultPeer` and
  `routr.engines`. Unknown keys stop the apiserver at boot, so delete them.

## Which path are you on?

| You had | Do this |
| --- | --- |
| `@fonoster/voice` with `new VoiceServer().listen(async (req, res) => ...)` | [Rewrite the handler](#1-sdk-users-rewrite-the-handler) to take the session, set the signing secret |
| A Twilio Media Streams bot (Pipecat, for example) | [Use the Twilio protocol](#4-twilio-protocol-with-pipecat), no code change |
| Your own gRPC server speaking `voice.proto` | Use an SDK, or implement [the protocol](./session-protocol.md) |
| An Autopilot agent | Nothing. Autopilot is an ordinary app of the platform |
| Numbers created before this release | Run `repointNumbersCli` (sipnet) to move them from `sip:voice@default` to the roomr peer |

## 1. SDK users: rewrite the handler

```sh
npm install @fonoster/voice@latest          # TypeScript
pip install fonoster-voice                  # Python
```

```ts
// before
import VoiceServer from "@fonoster/voice";
new VoiceServer().listen(async (req, res) => {
  await res.answer();
  await res.say("Hello");
  await res.hangup();
});

// after: one argument, the session, and a signing secret
import { VoiceServer } from "@fonoster/voice";
new VoiceServer({ port: 3000, signingSecret: process.env.APP_SIGNING_SECRET }).listen(
  async (session) => {
    await session.say("Hello");
    await session.hangup();
  }
);
```

`@fonoster/voice/session` still resolves to the same SDK for one release. The server refuses to
start without a signing secret (set `signingSecret` or `APP_SIGNING_SECRET`) and refuses any
connection that is not signed by AppBridge. See [the voice SDK](./voice-sdk.md) and
`mods/voice/examples`.

### Methods

| Before | After |
| --- | --- |
| `req.callerNumber`, `req.ingressNumber`, `req.appRef` | `session.from`, `session.to`, `session.appRef` |
| `answer()` | Nothing to do: AppBridge answers when your socket connects. `session.answer()` resolves at once |
| `dial(number)` | `transfer(to, { mode })`; `mode` is `cold`, `warm` (use `completeTransfer()`) or `refer` |
| `stream()` | `session.audio` (`onFrame`, `send`, `mark`, `clear`): raw audio in the session's format (PCM16 16 kHz by default), not the old WAV stream |
| `sgather()` | `session.on("turn.ended" \| "transcript.partial" \| "dtmf")` |
| `record()` | Recording is an app policy (`off`, `on`, `on after consent prompt`); the recording is attached to the call record |
| `setAudioFilters()` | Audio filters are part of the app's configuration |
| `mute()` / `unmute()` | `hold()` / `resume()` |

### Behavior that changed

- **Barge-in is your app's decision.** AppBridge never stops the agent on its own. `say()` and
  `play()` are `interruptible` by default and the SDK clears them when the caller starts talking;
  pass `interruptible: false` to keep talking. The result of `say()` tells you what was heard:
  `{ interrupted, heardText, heardMs }`.
- **Type-ahead.** Keypresses and speech that arrive before `gather()` count toward the next
  `gather()` (up to 32).
- **Timeouts.** `gather({ timeout })` is milliseconds in TypeScript and seconds in Python.
- **Errors.** A command AppBridge rejects rejects its promise with `SessionError`; when the
  session ends, pending calls reject with `SessionEndedError`.

## 2. App model changes

An app is now a record with these fields (Dashboard: Streams):

| Field | Meaning |
| --- | --- |
| `url` | `ws://` or `wss://` address AppBridge dials. Replaces the gRPC endpoint. Apps that only have a gRPC endpoint are **not** dialed; their calls follow the fallback |
| `protocol` | `fonoster` (session protocol) or `twilio` (Twilio Media Streams) |
| `signingSecret` | Signs every connection request. Shown once when created or rotated |
| `speech` | Default `voice` and `language` as **catalog ids** (`deepgram/aura-2-thalia-en`, `en-US`) rather than vendor settings |
| `audio` | Format with the `fonoster` protocol: `pcm16` at 8, 16 or 24 kHz, or `pcmu` at 8 kHz (default `pcm16` 16 kHz) |
| `fallback` | Another app, or a message spoken before hanging up, used when your URL cannot be reached (after about 2.5 s of ringing) |
| `listeners` | Up to 4 listen-only sockets (`url`, `tracks`: `inbound`, `outbound`, `both`) for monitoring and analytics |
| recording policy | `off`, `on`, `on after consent prompt`. Apps cannot override it |

A number points to an app; Routr passes the app to AppBridge, which connects to its URL.

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

Behind a proxy, the URL AppBridge signs is the one configured on the app, not the one your server
sees. Pass the configured value, not `request.url` or the `Host` header.

AppBridge also binds each connection to its app: `X-Fonoster-App-Ref`, `X-Fonoster-Workspace-Ref`
and `X-Fonoster-App-Signature`, the hex HMAC-SHA256 of
`<timestamp>\n<url>\n<appRef>\n<workspaceRef>` (newline-separated) with the same secret. Checking
it is optional for an app with its own secret; a server that several apps share a secret with
should require it and serve only the `session.start` whose `appRef` matches
(`new VoiceServer({ publicUrl, requireAppBinding: true })` does both).

## 4. Twilio protocol with Pipecat

An app built for Twilio Media Streams needs no code change: set `protocol` to `twilio` and `url` to
its WebSocket address. AppBridge sends `connected`, `start` (`streamSid` is the `sessionRef`,
`callSid` is the `callRef`, μ-law 8 kHz), `media`, `dtmf`, `mark` and `stop`, and accepts `media`,
`mark` and `clear`. Barge-in works the way Pipecat expects: its `clear` empties the output queue.

There is no Speech layer, transfer or TwiML with this protocol. To hang up, close the socket, or let
the serializer call the compatible endpoint
`POST {base}/2010-04-01/Accounts/{accountSid}/Calls/{callSid}.json` with `Status=completed`:

```python
serializer = TwilioFrameSerializer(
    stream_sid=call_data["stream_id"],
    call_sid=call_data["call_id"],
    account_sid=ACCOUNT_SID,
    auth_token=AUTH_TOKEN,
    base_url="https://<your-appbridge>",   # points auto_hang_up at Fonoster instead of Twilio
    params=TwilioFrameSerializer.InputParams(auto_hang_up=True),
)
```

`python/pipecat-golden/golden_bot.py` is an unmodified Pipecat bot that the conformance suite runs
against AppBridge.

## 5. Checklist

- [ ] Bump `@fonoster/voice` (or install `fonoster-voice`) and rewrite handlers to `(session)`
- [ ] Create the app with its `url`, protocol, speech defaults and fallback; copy the signing secret
- [ ] Set `APP_SIGNING_SECRET` in the app's environment
- [ ] Replace `dial`, `stream`, `sgather`, `record`, `setAudioFilters`, `mute` and `unmute`
- [ ] Decide recording as app policy
- [ ] Remove `mediaService`, `amd`, `audioFilters`, `routr.defaultPeer` and `routr.engines` from
      `fonoster.yaml`; set `routr.roomrPeer.password`
- [ ] Move numbers created before this release to the roomr peer (`repointNumbersCli`)
