# Tasks

> Order follows the migration plan in design.md. Each step keeps `main` releasable.

## 1. Registry and shared filter schemas (mods/common)

- [x] 1.1 Add `nc` to `Capability` (`src/registry/types.ts`) and an entry in `FEATURES` (`src/registry/features.ts`)
- [x] 1.2 Add `aicoustics` to `BUILT_IN_ADAPTERS` (`src/registry/Registry.ts`); the CLI help lists `nc`
- [x] 1.3 Create `src/filters/`: `aiCousticsPublicOptionsSchema` (`model`, `enhancementLevel`, `bypass`), `FILTER_SCHEMAS` by filter name, `FILTER_BY_PROVIDER` (`aicoustics` → `aiCoustics`), and `parseFilters(input)` that rejects unknown names and non-public keys
- [x] 1.4 Proto: `message AudioFilter { name, options (Struct) }`; `repeated AudioFilter filters = 20` on `Application`, `CreateApplicationRequest`, `UpdateApplicationRequest`; regenerate stubs; `filters` on the Application types in `mods/types`
- [x] 1.5 Tests: registry accepts `--capabilities nc` and refuses an unknown capability; `parseFilters` accepts `{ name: "aiCoustics", options: { enhancementLevel: 0.8 } }` and rejects `modelFile`, `license` and `krisp`

## 2. Appbridge: key from the registry, mid-call failures recorded

- [x] 2.1 `configSchema.ts` / `config.ts`: provider `capabilities` enum accepts `nc`; `providers.aicoustics.credential` resolves like speech credentials
- [x] 2.2 `createAiCousticsFilter.ts`: take `license` as a trusted option; remove `licenseEnv`, `setAiCousticsLicense` and the `process.env` fallback; import the public schema from `mods/common`
- [x] 2.3 `AudioFilterFactory.createChainFromConfig(configs, { trustedOverlay })`: merge per-filter trusted options after parsing the public ones
- [x] 2.4 `Call.startFilters`: resolve the `aicoustics` credential for the session's workspace (workspace key, else platform key); build the chain with the overlay; with no credential record `filter.failed` with a reason naming the provider and continue
- [x] 2.5 `createAudioFilterChain`: `onDisabled(name, reason)` hook; `Call` records `filter.failed` from it once per slot
- [x] 2.6 `Dockerfile`: `ENV UV_THREADPOOL_SIZE=8`
- [x] 2.7 Tests (fake SDK): workspace key wins over platform key; platform key used when no workspace key; no credential → `filter.failed` and audio passes through; an option carrying `license` from the app is rejected; a filter that throws mid-call produces one `filter.failed` event with name and reason; the key never appears in logs or the record
- [x] 2.8 Conformance: `filter-configured` and `filter-unavailable` pass; add `filter-fails-mid-call`

## 3. Call record

- [x] 3.1 `mods/callrecord/src/vcon.ts`: `fonoster.filters.failed: [{ name, reason }]` from `filter.failed` events; `failures` unchanged
- [x] 3.2 Test: a record with one start-time and one mid-call failure lists both with reasons

## 4. Apiserver, SDK and CLI

- [x] 4.1 `applications/session/appModel.ts`: `filters` in `sessionAppInputSchema` through `parseFilters`; `toAppColumns` writes the column; absent keeps, empty clears (as `listeners`)
- [x] 4.2 Get and list return `filters`; `ListCatalog` accepts `type: "nc"`
- [x] 4.3 SDK `Applications`: `filters` on create, update and the returned app; docs comment with the ai-coustics example
- [x] 4.4 CLI: `--noise-cancelling none|aicoustics` on `applications:create` and `applications:update`; `NOISE CANCELLING` line on `applications:get`
- [x] 4.5 Tests: update with a public option round-trips; a server-side option and an unknown filter return `INVALID_ARGUMENT` and leave the app unchanged; empty list clears; CLI flag maps to the array

## 5. Dashboard

- [x] 5.1 `session/sdk-api.ts`: `filters` on `SessionApp`, `toSessionApp` and `toRequest`; remove `AUDIO_FILTERS` from `agents/catalog.ts`
- [x] 5.2 `agents/catalog.ts`: `ncProviders` from catalog items with `capabilities` including `nc`, by label
- [x] 5.3 `session/streams.tsx` `CallHandlingFields`: *Noise cancelling* select (None + usable `nc` providers; unavailable state for a saved filter whose provider is not usable); hint "Keeps one speaker. Not for speakerphone or IVR. Adds about 30 ms."
- [x] 5.4 `session/vendor-keys.tsx`: copy mentions noise cancelling; rows show the catalog label
- [x] 5.5 `session/calls.tsx` `CallRecordView`: *Unfiltered* badge with the reason from `fonoster.filters.failed`
- [x] 5.7 Agents: *Noise cancelling* panel on the Advanced tab (`agents/tabs/noise-cancelling-panel.tsx`) saving on change; the Call handling drawer hides the select; designs updated in `designs/dashboard.pen` (Agent / Detail / Advanced, Apps / Detail)
- [x] 5.6 Tests: select offers None only without an `nc` provider; picking ai-coustics saves `[{ name: "aiCoustics" }]`; None saves an empty list; unavailable state keeps the filter; the badge appears only with a failure

## 6. Docs

- [x] 6.1 `docs/operators/audio-filters.md`: provider registration, key sources, remove the env-only and `fonoster.yaml` notes, update the status note and known gaps
- [x] 6.2 `docs-site`: `telephony/noise-cancelling.mdx` plus the CLI, providers, vendor keys and self-hosting audio pages (what it does, one-speaker caveat, how to turn it on in Streams and agents, SDK and CLI examples, the Unfiltered badge)
- [ ] 6.3 Archive `openspec/changes/noise-cancelling-provider` after #969 verifies a filtered call on the published image
