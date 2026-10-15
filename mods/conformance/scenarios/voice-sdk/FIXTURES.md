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
