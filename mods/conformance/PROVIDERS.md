# Fake provider protocol

Every implementation that calls speech or language providers ships a `fake` adapter per
capability that speaks this protocol (see the `conformance` spec, "Implementations ship fake
provider adapters"). The fakes in `src/fakes/providers` serve it; the harness injects delays and
failures, and records them so runners can subtract provider time (`budget_ms`).

The fakes run only in test deployments. They are configured with a base URL, from
`FakesHarness.providerUrls`.

## TTS: `POST {tts}/v1/synthesize`

Request body (JSON):

| Field | Required | Meaning |
| --- | --- | --- |
| `text` | yes | Text to speak. Empty or missing gives HTTP 400 `bad_request`. |
| `voice`, `language` | no | Recorded for assertions; they do not change the audio. |
| `format` | no | `{codec, rate}`: `pcm16` (default, little-endian), `l16` or `pcmu`; rate default 16000 (8000 for `pcmu`). |

Response: HTTP 200, `application/octet-stream`, audio streamed in 20 ms chunks as fast as possible.

- The audio is a 440 Hz tone lasting 60 ms per character of `text`, so durations are predictable.
- `X-Fake-Duration-Ms`: the duration of the audio.
- `X-Fake-Word-Timings`: JSON `[{word, startMs, endMs}]`. A word starts at `index × 60` ms, where
  `index` is its character offset. This is how suites predict `heardText` after a cut.

## STT: WebSocket `{stt}/v1/listen?language=en-US&codec=pcm16&rate=16000`

| Direction | Frame | Meaning |
| --- | --- | --- |
| client → fake | binary | Caller audio in the format from the query string |
| client → fake | `{type: "config", language?, hints?}` | Changes language or hints for later transcripts |
| client → fake | `{type: "finalize"}` | Emits every remaining scripted transcript now |
| fake → client | `{type: "transcript", text, final, language, confidence, startMs, endMs, turn?}` | A scripted transcript; `turn: {eot?, endOfTurn?}` when the script entry sets `eot` or `endOfTurn` (a turn-aware recognizer) |

Transcripts are scripted as `[{atMs, text, final?, language?}]`. An entry fires once the stream
has carried `atMs` of audio, after the configured delay.

## LLM: `POST {llm}/v1/chat/completions`

This is OpenAI Chat Completions compatible, with or without `stream: true` (server-sent events, one
chunk per word, then `data: [DONE]`). Replies come from the script in order: `{content}` or
`{tool_calls: [{name, arguments}]}`. With an empty script the reply is `Echo: <last user message>`.

## OAuth2 sign-in: `{oauth2}` (fake GitHub, or an OIDC provider)

A fake sign-in provider for the dashboard's GitHub button and identity's code exchange, so no real
GitHub app or account is involved. Identity's `oauth2.github.url` and `.apiUrl` point at it (in the
rebuild stack: `http://<host ip>:16704` for the browser and the token exchange, `http://fakes:7004`
for the API). The profile picks the shape (`FAKES_OAUTH2_PROFILE`):

| Profile | Authorize | Token | Identity |
| --- | --- | --- | --- |
| `github` (default) | `GET /login/oauth/authorize` | `POST /login/oauth/access_token`, JSON or form | `GET /user`, `GET /user/emails` (primary, verified) |
| `oidc` | `GET /authorize` | `POST /token`, form-encoded | `GET /userinfo` (`email`, `email_verified`, `name`) |

The authorize page asks which account's primary email signs in (default `FAKES_OAUTH2_EMAIL`,
`admin@fonoster.local`) and redirects back with a one-time code and the caller's `state`. An email
with a Fonoster account signs that user in; an unknown one exercises the sign-up policy. Tests drive
it without the page by adding `&email=<address>` to the authorize URL.

## Injected failures

`failNext` applies to the next request or stream only:

| Value | HTTP fakes (TTS, LLM) | STT |
| --- | --- | --- |
| `provider_unavailable` | HTTP 503 `{error: {code}}` | Socket closed with code 1011 |
| `bad_request` | HTTP 400 `{error: {code}}` | Socket closed with code 1008 |
| `provider_timeout` | Request held open, never answered | Audio accepted, nothing sent back |

Adapters map these to session `error` codes exactly as they map the real vendor's failures:
`provider_unavailable`, `provider_timeout`, or `bad_message` for the caller's malformed input.
