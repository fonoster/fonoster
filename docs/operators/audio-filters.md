# Audio filters (noise cancelling)

An app can list audio filters in its configuration (`filters: [{ name, options }]`, set through
the Applications API, the SDK, the CLI or the dashboard's *Noise cancelling* select). The
appbridge runs them on the caller's audio before speech recognition and turn detection. One filter
exists: **`aiCoustics`**, the ai-coustics Quail Voice Focus model, which keeps the main speaker and
suppresses noise and background voices. It runs in the AppBridge process through the vendor's Node
SDK, `@ai-coustics/aic-sdk` (0.24.0 in `package-lock.json`).

Filtering is fail-open. If a filter cannot be created, cannot start or fails mid-call, the call
keeps going with unfiltered audio and the call record gets a `filter.failed` event with the filter's
name and the reason (`mods/appbridge/src/session/Call.ts`, `startFilters`;
`mods/appbridge/src/filters/createAudioFilterChain.ts`). The record's `fonoster.filters.failed`
lists them and the dashboard shows an *Unfiltered* badge on the call.

> **Status: hidden until the SDK ships in the image.** The SDK is not in the published appbridge
> image yet (issue #969), so AppBridge registers `aiCoustics` only where `@ai-coustics/aic-sdk`
> is installed. Elsewhere it is not listed, and an app that names it gets unfiltered audio and a
> `filter.failed` event (unknown filter). See "Known gaps" below.

## The provider and its key

Noise cancelling is a catalog provider with the capability `nc`, backed by the built-in adapter
`aicoustics`. Register it like any other provider:

```sh
fonoster-registry add-provider aicoustics --adapter aicoustics --capabilities nc \
  --credential-ref aicoustics-default --label "ai-coustics"
```

The key resolves per session the way speech keys do (registry "Each layer resolves the credentials
of the providers it calls"):

1. the workspace's own key, added on the dashboard's Vendor keys page or with
   `fonoster providers:keys:set aicoustics`;
2. otherwise the platform key from the AppBridge config:

```yaml
providers:
  aicoustics:
    adapter: aicoustics
    capabilities: [nc]
    credential: { env: AIC_SDK_LICENSE } # or value: ...
```

Without either, the filter is not built: the call runs unfiltered and the record says
`no credential for provider aicoustics`. The filter never reads the key from the environment on its
own, and an app cannot pass one (`license` is refused as an option). Get a key at
<https://developers.ai-coustics.com>.

## What an app may set

Apps are untrusted input, so only these options are accepted, by the apiserver when the app is
saved and by AppBridge when the filter is built (`aiCousticsPublicOptionsSchema` in
`mods/common/src/filters/`). Any other key is rejected and the app is not saved.

| Option | Default | Meaning |
| --- | --- | --- |
| `model` | `quail-vf-2.2-s-16khz` | Vendor model id (lowercase id format only) |
| `enhancementLevel` | `1` | 0 to 1. Higher values suppress more, competing speech included |
| `bypass` | `false` | Keeps the delay but stops enhancing (for A/B tests) |

```json
[{ "name": "aiCoustics", "options": { "enhancementLevel": 0.8 } }]
```

The dashboard's select writes `[{ "name": "aiCoustics" }]`; `enhancementLevel` and `model` are
API, SDK and YAML options. The server-side options (`modelDir` default `./models`, `modelFile`,
`autoDownload` default `true`) cannot be set by an app, and the AppBridge YAML has no key for them
either, so the defaults always apply (see "Known gaps").

## Turning it off

- **For one app:** pick *None* in the dashboard, run
  `fonoster applications:update <ref> --noise-cancelling none`, or save an empty `filters` list.
  With no filters, no chain is created and the audio is passed through untouched.
- **For an A/B test:** set `bypass: true`. Timing stays the same and enhancement stops.
- **For the whole AppBridge:** remove the provider's platform credential and the workspace keys.
  Every `aiCoustics` request then fails at creation, and its calls run unfiltered with a
  `filter.failed` event.

## Added delay

- The SDK processes fixed blocks. For `quail-vf-2.2-s-16khz` the optimal block is **240 samples
  (15 ms) at 16 kHz**. This was measured with SDK 0.24.0 (`Model.getOptimalBlockSize(16000)`) and
  it matches the vendor's model reference (<https://docs.ai-coustics.com/reference/sdk/models>).
- AppBridge re-chunks its 20 ms frames into those blocks and primes the output with one block of
  silence, which adds 15 ms (`createAiCousticsFilter.ts`, `pendingOutput = new Float32Array(blockSize)`).
- The model adds its own algorithmic delay on top, which the SDK reports as
  `getAudioDelay()` (in samples). AppBridge logs it at `verbose` as `delaySamples` in the
  "ai-coustics filter ready" line. **Not verified:** reading it needs a valid license key. The
  vendor publishes no per-model delay figure. The archived design estimated "about 30 ms" in total.

## CPU per call

- The September 2026 smoke test measured roughly 1 ms of model time per 20 ms frame per call,
  about 5% of a core per filtered call (`openspec/changes/archive/2026-10-17-voice-audio-filters/design.md`).
  Nothing in this repo re-measures it; the chain logs each filter's p50/p95/max per call.
- The vendor publishes no CPU figures and says to measure on your own hardware
  (<https://docs.ai-coustics.com/reference/concepts/performance>).
- The work runs on Node's libuv thread pool (`ProcessorAsync`). That pool has 4 threads by default
  and is shared with `fs`, `dns` and `crypto`. The appbridge image sets `UV_THREADPOOL_SIZE=8`;
  raise it in the environment to run more filtered calls in parallel. The SDK README says this, and
  `AIC_NUM_THREADS` has no effect on these bindings.
- Model memory: the `-s` model file is 5.29 MB and is memory-mapped. Each call creates its own
  processor.

## The vendor's license check (it phones home)

- A license key is required (see "The provider and its key"). Keep the platform key in a secret;
  apps never send it.
- **Network is required at call time.** Self-service keys authorize online and report usage. The
  vendor says that downloading the model in advance does not remove that requirement
  (<https://docs.ai-coustics.com/tutorials/sdk-quickstart>,
  <https://docs.ai-coustics.com/reference/concepts/sdk-telemetry>). For fully offline operation,
  ask ai-coustics for an offline license.
- Hosts found in the SDK 0.24.0 binary (from `strings`; the vendor says its own list "is not an
  exhaustive hostname allowlist"):
  - `https://api.ai-coustics.io/v1/sdk`: authorization and usage metering.
  - `https://eu.posthog.com`: SDK error reports. Turn them off with `DO_NOT_TRACK=1`, which does
    not turn off authorization or metering.
  - `https://artifacts.ai-coustics.io/manifest.json` and `/models/...`: model download, used only
    when the model file is missing and `autoDownload` is on.
  - OpenTelemetry metrics export is off unless `AIC_SDK_OTEL_ENABLE=1`.
- The vendor's docs say what is sent: SDK and wrapper version, model id, OS and CPU architecture,
  session id, processed or disallowed audio duration, and error messages. No audio, transcripts or
  model features are sent (sdk-telemetry page).
- **What happens when the check fails:**
  - No credential for the provider: the filter is not built, so the call runs unfiltered and the
    record says so.
  - A rejected or invalid key fails `ProcessorAsync.withConfig`. The chain disables the filter,
    so the call runs unfiltered. With SDK 0.24.0 and a malformed key, the error is "License key
    format is invalid or corrupted", and that is what the call's *Unfiltered* badge shows.
  - The vendor says processing can also be disabled mid-session after "sustained usage-reporting
    failure" (a network outage), with no documented grace period. **Not verified** which way that
    surfaces. If `process()` throws, AppBridge disables the filter for the rest of the call,
    passes audio through and records `filter.failed`. The binary also counts "audio that was bypassed … due to unauthorized
    usage", so the SDK may instead return the audio unenhanced without an error. Either way the
    call continues, but in the second case no `filter.failed` event is recorded.

## glibc only

- The SDK ships prebuilt binaries for linux-x64-gnu, linux-arm64-gnu, darwin-x64, darwin-arm64,
  win32-x64-msvc and win32-arm64-msvc (`optionalDependencies` in `package-lock.json`). No Node
  binary for musl exists. **Alpine images can't load it.** The vendor's musl archives (C SDK 0.25.0+)
  are static C libraries, not Node bindings.
- The appbridge image is `node:22-slim` (Debian 12, glibc 2.36; `mods/appbridge/Dockerfile`), which
  matches the glibc binaries.

## Known gaps (before this can be turned on), tracked in #969

1. **The SDK isn't in the appbridge image.** `@ai-coustics/aic-sdk` is an optional dependency of
   `mods/apiserver` only. The appbridge image installs only `@fonoster/appbridge`'s dependencies, so
   `require` fails with "@ai-coustics/aic-sdk is not installed". This was checked in
   `fonoster/appbridge:0.0.0-smoke`: `/work/node_modules/@ai-coustics` does not exist.
2. **No model in the image, and the auto-download can't write.** The default `modelDir` is
   `./models`, which is `/work/models`. `/work` is owned by root and AppBridge runs as `appuser`,
   so `Model.download` cannot create that folder (checked: `mkdir /work/models` returns
   permission denied in the smoke image).
3. **No operator config for the model.** The AppBridge YAML has no key for `modelDir`, `modelFile`
   or `autoDownload`, so operators can't pin a model path or turn off downloading.
4. **Narrowband calls.** The default model is 16 kHz wideband. PSTN audio is G.711 upsampled, so
   the band above 4 kHz is empty. The archived design flags this to re-check per deployment.
