# Design

## Where the verdict is produced

`AMD()` is a dialplan application — ARI offers no way to run it on a channel already in Stasis
except `continueInDialplan`, which would mean leaving and re-entering Stasis. Running it *before*
`Stasis()` is both simpler and better: the verdict is already on the channel by the time the
apiserver sees the call.

```
runCallManager  ari.channels.originate({context: "local-ctx-common", extension: "start", variables: {AMD_ENABLED, ...}})
  -> far end answers -> dialplan [local-ctx-common]
       ... APP_REF / INGRESS_NUMBER / CALL_DIRECTION / CALL_REF / TIMEOUT / MixMonitor
       GotoIf($["${AMD_ENABLED}" != "true"]?stasis)
       TryExec(AMD())            <-- blocks here until it decides; sets AMDSTATUS / AMDCAUSE
       (stasis) Stasis(mediacontroller)
  -> VoiceDispatcher.handleStasisStart
     -> createCreateVoiceClient  <-- reads AMDSTATUS / AMDCAUSE alongside the other channel vars
     -> VoiceClientImpl.connect()
```

This means there is **no probe, no audio buffering, no deadline, and no timeout handling in Node**.
`createCreateVoiceClient` already builds the session config from dialplan-set channel variables via
`createGetChannelVarWithoutThrow`; AMD is two more reads and a pure mapping function.
`VoiceClientImpl` is untouched.

## Why this is safe to ship as one dialplan change

The two new priorities are appended after `MixMonitor` (priority 11), so the existing numeric
`GotoIf` targets (`?4 ?6 ?8 ?10`) are all before the insertion point and keep their meaning. The
new jump uses a named `(stasis)` label rather than a number, so it does not add another positional
dependency.

`MixMonitor` deliberately stays *before* `AMD()` so the greeting is captured on the recording —
that WAV, paired with `AMDCAUSE`, is how you tune the thresholds.

`TryExec`, not a bare `Exec`: if `app_amd` is not loaded — a custom image, a trimmed build, a
`modules.conf` with `autoload = no` — a bare `AMD()` terminates the extension and hangs the call up
*before* `Stasis()`, so every outbound call would die the moment the feature is switched on.
`TryExec` sets `TRYSTATUS=NOAPP` and falls through instead. Verified both ways in a container: with
`app_amd` unloaded the call reaches the `stasis` label with `TRYSTATUS=NOAPP`; with it loaded the
verdict is produced normally and `TRYSTATUS=SUCCESS`.

## Outbound only

`AMD_ENABLED` is set only by `runCallManager` at originate time and is never read from a SIP
header, so an inbound call can never set it. The gate therefore doubles as the outbound-only
guard, with no need to re-test `CALL_DIRECTION` in the dialplan.

This matters because at `[local-ctx-common]` an inbound channel has **not** been answered —
`Answer()` is a verb the application issues later — so `AMD()` would have no audio to analyse.

`createCreateVoiceClient` enforces the same scope on its side: it only reads `AMDSTATUS` when the
call direction is `TO_PSTN`. Reading an unset channel variable costs an ARI round-trip that 404s,
and the StasisStart path is already sequential, so there is no reason to pay it on inbound traffic
for a verdict that can never be there.

## Fail-open contract

There is nothing to fail open *from* in Node: `mapAsteriskAmd` is a pure function over a string and
`createGetChannelVarWithoutThrow` already swallows a missing variable. Every path that is not a
recognised `AMDSTATUS` yields `undefined`, and the call is dispatched exactly as it is today.

`AMD()` itself is bounded by `total_analysis_time`; on expiry it reports `NOTSURE`, which maps to
`UNKNOWN`. Verified in a live container: a silent channel yields `NOTSURE` / `TOOLONG-3900` after
4 s, confirming `amd.conf` is honoured.

## Contract shape

Identical to PR #889 (`Amd` message, field 12, the same enum numbering), so that PR rebases onto
this one as a no-op and reduces to swapping the detector behind the same contract.

`Amd` is a message rather than a bare enum so confidence/detector/latency travel with the verdict.
Enum value names are used verbatim as the hand-written TS enum's string values so the object
round-trips through `@grpc/proto-loader` (`enums: String`). Because the loader also uses
`defaults: false`, an unset `amd` reaches the application as **`undefined`**, not
`AMD_STATUS_UNSPECIFIED` — applications must null-check.

### Detector-specific semantics

- **`confidence`.** `app_amd` is a deterministic heuristic and reports no probability. We report
  `1` on `HUMAN`/`MACHINE` and `0` on `UNKNOWN`, so a consumer gating on a threshold (as it would
  against a model-based detector) keeps working unchanged. It is not a probability.
- **`detector`.** `"asterisk-amd@1"`, so a consumer can tell this verdict apart from a future
  model-based one.
- **`latency_ms`.** `0`. `app_amd` reports no elapsed time and the dialplan has no millisecond
  clock, so it is left unmeasured rather than estimated.
- **`VOICEMAIL` / `IVR` are never emitted.** `app_amd` cannot distinguish a voicemail greeting or
  an IVR menu from a generic answering machine. Consumers must read `MACHINE` as "machine, possibly
  voicemail". The values stay in the contract for the model-based detector.

## CDR persistence

`AMDCAUSE` (e.g. `INITIALSILENCE-2500-2500`) says which threshold fired and is the main lever for
tuning, but it is detector-specific and does not belong on the session contract. It rides to the
CDR instead.

The voice path and the CDR writer share one Node process, so a process-local `amdResultCache`
(`createPerCallCache`, the same mechanism `createInfluxDbPub` already uses for `refByCallId`)
carries the verdict keyed by `callRef`. `createInfluxDbPub` reads it once the `ref` tag is resolved
and adds `amdStatus` / `amdConfidence` / `amdDetector` / `amdLatencyMs` / `amdCause` to the terminal
point, which pivot-merge into the existing CDR record. For outbound (API-originated) calls
`callRef` equals the CDR `ref` tag, so the lookup is direct.

**Known limitation with more than one apiserver replica.** `watchNats` subscribes to `routr.call.*`
with no queue group, so every replica writes a point for the same terminal event, and points carry
no explicit timestamp. The row multiplicity predates this change, but AMD is the first field whose
value depends on *which* replica wrote the row: only the replica that handled Stasis for that call
holds the verdict, so a pivot returns one row with `amdStatus`/`amdCause` and N−1 without. Single
replica is unaffected. Filter on `exists r.amdStatus` when analysing, and fixing the multiplicity
(a queue group, or an explicit per-event timestamp) is its own change.

## Configuration

| where | setting | default | meaning |
|---|---|---|---|
| apiserver env | `APISERVER_AMD_ENABLED` | `false` | master switch |
| `amd.conf` | `total_analysis_time` | `4000` | hard cap ⇒ `NOTSURE`; bounds the dispatch delay |
| `amd.conf` | `initial_silence` | `2500` | silence before the greeting ⇒ `MACHINE` |
| `amd.conf` | `after_greeting_silence` | `800` | silence after the greeting ⇒ `HUMAN` |
| `amd.conf` | `greeting` | `1500` | greeting longer than this ⇒ `MACHINE` |

Thresholds live on the media server rather than in apiserver envs so there is exactly one place to
look when a verdict is wrong. Tuning means editing `amd.conf` and re-releasing the Asterisk image;
`app_amd` supports `module reload app_amd`, and an operator can bind-mount their own
`/etc/asterisk/amd.conf` in the meantime.

**Before any downstream "enforce" behaviour**, validate against real recordings (the `MixMonitor`
WAVs) for Spanish / 8 kHz-telephony robustness, and adjust `initial_silence` / `greeting` from the
observed `AMDCAUSE` values rather than by guesswork.
