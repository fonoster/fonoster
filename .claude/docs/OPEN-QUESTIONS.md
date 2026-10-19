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


## Telephony
- outbound-calls: Live Autopilot sessions ignore `createCall` `metadata` (it reaches only the eval path via `createSystemPrompt`; `session/Agent.ts` sends `settings.systemPrompt` alone). The page says Autopilot doesn't read metadata yet. Wire it in (the old docs promised it), or keep the note?
- outbound-calls: The MCP `create_call_batch` paces calls inside the MCP server process (fire-and-forget); calls not yet placed are lost if it stops. The page says so. OK to ship that way?
- transfers: When an Autopilot `transfer` fails (`transfer_failed`), `Agent.transfer()` only logs it and the state machine stays in `transferring`: the caller hears silence until `maxSessionDuration`. The page warns about it. Fix (speak the error message and return to listening)?
- transfers: Warm transfers send no event when the operator answers. The page waits for the operator's first words with `gather({ source: "speech" })`, assuming the operator's speech produces turn events during a warm transfer. Is that right, and should there be a `transfer.answered` event?
- transfers: The protocol's `transfer` takes `music` (hold music for warm), but the Voice SDK's `TransferOptions` has only `mode` and `headers`. Add `music` to the SDKs?
- transfers: The dashboard's "Transfer to an operator" accepts phone numbers only; SDK/CLI accept a SIP address (the gateway allows `sip:` targets). Should the dashboard allow a SIP agent?
- recording: The workspace-level policy exists only in the operator's call-record config (`workspaces.<ref>.recording`); there's no workspace setting in the dashboard, API or CLI, yet the dashboard offers "Workspace default". On Cloud, what is the region default, and can a workspace set its own policy?
- recording: The consent prompt wording is one operator-level string (default "This call will be recorded."), not translated per app language. Per-app or per-language prompts?
- recording: If the app's voice can't be resolved, the consent prompt is skipped silently and recording still starts (`consentPrompt` returns early). Intended?
- link-twilio: The command's default ACL entry is `165.22.7.155/32` (marked TODO in `mods/ctl/src/constants.ts`) and the origination base is `pstn.fonoster.com`. Are both still right for v0.30 Cloud?
- link-twilio: The Fonoster trunk it creates has `sendRegister: true` toward Twilio, which doesn't accept REGISTER on Elastic SIP trunks. Same for every trunk made with `sipnet:trunks:create`. Set it to false?
- link-twilio: No dashboard flow for Twilio linking. Planned?
- trunks: Is the inbound URI still globally unique, and does Cloud resolve `*.sip.fonoster.com` (or another suffix) to the SIP edge? The pages use `acme.sip.fonoster.com` / `claro.acme.sip.fonoster.com`, from the dashboard placeholders.
- trunks: The dashboard shows the region's connection details (SIP address, allowlist) only on the trunk form's hint and SIP agent drawer, plus Settings → Region for private regions. Should the public region's details have a home too?
- sip-agents: Can a SIP agent call an application directly (dial a number that points at an agent and reach it inside Fonoster), and can two SIP agents on a domain call each other? Not documented until confirmed.
- sip-agents: `Privacy` enum in `@fonoster/types` is `PRIVATE = "ID"` but the validator accepts `"PRIVATE"`; the page uses `"NONE"`. Which string should SDK users pass for private?
- amd: The `amd.result` event also carries `speechOnsetMs`, not in the SDK types or spec. Document it?
- Code: `sipnet:calls:get` describes its argument as "The ACL reference".

## Observe
- webhooks: On Fonoster Cloud, is `callRecord.recordUrl` set to an absolute URL, or do `call_record.sealed` events carry the relative `/api/records/...` path? The page tells readers to prefix the API address when it's a path.
- webhooks: Is `@fonoster/common` (for `Webhooks.verifyWebhook`) published on npm for 0.30, and meant for app developers? The page mentions it as a tip.
- webhooks: The dashboard can't edit a webhook's URL or events (create, rotate, delete only). Add edit, or keep it SDK/CLI only? The page says so plainly.
- webhooks: `docs/webhooks.md` example shows `workspaceRef: "ws_..."`; the code fills it with the workspace access key ID (`WO...`). The page uses `WO...`. Confirm.
- webhooks: Which roles can create, rotate and delete webhooks? The handlers don't check a role. Should members be able to?
- call-records: Does every Fonoster Cloud region set `jku`, so the verify script can fetch the key set? If a region doesn't publish keys, how does a Cloud developer get them? (`/.well-known/call-record-keys.json` is served by the region's gateway.)
- call-records: The openspec says redaction runs "when redaction is enabled for a workspace", but the code always writes both copies. The page says every version has both. Confirm there's no per-workspace switch.
- call-records: `records:list --status` help text says "e.g. sealed, failed", but the index stores `completed`, `failed` and `incomplete`. Fix the CLI help? The page lists the real values.
- call-records: `records:get` counts transcript entries from `vcon.analysis` type `transcript`, which the vCon builder never writes (turns are `dialog` text entries), so the TRANSCRIPT line never shows. Bug?
- call-records: Is the HTTP API host on Cloud `https://api.fonoster.com` (the SDK's default `getHttpUrl`)? The curl examples use it.
- call-records: There's no CLI command to print an access token for raw HTTP calls; the page points to `client.getAccessToken()`. Worth adding `fonoster workspaces:token` or similar?
- retention: What role does an API key carry by default? Retention, deletion, erasure and audit need WORKSPACE_OWNER or WORKSPACE_ADMIN, checked against the token's role.
- retention: Retention runs hourly but handles at most 500 records per policy per run, so a large backlog takes several hours on the first run. Worth stating, or raising the cap?
- retention: Erasing a call sends no `call_record.sealed` (the gateway skips erased entries) and there's no `call_record.erased` event. Should there be one, so downstream copies can be purged?
- retention: The audit endpoint returns raw rows (including internal `ref` and `accessKeyId`), unlike the typed `CallRecordAuditEntry`. Trim the response?

