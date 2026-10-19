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
