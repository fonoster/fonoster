# Design

## Context

See proposal.md for the motivation. What exists today, and shapes the approach:

- The appbridge builds the filter chain in `Call.startFilters` from `app.filters`
  (`mods/appbridge/src/session/Call.ts`) through `AudioFilterFactory.createChainFromConfig`,
  which parses each filter's options with its **public** schema (apps are untrusted input) and
  records `filter.failed` for slots that are disabled when `chain.ready()` resolves. A filter
  disabled later by the chain (`createAudioFilterChain.ts`, throw or wrong frame length) is only
  logged.
- `createAiCousticsFilter` reads the license from `process.env[licenseEnv]` or from a module
  variable set by `setAiCousticsLicense`, which nothing calls.
- Speech credentials are resolved per session by `Catalog.prepare(workspaceRef)` with a
  `chainKeySources` source (cell secret, then workspace key) and otherwise the platform key named
  by `credentialRef` (`mods/appbridge/src/speech/`). The registry's `Capability` type is
  `stt | tts | llm` and the appbridge config enums list `tts | stt`.
- The Applications API (`mods/common/src/protos/applications.proto`, field numbers up to 19)
  has no `filters`; the apiserver maps requests through `sessionAppInputSchema` and
  `toAppColumns` in `mods/apiserver/src/applications/session/appModel.ts`; the dashboard maps
  through `toSessionApp` and `toRequest` in `mods/dashboard/src/session/sdk-api.ts`.
- The call record's vCon carries `fonoster.failures: string[]` (event types) and
  `fonoster.recording.failed` (a reason). The dashboard call detail already prints each failure
  as a "Problem" line and reads the record through the SDK's `callRecords`.
- The catalog item for a provider already carries `capabilities` and `keyless` to the dashboard
  (`CatalogItem` in `mods/types`), and `ListCatalog` filters providers by `type` against
  `capabilities`.

## Goals / Non-Goals

**Goals:**
- No new mechanism: `nc` rides the registry, Vendor keys, `GetCapabilities`/`ListCatalog` and the
  key chain exactly as `stt` and `tts` do.
- The appbridge is the only process that ever holds the ai-coustics key; the apiserver validates
  filter options without the vendor SDK.
- Fail-open stays the only policy; the change makes failures visible, not configurable.

**Non-Goals:**
- Krisp, pricing, billing exclusions, key validation on save, CPU watchdog, load testing (decided
  2026-10-19, see proposal). Shipping the SDK and the model in the image (#969).

## Decisions

1. **The key is a trusted option on the filter, resolved by `Call`.**
   `Call.startFilters` resolves the credential for provider `aicoustics` through the same
   `Catalog`/key-source path the speech layer uses (workspace key, else the platform key named by
   `credentialRef`), then builds the chain with a per-call trusted overlay
   `{ aiCoustics: { license } }` that the factory merges after parsing the app's public options.
   The filter takes `license` as an option; the env fallback, `licenseEnv` and
   `setAiCousticsLicense` are removed. *Alternative:* keep `AIC_SDK_LICENSE` as a platform
   fallback. Rejected: two sources of truth for one key, and the registry's `credentialRef`
   already expresses the platform key; the appbridge YAML `providers.aicoustics.credential.env`
   keeps the env-var deployment style for operators who want it.
   The resolved key is never logged and never written to the record, as for speech keys.

2. **A chain callback reports mid-call disables.** `createAudioFilterChain` gains an
   `onDisabled(name, reason)` hook; `Call` records `filter.failed` from it, once per slot. The
   start-time path is unchanged. *Alternative:* poll `getStats()` at hangup. Rejected: loses the
   time of the failure in the record.

3. **Filter option validation lives in `mods/common`.** The public option schema of each filter
   (`aiCoustics`: `model` in the vendor's id shape, `enhancementLevel` 0..1, `bypass`) moves to
   `mods/common/src/filters/` and is imported by both the appbridge factory and the apiserver's
   `sessionAppInputSchema`. The apiserver rejects unknown filter names and any key outside the
   public schema with `INVALID_ARGUMENT`. *Alternative:* validate only in the appbridge.
   Rejected: a bad value would be accepted by the API and fail silently per call.

4. **Proto shape: `repeated AudioFilter filters = 20`** on `Application`, `CreateApplicationRequest`
   and `UpdateApplicationRequest`, with `message AudioFilter { string name = 1; google.protobuf.Struct options = 2; }`.
   Update semantics follow `listeners`: an absent field keeps the current value, an empty list
   clears it. The SDK and `@fonoster/types` expose `filters?: { name: string; options?: Record<string, unknown> }[]`.
   The CLI gets `--noise-cancelling none|aicoustics` on create and update (the array stays an
   SDK-level detail) and a `NOISE CANCELLING` line on get.

5. **The dashboard derives the select from the catalog, not from a constant.** `nc` providers come
   from `ListCatalog({ kind: "provider", type: "nc" })` (the handler already filters by
   `capabilities`; `type` widens to accept `nc`). The select maps `aicoustics` to the filter name
   `aiCoustics` through one table in `mods/common/src/filters/` (provider id to filter name), so a
   second provider later needs one row, not UI work. The stale `AUDIO_FILTERS` constant is removed.
   A saved filter whose provider is not usable is shown as unavailable and kept on save, like a
   saved voice (dashboard "Agent pickers offer the catalog").

6. **Reason on the record.** The vCon gains `fonoster.filters: { failed: [{ name, reason }] }`
   next to the existing `failures` list (which keeps the event type for compatibility). The call
   detail shows an *Unfiltered* badge from it. *Alternative:* put the reason in `failures`.
   Rejected: `failures` is a list of event types consumed as such.

7. **`UV_THREADPOOL_SIZE=8`** as an `ENV` in `mods/appbridge/Dockerfile`, overridable. No
   measurement: the pool is shared with fs and dns and the SDK README says to raise it; 8 is
   enough for any load we will see before #969's verification call.

## Risks / Trade-offs

- [A bad workspace key is only discovered on the first call] → the *Unfiltered* badge and the
  reason on the call detail; the Vendor keys row keeps showing the key as in use. Accepted
  (decided: no validation on save).
- [Voice Focus keeps one speaker; speakerphone, IVR and hold music degrade] → one-line hint under
  the select; `enhancementLevel` stays adjustable through the API.
- [The apiserver and appbridge disagree on options after an SDK upgrade] → one schema in
  `mods/common` consumed by both.
- [`type: "nc"` on `ListCatalog` reaches older dashboards] → they ignore unknown provider
  capabilities today (`capabilities` is a string array).
- [The filter still cannot run in the published image until #969 lands] → the select shows
  *None* only until the operator registers the provider; nothing in this change depends on the
  image.

## Migration Plan

1. Land `mods/common` (capability, adapter, filter schemas) and the proto; regenerate stubs.
2. Land the appbridge change; it is backward compatible (apps from YAML or rows keep working, the
   key now comes from the registry or `providers.aicoustics.credential`).
3. Land the apiserver, SDK, CLI and dashboard.
4. Operators: `fonoster-registry add-provider aicoustics --adapter aicoustics --capabilities nc --credential-ref aicoustics-default`
   and put the key in the platform credentials; `AIC_SDK_LICENSE` alone no longer works.
   Rollback is removing the provider: apps keep their `filters` and fail open.
