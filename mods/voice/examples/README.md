# Examples

Session-protocol handlers for `@fonoster/voice/session`. Python versions of the same ideas are in
`python/fonoster-voice/examples`. See `docs/voice-sdk.md`.

| File | Shows |
| --- | --- |
| `01-say-gather-transfer.ts` | `say`, `gather` (speech and DTMF), cold `transfer`, `hangup` |
| `02-barge-in.ts` | `interruptible`, `interrupted` and `heardText`, type-ahead |
| `03-express-attach.ts` | Mounting on an existing Express server with `attach` |
| `04-legacy-req-res.ts` | The old `(req, res)` handler signature |
| `05-stream-llm-tokens.ts` | `say(asyncIterable)` for streamed model output |

Every example reads the app's signing secret from `APP_SIGNING_SECRET`. The gateway signs each
connection request and the SDK refuses unsigned ones; without a secret the server refuses to start
(pass `verifySignature: false` for local experiments only).
