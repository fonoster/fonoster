# Open questions for the owner (docs revamp, 2026-10-19)

Collected from each page's checkpoint. Answer them in your review pass.

## Get started
- migrate-from-0-27: `audioFilters` is documented as removed with no replacement (the schema error says "part of the app's configuration", but the app model has no such field). Is that right?
- migrate-from-0-27: Were Cloud users' saved agents and numbers converted automatically? This was inferred from the cutover notes.
- quickstart: Does Cloud run the template's model and voice without workspace vendor keys?
- quickstart: Does a browser call appear under Calls with its transcript?
- quickstart: Are `@fonoster/ctl` and `@fonoster/sdk` 0.30 published on npm?
- how-fonoster-works: Can a workspace change its region after it's created?
- Code: the `@example` in `mods/sdk/src/Applications.ts` calls `SDK.Client(...)` without `new`.
- Stale: `hacking/run-from-source.mdx` says the dashboard section is "Agents"; it's now "Autopilot".

## Autopilot
- build-an-agent: Saving an agent in the dashboard drops `patience`, `hints`, `filler`, `voice` and `language` from `conversationSettings` (`toRequest` in `mods/dashboard/src/agents/agent-form.ts` rebuilds the block from form values only). The page warns about it. Fix the dashboard to carry them over like `testCases` and `knowledgeBase`?
- build-an-agent: The dashboard fills a missing `maxTokens` with 300 (`DEFAULTS` in agent-form.ts); the schema default is 400. Which one is right?
- build-an-agent: The dashboard's model picker lists Google and Anthropic, and old models (gpt-4o, gpt-3.5-turbo, Groq Llama 3.3) that aren't in the catalog. Live calls run OpenAI-compatible providers only. The page lists only catalog models. Trim the picker?
- build-an-agent: `patience` exists in two places: the app's `speech.patience` (CLI `--patience`) and the agent's `conversationSettings.patience`. The agent's value is sent only when it isn't `normal`, so `normal` defers to the app. Is that the intended precedence, and should the docs present just one of them?
- tools: HTTP tool headers are stored in plain text in the agent config; Secrets are not substituted into them. MENU's WHY for `workspace/secrets` says "Credentials for tools without hardcoding", which the code doesn't do. Planned? The tools page says plainly it isn't.
- tools: Is the call record's tool-call trace (`autopilot.turn` toolCalls) visible in the dashboard's call view, or only in the vCon?
- knowledge-base: Is the knowledge base set up on Fonoster Cloud? There's no upload in dashboard, SDK or CLI, and the bucket is the workspace ref in lowercase in the operator's S3. How should a Cloud developer get PDFs into it?
- knowledge-base: Documents load at the start of every call (parse + embed per call), so early turns may get no passages. Worth caching, or documenting a recommended size limit?
- knowledge-base: `title` is required but unused by the lookup. Keep it required?
- test: `testCases.evalsLanguageModel.apiKey` is accepted but ignored when the server has an OpenAI key, and the run fails without one. Drop the field from the schema?
- test: `applications:eval` is described as "experimental" in the CLI. Keep that label for 0.30?
- test: SDK `evaluateIntelligence` calls `setProductRef(request.intelligence.productRef)`; the page passes `productRef: "llm.openai"` to be safe. Is it optional?
- turn-taking: `docs/turn-taking.md` says the detector is chosen per app (`speech.detector`); it's in the gateway's app config, not the public app model, and MENU says per-app detectors aren't promised. Update the draft doc?

## Streams
- voice-sdk: Streams have no "Talk in browser" test, so the tutorial needs a real number. Add browser test calls for streams (it would remove the Twilio prerequisite)?
- voice-sdk: Is `@fonoster/voice` 0.30 published on npm?
- python: `python/fonoster-voice/pyproject.toml` says version 0.27.0 while npm is 0.30.0, and the README says they release together. Is `fonoster-voice` (session SDK) on PyPI, and under which version?
- python: `voice_asgi_app` builds the signed URL from `root_path + path`. Recent Starlette/FastAPI `Mount` puts the prefix in both (ASGI spec), which would give `/voice/voice` and a signature mismatch unless `public_url` is set. The test only uses a hand-built scope. The page tells readers to always pass `public_url`. Worth a fix plus a real FastAPI test?
- python: The Python SDK doesn't check `x-fonoster-app-signature` (no `require_app_binding`, no `signedFor`) and has no `listen()` (listen.update for language, hints, patience). Parity gap with Node. Planned?
- python: `voice_asgi_app`'s keyword is `verify_signature_` (trailing underscore), unlike `VoiceServer(verify_signature=...)`. Rename? The page doesn't mention it.
- python: `verify_signature` isn't exported from `fonoster.voice`; the page imports `fonoster.voice.signature`. Export it (and an app-signature check) at the top level?
- bring-your-app: Pipecat's `auto_hang_up` sends `BasicAuth(account_sid, auth_token)` with the same `account_sid` in the URL. On Cloud the endpoint uses Identity (`exchangeApiKey(user, secret)`), so the user must be an API key ID while the URL's AccountSid must be the workspace ID (`WO...`). An unmodified Pipecat bot can't satisfy both, so the page tells readers to set `auto_hang_up=False` and close the socket. Is the endpoint exposed on Cloud at all, and at what base URL?
- bring-your-app: The page says a Pipecat bot with the default `auto_hang_up=True` and Twilio credentials can't end a Fonoster call. Confirm the call still ends when the socket closes after Twilio's API answers 404.
- bring-your-app: Self-hosted endpoint: `http` is commented out in `ops/rebuild/config/gateway.yaml`, it's plain HTTP on :8080, and the config `accountSid` must equal the app's workspace access key ID (one workspace only). The page says so briefly. Should it live on a self-hosting page instead?
- verify-signatures: The dashboard shows the signing secret only on create and rotate, and the hint as `…` plus the last 4 characters. Correct to call this "the last four characters" in docs?
- Code: `docs/migrating-to-sessions.md` §2 says recording options are `off`, `on`, `on after consent prompt` and "Apps cannot override it"; the app model has `recording` off|on|consent that overrides the workspace. Stale draft.

