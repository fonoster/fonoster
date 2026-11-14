# perf

AppBridge's benchmark definitions for [perfkit](https://github.com/fonoster/perfkit) v0.1.12.
perfkit runs AppBridge on one server and SIPp on another, then writes a `report.json` with each
benchmark's verdict. AppBridge gets 2 vCPUs of its own. Around it on the same server run a
pinned Roomr node that takes the calls, NATS, and a small app that answers every call with a
speech turn loop and serves the fake TTS and STT AppBridge calls. None of them is under test.

`mods/appbridge/scripts/scale.ts` stays the tool for audio: it counts dropped frames both ways,
speak → `output.started` latency and event-loop delay, with in-process fakes on one machine.
These benchmarks measure call setup, failed calls and memory through real SIP and RTP, and are
comparable across releases.

## The benchmarks

| Id | Kind | What it measures | Passes when |
| --- | --- | --- | --- |
| `speech-turns` | capacity | Speech calls/s at a 30 s hold. Every call runs the turn loop below, so about 30 times the rate is talking at once. SIPp adds 1 call/s every 3 minutes, from 1 to 20. | Each step's p99 INVITE-to-200 stays under 200 ms and failed calls under 0.1%. The limit is the last step that passed. |
| `speech-soak` | soak | About 100 concurrent speech calls for six hours (1.67 calls/s, 60 s each). | After a 30-minute warm-up, AppBridge's memory grows less than 5 MB/h, under 0.1% of calls fail, and AppBridge never restarts. |

`perfkit.smoke.yaml` runs the same benchmarks, shortened: the ramp stops at 3 calls/s, and the
soak holds about 30 calls for 5 minutes after a 5-minute warm-up, with a memory limit of
200 MB/h instead of 5: over 5 minutes, garbage-collector noise alone measures tens of MB/h, so
only runaway growth fails it. It checks the harness, not AppBridge's limits or leaks.

### The turn loop

1. SIPp sends INVITE with a PCMU offer to Roomr, which opens a session to AppBridge, which dials
   the app over the fonoster protocol (`docs/session-protocol.md`).
2. SIPp streams looped PCMU silence for the whole hold, then sends BYE.
3. The app answers `session.start` with a `speak`, and speaks again on each `turn.ended` once
   the line before it is done (`output.done`).
4. The fake STT sends a final transcript every 4 s of caller audio; AppBridge's turn detector
   ends the turn about 600 ms later, over the silence.

The app hangs up, so AppBridge sends BYE early and SIPp counts the call as failed, on any of:

- an `error` event;
- two caller-audio frames (AppBridge forwards one per 20 ms) more than 200 ms apart: the main
  sign of a lagging AppBridge event loop;
- `output.started` more than 200 ms after a `speak` on an empty queue;
- no `turn.ended` within 10 s of `output.done`: a stuck call, not a capacity signal.

The thresholds are environment variables of the `app` service in `compose.yaml`
(`CALLER_AUDIO_GAP_MAX_MS`, `SPEAK_START_MAX_MS`, `TURN_TIMEOUT_MS`, `STT_FINAL_EVERY_MS`).

### What the limit means

The limit is the largest load at which no call saw a caller-audio stall over 200 ms, a speak
start over 200 ms or a stuck turn, and p99 INVITE-to-200 stayed under 200 ms. It is not the
conformance T2 verdict, which asks for zero dropped frames both ways.

Not measured, so the limit is not production capacity:

- outbound audio: the app can't see AppBridge's RTP to Roomr, and `output.done` stays on time
  after a stall (`session/OutputQueue.ts`);
- dropped frames (`scale.ts` measures audio);
- call records, webhooks, the database app store, workspace keys, recording, AMD and audio
  filters, none of which is configured (`appbridge.yaml`).

## Map

| Path | What it is |
| --- | --- |
| `perfkit.yaml` | The full run: the project, the servers, the image and both benchmarks (`apiVersion: perfkit/v1`). |
| `perfkit.smoke.yaml` | The same benchmarks, shortened, to check the harness in about 30 minutes. |
| `compose.yaml` | What runs on the server under test, all with host networking, each on its own cores of a `c-16`: `appbridge` on 0 and 1, `roomr` on 2 to 5, `nats` on 6, `app` on 7 to 11. |
| `appbridge.yaml` | AppBridge's config: the speech path only, the keyless `fake` provider pointed at the app, and one app with no numbers, so it takes every call. AppBridge has no healthcheck in its image; the compose file adds one on its session port, 50071. |
| `roomr.yaml` | The Roomr node's config: `sessionEndpoint` is AppBridge, and its RTP ports (10000 to 30000) stay below AppBridge's (ephemeral, from 32768). `${PERFKIT_UUT_IP}` is expanded by the node. `maxRooms` is high so the ramp, not the room cap, finds the limit. |
| `app/src/app.ts` | The app's entry. It forks one `node:cluster` worker per core of its cpuset; the workers share the three ports, so the app stays far from its cores' limit. |
| `app/src/session.ts` | The turn loop and the hang-up rules above. It logs one JSON line per call (`event: call`, its speak → `output.started` latencies and largest caller-audio gap) and one per hang-up (`event: hangup`, with the reason). On SIGTERM the app prints `event: summary` with their p50, p95, p99 and max over every call. |
| `app/src/tts.ts`, `app/src/stt.ts` | The fake TTS (`POST /v1/synthesize`, `GET /healthz` on 7001) and STT (`WS /v1/listen` on 7002) of the fake provider protocol (`mods/conformance/PROVIDERS.md`), copied, not imported, from `mods/conformance`. |
| `app/package.json`, `app/package-lock.json` | Its one dependency, `ws`, pinned. The stock `node:24-slim` image copies the app to `/work` and installs it there when the container starts, so nothing is written into `perf/`. Node 24 runs the TypeScript directly. |
| `speech-turns/uac_invite.xml`, `speech-soak/uac_invite.xml` | SIPp caller: INVITE with a PCMU offer, 200, ACK, PCMU RTP (`rtp_stream`, looped silence) for the hold, BYE, 200. A BYE from AppBridge before the hold ends fails the call. |
| `audio/silence.ulaw` | One second of PCMU silence (8000 bytes of `0xFF`), raw, as SIPp's `rtp_stream` reads it. |
| `runs/` | Published runs, added by the workflow's pull requests. |

The compose file reads the variables perfkit sets on the server under test:
`PERFKIT_IMAGE_APPBRIDGE` (pinned by digest) and `PERFKIT_UUT_IP`.

Roomr is pinned by digest in `compose.yaml`, never under `images:`, because perfkit tags every
`images:` entry with `--target-version`. The pin is the one in `ops/bundle/compose.yaml` and
moves with it. Roomr 0.4.0 shipped with v0.43.0, so that is the oldest release these
benchmarks can run.

## Read a limit

`series.steps[]` in `report.json` has each step's `uutCpuPct`, the sum of every process on the
server. Each one's own CPU is in `resources.processes[]`:

- `appbridge` near 100% of one vCPU at the limit step: its event loop is the limit (Node runs
  one, so a second vCPU only helps its thread pool and garbage collector).
- `roomr` or `app` near the limit of their cores: the limit is theirs, not AppBridge's.

The app's log (`docker logs` of the `app` service) says why calls failed: count the `hangup`
lines by `reason`.

## Run it on your machine

You need Node 22 or later, Docker with host networking (Docker Desktop: Settings → Resources →
Network → Enable host networking), at least 12 CPUs in Docker (the cpusets go up to 11), and
nothing else on ports 5060, 5080, 7001, 7002, 7080, 8787, 14222, 50061 or 50071, or on UDP
10000 to 30000. The dev container's stack holds some of them; stop it first. From the
repository root:

```sh
npx -y npm@11 exec --yes --package=github:fonoster/perfkit#v0.1.12 -- perfkit run --local \
  --config perf/perfkit.smoke.yaml --target-version 0.57.0 --commit "$(git rev-list -n1 v0.57.0)"
```

`npx -y npm@11` is there because Node 22 ships npm 10, which can't install perfkit from a git
tag. The run takes about 30 minutes on Apple silicon (SIPp is amd64 only and runs emulated).
It exits 0 when every benchmark passed and 1 when one didn't, and writes
`.perfkit/<run id>/report.json`. Running on your machine checks the harness: it can't pin real
cores, so its numbers aren't AppBridge's limits. Add `--out <dir>` to write the run elsewhere.

To watch it live, follow perfkit's README, "Watch a local run live": render a site with
`perfkit render --config perf/perfkit.smoke.yaml --out <dir>`, serve it with
`perfkit serve --site <dir> --port 8090`, and open
`http://localhost:8090/?live=http://localhost:8787/live.json`.

## Run it from GitHub

Actions → **Benchmarks** → Run workflow (`.github/workflows/benchmarks.yaml`):

| Input | Meaning |
| --- | --- |
| `target-version` | The AppBridge release to benchmark, like `0.57.0`. The run stops before creating any server when the tag `v0.57.0` or the image `fonoster/appbridge:0.57.0` doesn't exist. |
| `config` | `perf/perfkit.smoke.yaml` (the default) takes about 40 minutes; `perf/perfkit.yaml` takes about 8 hours. |
| `benchmarks` | Ids, comma-separated, like `speech-soak`; empty runs both. |

perfkit creates a `c-16` server for AppBridge and the rest, and a `c-8` load generator, and
deletes both on every exit path. Both bill by the hour while they exist.

A scheduled sweep every 6 hours deletes droplets a cancelled run left behind.
`perfkit sweep` deletes every perfkit droplet in the DigitalOcean account, including roomr's and
routr's runs, so it only deletes those older than 11 hours, longer than any of their runs.

The workflow reads two repository secrets, `DIGITALOCEAN_TOKEN` and `PERFKIT_SSH_KEY` (the same
values as in fonoster/roomr and fonoster/routr). Until `DIGITALOCEAN_TOKEN` exists, the sweep
prints a notice and does nothing.

| Secret | What it is |
| --- | --- |
| `DIGITALOCEAN_TOKEN` | A DigitalOcean token with custom scopes: `droplet`, `vpc`, `firewall` and `ssh_key`, each `create`, `read` and `delete` (perfkit's README lists them). |
| `PERFKIT_SSH_KEY` | An ed25519 private key without a passphrase (`ssh-keygen -t ed25519 -N "" -f perfkit`). perfkit registers its public half in DigitalOcean as `perfkit-shared`. |

The workflow opens its results pull request with `GITHUB_TOKEN`, so the repository setting
"Allow GitHub Actions to create and approve pull requests" must be on.

## Where results land

When a run ends with a verdict, the workflow opens a pull request from `perf/run-<run id>`,
titled `chore(perf): add benchmark run <run id> (v<version>)`. It adds two files and nothing
else:

- `perf/runs/<run id>/report.json`: the run's report.
- `perf/runs/runs.json`: the history of every run, newest first (`perfkit/runs/v1`), created by
  the first run.

No HTML is committed. The raw SIPp traces and samples stay in the run's Actions artifact
`perfkit-report-<run id>` until it expires.

Review the pull request, then merge it with the ruleset bypass, like the release pull request:
events from `GITHUB_TOKEN` start no workflows, so it gets no required checks. Its `chore` type
releases nothing. Rerunning the workflow's `publish` job renders the run again against the
current `main` and updates the same pull request.

## Read a report

In `report.json` (`perfkit/report/v1`, described in perfkit's
[docs/report-v1.md](https://github.com/fonoster/perfkit/blob/v0.1.12/docs/report-v1.md)):

- `benchmarks[].verdict`: `passed`, `failed`, `inconclusive` (the load generator was the
  bottleneck) or `aborted` (too little data).
- `speech-turns`: `headline.limitCps` and `headline.p99AtLimitMs`; `limitIsLowerBound` is true
  when the ramp ended without breaking a rule.
- `speech-soak`: `headline.memoryGrowthMBPerHour` (AppBridge's memory slope after the warm-up)
  and `rules[]` with each rule's limit and measured value.

To see a report as a page, render it with perfkit, with the history for a published run:

```sh
npx -y npm@11 exec --yes --package=github:fonoster/perfkit#v0.1.12 -- perfkit render \
  --report perf/runs/<run id>/report.json --history perf/runs/runs.json --out /tmp/appbridge-bench
```

For a local run, use `--report .perfkit/<run id>/report.json` and leave out `--history`.

## perfkit version

perfkit is pinned to the git tag `v0.1.12` in every command here and in the workflow (`uses:`,
`perfkit-ref`, sweep and render). To move to a new tag, change all of them in one pull request
and check both files with the new tag:

```sh
npx -y npm@11 exec --yes --package=github:fonoster/perfkit#vX.Y.Z -- perfkit validate perf/perfkit.yaml
npx -y npm@11 exec --yes --package=github:fonoster/perfkit#vX.Y.Z -- perfkit validate perf/perfkit.smoke.yaml
```

perfkit's sampler matches each `processes[].match` against the process's command line with a
leading space, so a pattern anchored with `^` matches nothing. Use `(^| )/roomr( |$)`.
