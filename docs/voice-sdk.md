# Voice SDK (session protocol)

The voice SDKs answer calls over the [session protocol](./session-protocol.md). TypeScript and
Python have the same methods and send the same messages; both pass the same conformance scenarios.

Import the TypeScript SDK from `@fonoster/voice`. `@fonoster/voice/session` still works as an alias
for one release.

## TypeScript

```ts
import { VoiceServer } from "@fonoster/voice";

new VoiceServer({ port: 3000, signingSecret: process.env.APP_SIGNING_SECRET }).listen(async (session) => {
  await session.say("Hi! What can I do for you?");
  const answer = await session.gather({ timeout: 5000 });
  if (answer.speech) await session.say(`You said: ${answer.speech}`);
  await session.hangup();
});
```

To serve sessions from an existing HTTP server (Express included), attach to it:

```ts
const server = app.listen(8080);
new VoiceServer({ path: "/voice", signingSecret }).attach(server, handler);
```

## Python

```python
import os
from fonoster.voice import VoiceServer

server = VoiceServer(port=3000, signing_secret=os.environ["APP_SIGNING_SECRET"])

@server.handler
async def on_call(session):
    await session.say("Hi! What can I do for you?")
    answer = await session.gather(timeout=5)
    if answer.speech:
        await session.say(f"You said: {answer.speech}")
    await session.hangup()

server.run()
```

Mount into FastAPI or any ASGI app with `app.mount("/voice", voice_asgi_app(on_call, signing_secret=...))`.
The Python SDK is asyncio only; plain `def` handlers are rejected.

## The session

| TypeScript | Python | Messages |
| --- | --- | --- |
| `say(text, { voice, language, interruptible, preempt })` | `say(text, voice=…, …)` | `speak`; resolves to `{ interrupted, heardText, heardMs }` on `output.done` or `output.interrupted` |
| `say(asyncIterable)` | `say(async_iterable)` | `speak` pieces with one `id`, then `last: true` (stream LLM tokens straight into speech) |
| `stopSay()` | `stop_say()` | `clear`; pending `say` calls resolve as interrupted |
| `play(url, { loop, interruptible, preempt })` | `play(url, …)` | `play` |
| `gather({ source, maxDigits, finishOnKey, timeout })` | `gather(source=…, max_digits=…, finish_on_key=…, timeout=…)` | built from `turn.ended` and `dtmf`; resolves to `{ speech }` or `{ digits }`, or neither on timeout (TypeScript in ms, Python in seconds; default 4 s) |
| `on(event, cb)` / `subscribe([...])` | same | turn events, `dtmf`, `transcript.partial`, `turn.estimate`, `error`, `end` |
| `audio.onFrame`, `audio.send`, `audio.mark`, `audio.clear` | `audio.on_frame`, … | raw audio, `mark`, `clear` |
| `playDtmf(digits)` | `play_dtmf(digits)` | `dtmf.send` |
| `transfer(to, { mode, headers })`, `completeTransfer()` | `transfer(...)`, `complete_transfer()` | `transfer`, `transfer.complete`; `transfer()` resolves when the session ends with `transfer` |
| `hold({ music })`, `resume()` | same | `hold`, `resume` |
| `handoff(app, payload)` | same | `handoff` |
| `hangup()` | same | `hangup` |
| `answer()` | same | nothing (the gateway answers on connect) |

Session fields: `callRef`, `sessionRef`, `appRef`, `direction`, `from` (`from_` in Python), `to`,
`metadata`, `handoffPayload` (`handoff_payload` in Python; the payload from another app's handoff), `speech`, `audioFormat`,
`tracks`.

Keypresses and speech that arrive before you call `gather` are kept (up to 32) and count toward the
next `gather`, so callers can type ahead.

When the caller starts talking over a `say` or `play` with `interruptible` true (the default), the
SDK stops it with `clear` and the call resolves with `interrupted: true`. Pass
`interruptible: false` to keep talking; the gateway itself never cuts the agent off.

## Errors

- A command the gateway rejects (an `error` with `relatesTo` naming it) rejects its promise with
  `SessionError` (`code`, `message`, `fatal`).
- When the session ends, every pending call rejects with `SessionEndedError` (`reason`), so handlers
  never hang.
- A handler that throws hangs up the call.

## Coming from the gRPC SDK

This release is not compatible with the gRPC SDK; [What changed](./migrating-to-sessions.md)
lists every difference. Runnable examples are in `mods/voice/examples` and
`python/fonoster-voice/examples`.

- Handlers take one argument, the session. `(req, res)` handlers are not supported; the Python SDK
  refuses them with a `TypeError`.
- `dial(number)` is `transfer(number)`.
- `stream()` is `session.audio`; `sgather()` is `session.on("turn.ended" | "transcript.partial" |
  "dtmf")`.
- `record()`, `setAudioFilters()`, `mute()` and `unmute()` do not exist: recording is an app policy,
  audio filters are part of the app's configuration, and `hold()` / `resume()` replace muting.
