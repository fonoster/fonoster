## Context

`@fonoster/voice` today exposes `VoiceServer`, a gRPC server that the apiserver dials for every
call. The handler receives `(req: VoiceRequest, res: VoiceResponse)`, and every verb is "send a
request, wait for its response":

```ts
new VoiceServer({ skipIdentity }).listen(async (req, res) => {
  await res.answer();
  await res.say("Hi there! What's your name?");
  const { speech: name } = await res.gather({ source: GatherSource.SPEECH });
  await res.say("Nice to meet you " + name + "!");
  const { digits } = await res.gather({ maxDigits: 4, finishOnKey: "#" });
  await res.hangup();
});
```

The rebuild retires `voice.proto` and introduces the session protocol: one WebSocket per call,
JSON text frames for control, binary frames for audio, three layers (Speech, Audio, Control), and
a gateway that dials the app's URL with a signed connection request. The SDK is the layer that
makes that protocol feel like today's verbs.

## Goals / Non-Goals

**Goals**

- Today's apps upgrade by bumping the version, unless they use a removed method.
- The SDK is a thin client: every method is explainable as "these messages go out, the call
  resolves on these events".
- TypeScript and Python behave identically, proven by the same scenario files.
- Streaming LLM output into speech is one call: `say(stream)`.
- Autopilot needs nothing the public SDK doesn't offer.

**Non-Goals**

- A webhook or TwiML-style mode (deferred).
- SDKs for other languages in this release.
- Any change to the management API SDK (`@fonoster/sdk`), which stays gRPC.
- Client-side STT or TTS. Speech runs in the gateway; the SDK never contains vendor code.

## Decisions

### S1. Keep the `(req, res)` handler as a thin wrapper

`listen()` accepts either `(session) => Promise<void>` or `(req, res) => Promise<void>`. The SDK
tells them apart by arity. `req` is built from `session.start`; `res` forwards every surviving
method to the session. One implementation, two signatures.

*Rejected:* new signature only. Cleaner docs, but every app edits its handler for no behavioral
gain, which breaks the promise that the move is transparent for users.

### S2. The gateway auto-answers; `answer()` is a no-op

The gateway answers an inbound call once the app's socket is connected and its signature
verified, so the caller never waits on app code. `answer()` stays in the SDK, resolves
immediately and sends nothing. Rejecting calls is a routing rule, not app code.

*Rejected:* explicit answer. It gives screening and ringback control, but adds a round trip and a
failure mode to every call.

### S3. Remove `record`, `setAudioFilters`, `mute`, `unmute`

- Recording is a per-app policy applied by the platform (call record, `add-call-record`).
- Audio filters (noise cancellation and similar) are part of the app's configuration and run in
  the gateway's audio pipeline.
- Mute: apps already control what they send and can ignore incoming audio; `hold` covers "the
  caller hears nothing".

In TypeScript the removed methods no longer exist on `res`, so the compiler points to every call
site. In JavaScript and Python they raise a clear error naming the replacement.

*Rejected:* keeping `mute`/`unmute` as Control commands. One more command to specify and test,
for a need nobody showed.

### S4. Python ships with TypeScript, against the same scenarios

Both SDKs run the language-neutral scenario files from `add-conformance-framework` against a fake
gateway before release. If something is awkward in Python, the protocol is fixed, not one SDK.

*Rejected:* TypeScript first. Faster, but risks protocol choices shaped by one language.

The Python SDK is **asyncio only**: handlers are `async def`, and every method is a coroutine, as in
Pipecat, FastAPI and LiveKit Agents. There is no synchronous facade. *Rejected:* a blocking facade
for simple IVR scripts, which would add a second surface to test and document.

### S5. Autopilot is a plain SDK client

Autopilot is a hosted `VoiceServer`. It uses `say(stream)`, turn events and the opt-in
`turn.estimate` subscription; it no longer runs its own VAD. Whatever Autopilot needs becomes
public SDK surface (details in `rework-autopilot`).

### S6. Keep request/response verbs; no async verb redesign

An earlier proposal made every verb return a handle plus lifecycle events. It was rejected:
`stopSay` already handles interruption, and promises already let apps do other work while
speaking. The two real gaps — streaming text into `say` and knowing what was heard — are covered
by `say(stream)` and the `{ interrupted, heardText }` result.

### S7. `VoiceServer` is a WebSocket server that verifies signatures

```ts
new VoiceServer({ port: 3000, signingSecret: process.env.APP_SIGNING_SECRET })
  .listen(async (session) => { /* … */ });

// or mounted into an existing app
app.use("/voice", voiceMiddleware({ signingSecret }, handler));
```

```python
server = VoiceServer(port=3000, signing_secret=os.environ["APP_SIGNING_SECRET"])

@server.handler
async def on_call(session: Session) -> None:
    ...

server.run()

# or mounted into an existing ASGI app
app.mount("/voice", voice_asgi_app(signing_secret=..., handler=on_call))
```

A connection with a missing, invalid or stale signature is rejected before the handler runs. A
local development flag disables verification and logs a warning on every connection.

### S8. Method mapping

| Today | New SDK | Messages |
| --- | --- | --- |
| `say(text)` | `say(text, { voice?, language?, interruptible?, preempt? })` → `{ interrupted, heardText, heardMs }` | `speak` (`last: true`); resolves on `output.done` or `output.interrupted` |
| — | `say(stream)` (async iterable of strings) | `speak` pieces with one `id`; the final piece has `last: true` |
| `stopSay()` | Same | `clear` |
| `gather(opts)` | Same options | SDK waits for `turn.ended` (speech) or collects `dtmf` until `maxDigits`, `finishOnKey` or `timeout` |
| `sgather()` | `session.on("turn.ended" \| "transcript.partial" \| "dtmf", cb)` | Events (`transcript.partial` requires `subscribe`) |
| `play(url)` | Same, plus `{ loop?, interruptible?, preempt? }` | `play` |
| `playDtmf(d)` | Same | `dtmf.send` |
| `dial(number)` | `transfer(number, { mode?, headers? })`, `completeTransfer()` for warm transfers | `transfer`, `transfer.complete` |
| `stream()` | `session.audio.onFrame(cb)`, `.send(bytes)`, `.mark(name)`, `.clear()` | Binary frames, `mark`, `clear` |
| `hangup()` | Same | `hangup` |
| `answer()` | No-op | — |
| — | `hold({ music? })`, `resume()` | `hold`, `resume` |
| — | `handoff(app, payload)` | `handoff` |
| — | `subscribe(["turn.estimate", "transcript.partial"])` | `subscribe` |
| `record`, `setAudioFilters`, `mute`, `unmute` | Removed | — |

`dial` stays as a deprecated alias of `transfer` on the `res` wrapper only.

### S9. Errors

Command failures reported by the gateway with an `error` message whose `relatesTo` matches a
command id reject that command's promise with a typed `SessionError` (`code`, `message`,
`fatal`). Errors with no `relatesTo` are emitted as `session.on("error")`. A `fatal` error or
`session.end` rejects every pending promise with `SessionEndedError`, so handlers never hang.

## Risks / Trade-offs

- **`gather` semantics move into the SDK.** Two SDKs must implement identical timing rules.
  Mitigation: the rules are spelled out in the spec and exercised by shared scenarios.
- **Arity detection for handler signatures** can misfire with wrapped functions (default params,
  decorators). Mitigation: an explicit `listen(handler, { signature: "legacy" })` override.
- **Breaking release.** Apps calling `voice.proto` directly break. Expected to be a tiny group;
  covered by release notes and a major version.
- **Python parity slows the first release.** Accepted to keep the protocol honest.

## Open Questions

1. Package names: keep `@fonoster/voice` for TypeScript; `fonoster-voice` or `fonoster` on PyPI?
2. Version number for the breaking release (next major of `@fonoster/voice`, or aligned with the
   platform version)?
3. Should `gather()` with `source: "speech"` also accept a partial transcript after `timeout`, or
   return empty, as today?
4. Does `say()` need a `{ wait: false }` option, or is "don't await the promise" enough?
