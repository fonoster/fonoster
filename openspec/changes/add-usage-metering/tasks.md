# Tasks

> Order follows the migration plan in design.md: shared types, then the apiserver (accepts usage
> before anyone sends it), then the producers, then the API and the page. Each group keeps `main`
> releasable.

## 1. Meter registry and `usage.v1` (mods/common)

- [ ] 1.1 Add `src/usage/meters.ts`: the declared meters (name, unit, aggregation `sum` or `snapshot`, reporter, `vendor: boolean`), and `isMeter(name)`; verify a unit test lists exactly the twelve meters of the spec with their units
- [ ] 1.2 Add `src/usage/types.ts`: `UsageLine` (meter, quantity, provider?, model?, keySource?, estimated) and `UsageEvent` (line + owner/workspace/app/call/region/regionKind/origin/occurredAt/id) with Zod schemas that reject an undeclared meter, a `keySource` on a non-vendor meter, and any price-like field; verify with unit tests
- [ ] 1.3 Add `src/usage/usageId.ts` (D7) and `CallUsage` (accumulator keyed by meter, provider, model, keySource; ORs `estimated`; `lines()` rounds seconds up); verify tests: same inputs give the same id, merges add up, `estimated` survives a merge
- [ ] 1.4 Add `src/protos/usage.proto` (`service Usage`, `GetUsage`, D10) and regenerate stubs; verify the build and that `mods/types` exports the request/response types

## 2. Ledger and ingest (mods/apiserver)

- [ ] 2.1 Prisma `UsageEvent` and `UsageDaily` (D7) with migration `<ts>_usage_metering`; verify `prisma migrate dev` applies on an empty and on a current database
- [ ] 2.2 `src/usage/ingestUsage.ts`: insert with `ON CONFLICT DO NOTHING` and increment `usage_daily` only for inserted rows, in one transaction; owner resolved from the workspace; verify tests: duplicate ingest changes nothing, an undeclared meter is rejected and logged
- [ ] 2.3 `records/createIndexRecord.ts`: accept an optional `usage` on the index entry and ingest it in the same transaction as the index row; entries without `usage` keep working; region kind from the region; verify tests for both shapes and for a private region
- [ ] 2.4 `src/usage/runUsageConsumer.ts`: durable consumer `apiserver-usage` on `FONOSTER_USAGE` (`usage.>`, 7-day max age, D5); verify a test with the NATS test harness: messages published while the database is down are ingested once it is back
- [ ] 2.5 `fonoster-usage rebuild --from --to [--from-records]` bin (D7, Risks); verify a test: rebuilt `usage_daily` equals the pre-rebuild table, and `--from-records` restores lines from stored records
- [ ] 2.6 Nightly `storage.bytes` job (D8) on the apiserver scheduler; verify a test: two workspaces with indexed record sizes get one line each per day and a rerun the same day adds nothing

## 3. AppBridge counters (mods/appbridge)

- [ ] 3.1 `answeredAt` set with `answeredBy` (attach and outbound `call.answered`); `call.seconds` from it at `finish()`, none when unanswered; verify tests: 20 s ring + 65 s talk = 65, unanswered = no line, `durationSeconds` unchanged
- [ ] 3.2 STT, TTS and noise-cancelling counters (D3) with provider from the catalog id and `keySource` from `Catalog.usesWorkspaceKey`; verify tests with the fake provider: 3 s of frames = 3 `stt.seconds`, a 42-character `speak` = 42 `tts.characters`, a failed filter slot stops counting, a workspace key gives `keySource: workspace`
- [ ] 3.3 AMD and recording counters; verify tests: one classification of 4,000 ms = 1 detection and 4 `amd.seconds`; a recording stopped and restarted sums both spans
- [ ] 3.4 Origin (D9): `TestCallVerifier.check` returns `test`; `Call` carries `origin`; verify tests: a valid test token gives `browser_test`, no token gives `call`
- [ ] 3.5 `usage.report` handling: accepted only from `AUTOPILOT` apps and only for `llm.tokens.*` and `embedding.tokens`, merged into `CallUsage`; otherwise `error bad_message`; not in the public protocol docs; verify the three voice-session delta scenarios as tests
- [ ] 3.6 Write `CallUsage` into the working record every 60 s and at `finish()`; `callrecord` puts `usage` in the vCon and in `RecordIndexEntry` (signed); verify tests: the sealed record and index carry the lines, the signature covers them, a recovered seal keeps the last flush, a minimal record of a rejected call has no lines

## 4. Model usage (mods/community, mods/autopilot)

- [ ] 4.1 `community`: optional final `usage` chunk on `Think.stream` and usage on embeddings; OpenAI-compatible adapters send `stream_options.include_usage` and parse it; other adapters return none; verify adapter tests against recorded vendor responses
- [ ] 4.2 `LayeredCredentials.get` returns `{key, source}`; callers updated; verify tests: workspace key → `workspace`, platform → `platform`
- [ ] 4.3 Autopilot sends `usage.report` after each turn and for knowledge-base load and search, with the D6 estimate when the vendor reported nothing; verify tests with the fake LLM: reported tokens equal the fake's fixed counts; a vendor with no usage yields `estimated: true`
- [ ] 4.4 Eval path publishes `llm.tokens.*` with `origin: eval` to `usage.<ws>.<meter>` per step (agent and judge); verify a test: three scenarios produce eval lines only for token meters, with no call reference, and re-running the same eval run id adds nothing

## 5. Usage API and SDK

- [ ] 5.1 `Usage` service (`src/usage/createGetUsage.ts`, `buildService.ts`, registered in `core/services.ts`, not public): reads `usage_daily`, groups by the requested dimensions, `all_owned` checked against Identity; verify tests: grouping by meter + key source, `PERMISSION_DENIED` for another workspace, owner across two workspaces, no money fields
- [ ] 5.2 SDK `Usage.getUsage` with docs comment; verify an SDK unit test and the generated reference lists it

## 6. Dashboard Usage page

- [ ] 6.1 Design the Usage page in `designs/dashboard.pen` (period picker, minutes vs tests, add-on minutes, AI usage by provider and model with Your key / Fonoster key, estimated marker, empty state; settles the long-period open question); verify the owner approves the frames
- [ ] 6.2 `NAVIGATION` entry `Usage` (`/usage`) and screen; `useUsage` over `sdk.usage.getUsage`; components per the design; verify unit tests and an e2e test covering the dashboard delta scenarios (Community install with billing off, Last month, no usage, own vs Fonoster key, estimated)

## 7. Integration

- [ ] 7.1 Conformance scenario on the local stack: an Autopilot call on fake providers, one on a workspace key, and a browser test; assert exact usage lines in the sealed record, `usage_events` and `GetUsage`, and that replaying the record changes nothing; verify it passes in CI
- [ ] 7.2 Metering never blocks: stop Postgres during 10 fake calls, start it again; verify all calls completed and all usage lines arrive
- [ ] 7.3 `openspec validate add-usage-metering --strict` passes and docs mention the Usage page and `GetUsage`

## Workflow follow-up

- Archive the change after the owner's review, and sync the specs.
- Next changes in order: `remove-platform-key-fallback`, `add-stripe-fake`, `add-billing-service`.
