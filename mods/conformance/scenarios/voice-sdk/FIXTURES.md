# voice-sdk fixtures

Each SDK runner ships one app per fixture below, written idiomatically in its language. Fixtures
are part of the contract: two SDKs implementing the same fixture must send the same frames for the
same scenario. Keep fixtures tiny; they exercise the SDK, not app logic.

| Fixture | Handler signature | Behaviour |
| --- | --- | --- |
| `say-hello` | `(session)` | `await say("Hello from the SDK.")`, then `hangup()`. |
| `say-hello-legacy` | `(req, res)` | `await res.say("Hello from the SDK.")`, then `res.hangup()`. Must produce the same frames as `say-hello`. |
| `say-reports-interruption` | `(session)` | `r = await say("Your balance is forty two dollars.")`; if `r.interrupted`, `await say("You heard: " + r.heardText)`. |
| `gather-echo` | `(session)` | `r = await gather({ finishOnKey: "#" })`; with speech, `say("You said: " + r.speech)`; with digits, `say("You pressed: " + r.digits)`. |
| `session-info` | `(session)` | `say("Call <callRef> to <to> from <from> (<direction>, app <appRef>)")`. |
| `say-voice-override` | `(session)` | `say("Hola", { voice: "elevenlabs/rachel", language: "es" })`. |
| `say-stream` | `(session)` | `await say(stream of "Hello", " there", "!")`, then `hangup()`. |
| `say-stream-fails` | `(session)` | `say(stream that yields "Hello" then throws)`; on the error, `say("The stream failed.")`. |
| `stop-say` | `(session)` | Starts `say("This is a long message.")`; on any `dtmf` event calls `stopSay()`; when the say resolves interrupted, `say("Stopped after: " + heardText)`. |
| `gather-max-digits` | `(session)` | `gather({ maxDigits: 4 })`, then `say("You pressed: " + digits)`. |
| `gather-timeout` | `(session)` | `gather({ timeout: 300 })`; with neither speech nor digits, `say("No input.")`, otherwise `say("Got input.")`. |
| `dtmf-listener` | `(session)` | Registers `on("dtmf", d => say("Key " + d.digit))`, then `await say("Welcome to the menu.")`. |
| `partials` | `(session)` | `await subscribe(["transcript.partial"])`; `on("transcript.partial", p => say("Heard " + p.text))`. |
| `transfer-cold` | `(session)` | `await transfer("+15551234567")`. |
| `transfer-warm` | `(session)` | `t = transfer("+15551234567", { mode: "warm" })`; `await say("Connecting you now.")`; `await completeTransfer()`; `await t`. |
| `handoff` | `(session)` | `await handoff("app-escalation", { reason: "angry caller" })`. |
| `legacy-dial` | `(req, res)` | `await res.dial("+15551234567")`. |
| `audio-mark` | `(session)` | Registers `on("dtmf", () => audio.clear())`; sends three 20 ms frames of silence with `audio.send`; `m = await audio.mark("r1")`; `say(m.cleared ? "Cleared." : "Heard.")`. |
| `say-error` | `(session)` | `say("Hi")`; if it rejects with a session error, `say("Error: " + code)`. |
| `say-then-gather` | `(session)` | `r = await say("Please enter your PIN.")`; `g = await gather({ maxDigits: 4 })`; `say("PIN " + digits + " (heard: " + r.heardText + ")")`. Digits pressed during the say count (type-ahead). |
| `record-note` | `(session)` | `await note({ kind: "turn", firstTokenMs: 420 })`. |
