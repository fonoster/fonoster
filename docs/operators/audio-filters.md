# Audio filters (noise suppression)

An app can list audio filters in its configuration (the `filters` column of the application,
`[{ name, options }]`). The gateway runs them on the caller's audio before speech recognition and
turn detection. One filter exists: **`aiCoustics`**, the ai-coustics Quail Voice Focus model, which
keeps the main speaker and suppresses noise and background voices. It runs in the gateway process
through the vendor's Node SDK, `@ai-coustics/aic-sdk` (0.24.0 in `package-lock.json`).

Filtering is fail-open. If a filter cannot be created, cannot start or fails mid-call, the call
keeps going with unfiltered audio and the call record gets a `filter.failed` event with the reason
(`mods/gateway/src/session/Call.ts`, `startFilters`; `mods/gateway/src/filters/createAudioFilterChain.ts`).

> **Status for this release: not usable from the published gateway image.** See "Known gaps"
> below. Every app that lists `aiCoustics` today gets unfiltered audio and a `filter.failed`
> event.

## What an app may set

Apps are untrusted input, so the gateway accepts only these options
(`aiCousticsPublicOptionsSchema` in `mods/gateway/src/filters/aiCoustics/createAiCousticsFilter.ts`).
Any other key is rejected and the filter is not built.

| Option | Default | Meaning |
| --- | --- | --- |
| `model` | `quail-vf-2.2-s-16khz` | Vendor model id (lowercase id format only) |
| `enhancementLevel` | `1` | 0 to 1. Higher values suppress more, competing speech included |
| `bypass` | `false` | Keeps the delay but stops enhancing (for A/B tests) |

```json
[{ "name": "aiCoustics", "options": { "enhancementLevel": 0.8 } }]
```

The server-side options (`modelDir` default `./models`, `modelFile`, `autoDownload` default
`true`, `licenseEnv` default `AIC_SDK_LICENSE`) cannot be set by an app. The gateway's own
`gateway.yaml` has no key for them either, so the defaults always apply (see "Known gaps").

## Turning it off

- **For one app:** remove `aiCoustics` from the app's `filters`, or set the list to empty. With no
  filters, no chain is created and the audio is passed through untouched.
- **For an A/B test:** set `bypass: true`. Timing stays the same and enhancement stops.
- **For the whole gateway:** don't set `AIC_SDK_LICENSE`. Every `aiCoustics` request then fails at
  creation, and its calls run unfiltered with a `filter.failed` event.

## Added delay

- The SDK processes fixed blocks. For `quail-vf-2.2-s-16khz` the optimal block is **240 samples
  (15 ms) at 16 kHz**. This was measured with SDK 0.24.0 (`Model.getOptimalBlockSize(16000)`) and
  it matches the vendor's model reference (<https://docs.ai-coustics.com/reference/sdk/models>).
- The gateway re-chunks its 20 ms frames into those blocks and primes the output with one block of
  silence, which adds 15 ms (`createAiCousticsFilter.ts`, `pendingOutput = new Float32Array(blockSize)`).
- The model adds its own algorithmic delay on top, which the SDK reports as
  `getAudioDelay()` (in samples). The gateway logs it at `verbose` as `delaySamples` in the
  "ai-coustics filter ready" line. **Not verified:** reading it needs a valid license key. The
  vendor publishes no per-model delay figure. The archived design estimated "about 30 ms" in total.

## CPU per call

- **Not measured in this repo.** The archived change estimated "roughly 1 ms of model time per
  20 ms frame per call" (`openspec/changes/archive/2026-10-17-voice-audio-filters/design.md`), but
  its measurement harness was not kept, and the load test (calls per core) is still open in the RC
  checklist. A gateway smoke run noted that no filter ran because aiCoustics is CPU-heavy
  (`openspec/changes/archive/2026-10-17-add-voice-session-gateway/build-log.md`).
- The vendor publishes no CPU figures and says to measure on your own hardware
  (<https://docs.ai-coustics.com/reference/concepts/performance>).
- The work runs on Node's libuv thread pool (`ProcessorAsync`). That pool has 4 threads by default
  and is shared with `fs`, `dns` and `crypto`. To run more filtered calls in parallel, raise
  `UV_THREADPOOL_SIZE` in the gateway's environment. The SDK README says this, and
  `AIC_NUM_THREADS` has no effect on these bindings. Size it from a load test.
- Model memory: the `-s` model file is 5.29 MB and is memory-mapped. Each call creates its own
  processor.

## The vendor's license check (it phones home)

- A license key is required. Get one at <https://developers.ai-coustics.com>. The gateway reads it
  from the `AIC_SDK_LICENSE` environment variable only, because `setAiCousticsLicense` is never
  called in the gateway. Keep the key in a secret. Apps never send it.
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
  - A missing key fails at creation (`createAiCousticsFilter` throws), so the call runs
    unfiltered.
  - A rejected or invalid key fails `ProcessorAsync.withConfig`. The chain disables the filter,
    so the call runs unfiltered. With SDK 0.24.0 and a malformed key, the error is "License key
    format is invalid or corrupted".
  - The vendor says processing can also be disabled mid-session after "sustained usage-reporting
    failure" (a network outage), with no documented grace period. **Not verified** which way that
    surfaces. If `process()` throws, the gateway disables the filter for the rest of the call and
    passes audio through. The binary also counts "audio that was bypassed … due to unauthorized
    usage", so the SDK may instead return the audio unenhanced without an error. Either way the
    call continues, but in the second case no `filter.failed` event is recorded.

## glibc only

- The SDK ships prebuilt binaries for linux-x64-gnu, linux-arm64-gnu, darwin-x64, darwin-arm64,
  win32-x64-msvc and win32-arm64-msvc (`optionalDependencies` in `package-lock.json`). No Node
  binary for musl exists. **Alpine images can't load it.** The vendor's musl archives (C SDK 0.25.0+)
  are static C libraries, not Node bindings.
- The gateway image is `node:22-slim` (Debian 12, glibc 2.36; `mods/gateway/Dockerfile`), which
  matches the glibc binaries.

## Known gaps (before this can be turned on)

1. **The SDK isn't in the gateway image.** `@ai-coustics/aic-sdk` is an optional dependency of
   `mods/apiserver` only. The gateway image installs only `@fonoster/gateway`'s dependencies, so
   `require` fails with "@ai-coustics/aic-sdk is not installed". This was checked in
   `fonoster/gateway:0.0.0-smoke`: `/work/node_modules/@ai-coustics` does not exist.
2. **The license key isn't passed in.** Neither `ops/bundle/compose.yaml` nor the Helm gateway
   template passes `AIC_SDK_LICENSE` to the gateway.
3. **No model in the image, and the auto-download can't write.** The default `modelDir` is
   `./models`, which is `/work/models`. `/work` is owned by root and the gateway runs as `appuser`,
   so `Model.download` cannot create that folder (checked: `mkdir /work/models` returns
   permission denied in the smoke image).
4. **No operator config.** `gateway.yaml` has no key for `modelDir`, `modelFile`, `autoDownload` or
   the license, and `Call.ts` builds the chain as untrusted. Operators therefore can't pin a model
   path or turn off downloading.
5. **Narrowband calls.** The default model is 16 kHz wideband. PSTN audio is G.711 upsampled, so
   the band above 4 kHz is empty. The archived design flags this to re-check per deployment.
