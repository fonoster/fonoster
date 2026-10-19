# Proposal

## Why

Background TV, radio and other voices get transcribed and make Autopilot agents misfire. The
appbridge has carried a working, fail-open audio filter chain with the ai-coustics Voice Focus
filter since 0.26 (`mods/appbridge/src/filters/`), and the Application table has a `filters`
column, but nothing above the engine exposes it: `filters` is not in the Applications API, SDK,
CLI or dashboard, the license is a process environment variable read inside the filter rather
than a provider credential, and a filter failure is recorded only at call start and shown to
nobody. This change is the product layer for GitHub issue #1010; shipping the SDK and the model
in the appbridge image is its prerequisite (#969).

## What Changes

- **Noise cancelling is a provider capability.** The registry gains the capability `nc` and the
  built-in adapter `aicoustics`. An operator registers it like any other provider
  (`add-provider aicoustics --adapter aicoustics --capabilities nc --credential-ref ...`).
  Fonoster Cloud registers it with a platform key; a workspace may store its own key, which wins
  (same rule as STT and TTS). The usability rule applies unchanged: the provider is offered only
  when a credential is available to the workspace.
- **The gateway resolves the filter's credential from the registry**, once at session start,
  through the same key chain it uses for speech providers. The filter no longer reads the key
  from the process environment, and the dead `setAiCousticsLicense` path and its misleading error
  text go away.
- **`filters` becomes part of the Applications API.** The existing `filters: [{ name, options? }]`
  array is readable and writable on an Application through gRPC, the SDK and the CLI, validated
  against the filter's public option schema (`model`, `enhancementLevel`, `bypass`; nothing
  else).
- **One select in the dashboard.** Call handling, shared by the Streams drawer and the Autopilot
  agent's Advanced tab, gains **Noise cancelling: None | ai-coustics**. Options come from the
  catalog's usable `nc` providers, so an install without the provider shows None only. No
  strength control; `enhancementLevel` stays an API and YAML option. The Vendor keys page lists
  the provider by label and its copy covers noise cancelling.
- **Fail-open becomes visible.** A filter that is disabled mid-call is recorded as
  `filter.failed` like a start-time failure, and the call detail shows an *Unfiltered* badge when
  the record holds one.
- **Packaging.** `UV_THREADPOOL_SIZE=8` in the appbridge image, the conformance suite run with
  the filter on, operator and user docs updated.

Decided out of scope (2026-10-19): Krisp, pricing and billing of filtered minutes, key
validation on save, a CPU watchdog, per-core capacity planning and load testing, a webhook event
for filter failures.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `provider-registry`: `nc` joins the capabilities a provider may serve; the gateway resolves
  credentials for noise-cancelling providers as it does for speech providers; the `aicoustics`
  adapter is built in.
- `voice-session`: the app model's `filters` list is exposed and validated through the
  Applications API; the filter's credential comes from the registry; mid-call filter failures
  are recorded, not only start-time ones.
- `dashboard`: Call handling offers a Noise cancelling select fed by the catalog; the Vendor keys
  page offers `nc` providers; the call detail shows an *Unfiltered* badge for `filter.failed`.

## Impact

- `mods/common`: `registry/types.ts` (`Capability`), `registry/Registry.ts` (`BUILT_IN_ADAPTERS`),
  `registry/features.ts`, `protos/applications.proto` (new `filters` field on `Application`,
  `CreateApplicationRequest`, `UpdateApplicationRequest`).
- `mods/appbridge`: `configSchema.ts` and `config.ts` provider enums; `speech/Catalog.ts` and
  `speech/keySources.ts` reused for `nc`; `session/Call.ts` (`startFilters` passes the resolved
  key, records mid-call disables); `filters/aiCoustics/createAiCousticsFilter.ts` (key as an
  option, env fallback removed); `Dockerfile` (`UV_THREADPOOL_SIZE`).
- `mods/apiserver`: Applications create, update and get handlers and the Prisma mapping of
  `filters`; option validation shared with the appbridge's public schema.
- `mods/sdk`, `mods/ctl`: `filters` on Applications.
- `mods/dashboard`: `session/streams.tsx` (`CallHandlingFields`), `session/sdk-api.ts`,
  `session/vendor-keys.tsx`, `agents/catalog.ts`, call detail.
- `mods/conformance`: the `filter-configured` and `filter-unavailable` scenarios run against the
  built image.
- Docs: `docs/operators/audio-filters.md`, a user page in `docs-site`.
- Depends on #969 for the SDK and model in the published appbridge image. No breaking changes:
  `filters` was already accepted from YAML apps and database rows.
