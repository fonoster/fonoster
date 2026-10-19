# Writing brief: v0.30 developer docs (2026-10-19)

The owner asked for every planned page to be written now and will review them all at the end, so
there are **no human gates**. Make sensible calls and record them in each page's checkpoint.

## Where
- Worktree: `/Users/psanders/Projects/fonoster/.worktrees/docs-ia`, branch `feat/docs-ia`. Work only here; never touch `/Users/psanders/Projects/fonoster` (the main checkout).
- Pages go under `docs-site/<path>.mdx`, with the path taken from `docs-site/MENU.md`.
- A Mintlify dev server is already running at http://localhost:3334 (hot reload). Don't start another; `curl` a page to check it renders (HTTP 200 and the heading text appears).

## Read first
1. `docs-site/CLAUDE.md`: audience, vocabulary, disclosure rule, example values, house voice. Obey it.
2. `docs-site/MENU.md`: page list, Diátaxis type, WHY, sources, and the "Not built, so never promised" list.
3. Style models: `docs-site/introduction.mdx`, `docs-site/hacking/run-from-source.mdx`, `docs-site/self-hosting/install-compose.mdx`.
4. Skill references in `/Users/psanders/.claude/plugins/cache/psstack/ps/0.25.0/skills/docs/references/`: `diataxis.md` (the spine per type), `voice.md`, `mintlify.md`, `checkpoint-template.md`.

## Per page (the /ps:docs loop, without gates)
1. **Frame**: write a 2–3 sentence purpose and a frontmatter `description` (one sentence).
2. **Source**: read the real code, spec, schema, proto, CLI command and tests. Every command, flag, field, default, event name and limit comes from the code, never from memory. The `docs/*.md` drafts are a good start but may be stale; when one disagrees with the code, the code wins.
3. **Outline** by the type's spine, then **draft** the MDX. Use `<Steps>`, `<Tabs>` (Dashboard / SDK / CLI where they all exist), `<CodeGroup>`, `<ParamField>`/`<ResponseField>` for reference, `<CardGroup>` for next steps, and `<Note>`/`<Warning>`.
4. **Assets**: writers don't draw. A separate asset pass draws everything in Pencil after each group. Every overview or concept page gets a banner, and any explanation that needs a picture gets a diagram. Mark each spot with `{/* TODO asset: <slug>/<name> — <what it shows> */}`. Append a row to the Pending table in `.claude/docs/ASSET-QUEUE.md`. Never edit `docs-site/images/ASSETS.md`; the asset agent owns it. For a diagram, give its node/edge spec in text in that row: the boxes, the arrows and their labels, and what the reader should take away.
5. **Proof**: re-check every claim against the source. Live-running a tutorial is NOT required (the local stack isn't free). Mark claims you couldn't verify in the checkpoint under "Unverified".
6. **Wire**: add the page to `docs-site/docs.json` → v0.30 → tab "Docs". Groups in this order: Get started, Autopilot, Streams, Telephony, Observe, Workspace, Reference. Pages within a group follow MENU order. If a legacy redirect `source` equals the new path, remove that redirect.
7. **Checkpoint**: `.claude/docs/<slug>.md` from the template, with stages done and the source list. Keep it short.

## Cross-links
Link freely to any path in MENU.md, even if it isn't written yet (other agents are writing those pages). In your final report, list any broken link that does NOT point to a MENU path.

## Known facts (from the code study; verify before using)
- The API is gRPC (protos in `mods/common/src/protos`); the browser goes through grpc-web via Envoy. There's no OpenAPI spec. HTTP routes: `/api/records*` (`mods/apiserver/src/records/createRecordsRouter.ts`).
- Application: `type` STREAM|AUTOPILOT, `protocol` fonoster|twilio, `speech`, `audio`, `fallbackAppRef`/`fallbackMessage`, `listeners[]`, `recording` off|on|consent, `amd{enabled, windowMs}`, `intelligence.config` (`mods/types/src/applications.types.ts`).
- Autopilot schema: `mods/common/src/assistants/sessionAssistantSchema.ts`. Tools: hangup, transfer (needs `transferOptions`), HTTP. No MCP tools. Live LLMs are OpenAI-compatible only (openai, groq, ollama).
- Voice SDK: `mods/voice/src/Session.ts`, `docs/voice-sdk.md`. It has no record, mute or stream verb; recording is a policy.
- Python SDK: `python/fonoster-voice`. Pipecat: `python/pipecat-golden`. Protocol: `docs/session-protocol.md`, `mods/common/schema/session.v1.json`.
- Webhooks: `docs/webhooks.md`; events `call.started`, `call.ended`, `call.failed`, `call_record.sealed`, `provider.deprecated`.
- Call records: `docs/call-records.md` (vCon, ES256 JWS). Retention and erasure are SDK/HTTP only.
- CLI: `mods/ctl/src/commands`. MCP: `mods/mcp/src/tools/index.ts`. Catalog: `ops/bundle/config/catalog.yaml`. Dashboard nav: `mods/dashboard/src/app/shell/nav.ts`.
- Twilio number linking: `sipnet:numbers:linkTwilioNumber`. Number import is not built.

## Don't
- Don't commit, push, or edit files outside `docs-site/` and `.claude/docs/`.
- Don't edit `legacy/` (except redirects as above), or the Self-hosting, Private regions or Hacking pages, unless your assignment says so.
- Don't document internals (NATS, Prisma, internal service names) or anything on the "never promised" list.
- Don't use em dashes in prose.

## Report back (under 300 words)
- Pages written, with paths
- Decisions you made
- Unverified claims and open questions for the owner
- Broken links that don't point to MENU paths
