amd
=================

Standalone Answering Machine Detection sidecar for Fonoster. Runs an ONNX
whisper-tiny classifier over the leading audio of an outbound call and
reports the verdict onto the same `AMDSTATUS`/`AMDCAUSE` Asterisk channel
variables that Asterisk's own native `AMD()` application sets — so nothing
downstream (`apiserver`'s `createCreateVoiceClient.ts` / `mapAsteriskAmd.ts`)
needs to change to consume it.

It runs as its own process/container, decoupled from `apiserver` and
`autopilot`, and can be built, tested, and smoke-tested against a bare
Asterisk box with no other part of the Fonoster stack running.

## How it works

1. The dialplan (see `asterisk/config/extensions.conf`'s `AMD_ENGINE` gate)
   calls `AGI(agi://amd:4573,${AMD_MODE})`, which blocks the channel.
   The argument is the mode feature flag — see below.
2. Inside that AGI session, this service mints a UUID and runs
   `EXEC AudioSocket <uuid>,<host>:<port>`, which blocks until the AudioSocket
   side (a second listener in this same process) closes the connection.
3. The AudioSocket side buffers a few seconds of PCM and classifies it with
   the bundled ONNX model — always the classifier's own five-way status
   (HUMAN/MACHINE/VOICEMAIL/IVR/UNKNOWN) plus confidence, detector, and
   latency; nothing is thrown away yet — then hangs up, which unblocks the
   AGI session.
4. The AGI session maps that raw result to channel variables according to
   the requested mode (see below), issues one `SET VARIABLE` per variable
   over the same AGI connection, then closes the connection — which is what
   tells Asterisk's `AGI()` app to resume the dialplan into
   `Stasis(mediacontroller)`, exactly as it does today.

Every step is fail-open: a missing/corrupt model, a hung inference, a
timeout, or empty audio all resolve to an "unknown" result with a diagnostic
cause (`ML-TIMEOUT`, `ML-ERROR`, `ML-NO-AUDIO`) rather than stalling or
dropping the call.

## Modes: compact vs. full

The mode is a feature flag passed as the AGI call's first dialplan argument
(`agi_arg_1` on the wire) — not an env var, since it's a per-call decision
made in the dialplan, mirroring how `AMD_ENGINE` is already threaded through
as a channel variable.

- **`compact`** (the default — anything other than the literal `full`,
  including no argument at all, falls back to this): collapses the
  classifier's five-way status onto the same four-value `AMDSTATUS`
  vocabulary Asterisk's native `AMD()` uses (`HUMAN`/`MACHINE`/`NOTSURE`),
  with `VOICEMAIL`/`IVR` folded into `MACHINE` and a descriptive `AMDCAUSE`
  (e.g. `MACHINE-VOICEMAIL`). Confidence below `AMD_MIN_CONFIDENCE`
  is downgraded to `NOTSURE`/`ML-LOW-CONFIDENCE`. Only ever sets
  `AMDSTATUS`/`AMDCAUSE` — a consumer built against native AMD() sees no
  difference switching engines.
- **`full`**: sets `AMDSTATUS` to the classifier's own status
  (`HUMAN`/`MACHINE`/`VOICEMAIL`/`IVR`/`UNKNOWN`, untouched by any
  confidence threshold — the consumer applies its own policy), plus
  `AMDCONFIDENCE` (0–1), `AMDDETECTOR` (model name), and `AMDLATENCYMS`.

Set it from the dialplan by giving `AMD_MODE` a value before the `AGI()`
call — apiserver already does this for API-originated calls via
`amd.mode` in `fonoster.yaml` (see below).

## Configuration

The sidecar reads these from its container environment only; it never loads a
`.env` file, in development either. Set them in the container's environment
(Compose `environment:`, a Kubernetes `env:`), or export them before
`npm run start:dev`.

| env | default | meaning |
|---|---|---|
| `AMD_AGI_PORT` | `4573` | FastAGI listener port |
| `AMD_AUDIOSOCKET_PORT` | `9092` | AudioSocket listener port |
| `AMD_AUDIOSOCKET_BIND_ADDR` | `0.0.0.0` | AudioSocket listener bind address |
| `AMD_AUDIOSOCKET_ADVERTISE_HOST` | `amd` | host Asterisk is told to connect to for the AudioSocket leg — must be reachable *from* Asterisk |
| `AMD_PROBE_MS` | `3000` | leading audio to gather before classifying |
| `AMD_TIMEOUT_MS` | `4000` | hard deadline for the whole AGI session |
| `AMD_MIN_CONFIDENCE` | `0.8` | compact mode only: verdicts below this are reported as `NOTSURE` |
| `AMD_MODEL_PATH` | *(bundled)* | override the model directory |

## Enabling it end-to-end

Set `amd.enabled: true` and `amd.engine: ml` in the API server's
`config/fonoster.yaml`. With the engine unset or set to anything but `ml`,
behavior is unchanged from Asterisk's native `AMD()`. Additionally set
`amd.mode: full` to opt into the richer variable set — omit it (or leave it
`compact`) to stay native-AMD-compatible.

## Regression corpus

`test/fixtures/regression/` is a permanently-stored, correctly-licensed
corpus of 21 audio clips (each 5s or longer) covering all four classifier
labels — 11 human (10 real conversational clips from PolyAI/MINDS-14, CC BY
4.0, plus one scripted-narration edge case), 3 voicemail and 1 answering-
machine clip (real, CC0, from Freesound), and 2 answering-machine + 4 IVR
clips synthesized in-house (no real-world recording with a clean license
turned up for those two categories). `manifest.json` pins each clip's
*current* classifier output (`knownStatus`/`knownConfidence`), which
`test/amd/regression.test.ts` asserts against on every run — the goal is
catching a silent behavior change (model swap, feature-extractor edit,
dependency bump) rather than measuring accuracy. Where the pinned baseline
disagrees with the file's real-world label (`groundTruthLabel`), that's a
documented known accuracy gap, not a test bug — see each entry's `note`; a
few exist on purpose, to track known confusions (e.g. formal/synthesized IVR
scripts reading as MACHINE) rather than hide them.
Licensing and attribution for every third-party clip is in
`test/fixtures/regression/ATTRIBUTION.md`.

## Automated verification

`test/agiAudiosocket.integration.test.ts` starts the real AGI and AudioSocket
listeners in-process, plays both sides of Asterisk's role over raw TCP (the
FastAGI header handshake with `agi_arg_1` set, `EXEC AudioSocket`, streaming
real fixture PCM frame-by-frame, then reading back whatever `SET VARIABLE`
commands the server issues), and asserts the values that arrive over that
wire match calling the classifier directly on the same audio — for both
compact (default) and full mode, plus a case confirming an unrecognized mode
argument falls back to compact. This is the primary proof that the
AGI+AudioSocket mechanism and the mode flag work end-to-end; run it with:

```sh
npm run integration
```

## Status after the rebuild

Asterisk is retired (cleanbreak CB-B6), so the AGI and AudioSocket front end has no caller and its
Asterisk smoke test is gone. The classifier stays: it moves behind a voice-worker listener in
`add-roomr` task 4.3.

## Development

```sh
npm run start:dev -w @fonoster/amd
```
