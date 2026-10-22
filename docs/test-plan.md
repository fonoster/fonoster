# Test plan

Status: draft, 2026-10-20. Owner: Pedro. This plan covers the platform on `main` after the rebuild.

The goal is to know, layer by layer, that the platform does what the specs and designs say, and to leave
a test behind for everything we check.

## The method

**Isolate, suppress, reduce.**

- **Isolate.** Test one layer at a time, with its neighbors replaced by fakes. A failure then points at
  one layer.
- **Suppress.** Take away what hides failures: add packet loss, latency, slow consumers, crashed
  nodes and restarts. Systems look fine until we do this.
- **Reduce.** Each layer starts with a coverage matrix (a list of every thing it can do). We shrink the
  unchecked rows to zero. A row is done when it has an automated test, or a written reason it does not.

Every layer follows the same loop: **inventory, test, record, leave a test behind.** Nothing counts as
done until a machine runs it.

## Rules for the whole plan

1. **Definition of done for a row:** an automated test exists, carries the case id in its name, and
   runs in CI, nightly or as a release gate. There are no manual tests. If a feature cannot be tested
   by a machine, building the tool that can is the first work item.
2. **Gaps are fixed or documented.** A feature in the API and not in the UI (or the reverse) gets a
   fix, or a line in `docs/test-plan-gaps.md` saying why it is intended.
3. **Fakes are first-class.** A fake is a test tool with its own tests. We trust a fake only if it
   passes the same contract as the real thing.
4. **Numbers, not feelings.** Packet loss, latency and load results go into a report file with the
   git SHA, the hardware and the date. No "seems fine".
5. **Bugs found go to issues the same day**, with the test that reproduces them.

## What exists today

| Area | What we have | What is missing |
| --- | --- | --- |
| Dashboard | Playwright specs for community and cloud (`mods/dashboard/e2e`) | Per-screen fidelity checks; API parity |
| SDK (TypeScript) | Unit tests in `mods/sdk/test` | Shared cases run against both SDKs |
| Voice SDK (TS and Python) | `voice-sdk` conformance scenarios, Python runner | Wider scenario list |
| AppBridge | Conformance, integration, crash, timing, `scale.ts`, `replay.ts`, Pipecat golden | Fault injection; real-stack run |
| Roomr (Go) | Unit and e2e tests with `-race`, `gonode.test.ts`, `sipcaller` bot | Packet-loss and quality benchmarks; load |
| Routr and trunking | Nothing automated | The whole section 3 |
| Helm and K8s | Chart exists in `ops/rebuild/helm` | Any test |
| Real-stack nightly | Designed (conformance tasks 2.5, 3.11) | Not wired |

## Phase 0: Foundation (about 1 week)

This phase is not in your outline. It is small and everything else rests on it.

1. **A working real stack on demand.** `ops/rebuild/stack up` plus a 10-call smoke (inbound, outbound,
   DTMF, recording, hangup, transfer) that runs on every push to `main`. If this is red, we do not
   test anything lower or higher: the base is broken.
2. **The matrices.** Generate, do not hand-write, these lists:
   - Every screen and state in `designs/dashboard.pen`.
   - Every RPC in the control-plane API (from the proto files and `mods/sdk/src`).
   - Every MediaControl command and event (from the `media-control` spec in fonoster/roomr).
   - Every call flow Fonoster uses (from the routing rules and the product specs).
3. **A results page.** One table per layer: row, test, last run, status. This is how we see progress.

## Phase 1: The control plane (what the user sees)

### 1.1 Screens versus designs

- For each frame in `designs/dashboard.pen`, list its states: empty, loading, filled, error, and the
  edit and delete dialogs. These are the test cases.
- Export each frame from Pencil. A script renders the golden screenshots from the exports.
- Golden screenshots are committed and change only in a reviewed pull request. From then on
  Playwright compares the dashboard to its own baseline, not to Pencil.
- Structure checks run next to the pixels: labels, order, empty-state copy, the Fonoster|Twilio
  labels, "type DELETE to delete", and the other rules in the dashboard UI rules.
- Run each screen in light and dark, and at desktop and narrow widths.
- Community (self-host) and cloud editions are separate runs. SaaS-only screens (billing) must be
  absent in community.

**Push back:** do not compare pixels against Pencil on every run. Pencil's renderer and the browser
differ in fonts and anti-aliasing, so it would be red forever. Compare against Pencil when the
goldens are generated, then lock them. Fix the browser, viewport and fonts in the Playwright config, or
baselines drift between machines. Keep the baseline images in git, or in Git LFS if they get large.

### 1.2 Feature parity: API and view

- A script reads the RPC list and the dashboard's route and action list. It prints a table:
  **in API only**, **in UI only**, **in both**.
- Every row in "API only" or "UI only" is fixed or documented.
- Known gaps already in the backend gaps doc feed this table.
- The script runs in CI, so a new RPC without a UI decision fails the build.

### 1.3 SDK and API

- **Inputs:** every request field gets a valid case and an invalid case (missing, wrong type, too long,
  wrong workspace, expired token). Expected: a clear error code, no side effects.
- **Outputs:** every response is checked against the type definitions, including pagination, ordering,
  empty lists and deleted objects.
- **Auth:** each RPC is called with no key, a wrong key, a key from another workspace, and a key
  without the role. Workspace isolation is checked on every RPC, since a mistake here is a
  security bug.
- **Both SDKs give the same results.** Write the cases once as data (request, expected response or
  error). A runner per SDK reads the same file. "Both SDKs" means the TypeScript and Python voice
  SDKs (conformance already does this for sessions). The control-plane SDK exists only in TypeScript
  (`mods/sdk`). If you also want a Python control-plane SDK, that is a build task and not a test task.
  Confirmed: the voice SDKs.
- **CLI (`fonoster`):** one smoke per command group, on top of the same cases.
- Billing runs against the Stripe fake.

### Exit criteria for Phase 1

- Every screen state has a baseline, and every matrix row is closed.
- Parity table has zero undocumented gaps.
- Every RPC has input, output and auth cases. Both SDKs pass the shared file.

Control plane is then complete. One more item belongs here and is easy to forget: **upgrade and data
migration** (v0.x to the rebuild, and one version of the rebuild to the next). Add a small test that
installs the old version, creates data, upgrades and checks the data.

## Phase 2: Call flows through Routr and the SIP edge

Routr's own protocol compliance is out of scope here; it gets its own separate tests. This phase proves
that **every call flow Fonoster uses works end to end**, with real SIP legs through Routr, the node
and AppBridge. The `sipcaller` bot and SIPp scripts are tools for this, not a compliance suite.

### 2.1 Routes and trunks

- Routes: PSTN to app, PSTN to SIP agent, SIP agent to PSTN, agent to agent, outbound from API. Each
  with ACL allow and deny.
- Trunks: inbound auth by IP and by credentials, outbound registration, failover, number formats
  (E.164, national, with and without `+`).
- Softphone registration: success, bad credentials, expiry, re-register, unregister.
- Balancing across Roomr nodes (`X-Session-Count`): picks the lowest, stops using a down node, skips a
  full node (known gap).
- The cross-workspace `X-App-Ref` hole from the handoff notes becomes a test here. It fails today.
  The test is written first, then the fix.

### 2.2 The flows we rarely run

Every flow is automated with bots and a trunk peer (see 2.3).

| Flow | Notes |
| --- | --- |
| PSTN to SIP agent | Registered softphone answers; hangup from each side; busy; no answer; agent offline |
| Cold transfer | Our side dials the target and drops out |
| Warm transfer | Caller held while the agent talks to the target, then joined |
| REFER transfer | Handled by the trunking provider; test with and without REFER support |
| Transfer failure cases | Target busy, no answer, wrong number, caller hangs up mid-transfer |
| Transfer from AppBridge versus from a SIP agent | Two different code paths |
| DTMF | RFC 2833 and SIP INFO, both directions, long digits, fast digits |
| Hold and resume, re-INVITE with codec change | |
| Early media and ringback | |
| Outbound caller ID and privacy headers | |
| Call limits and concurrency | |

### 2.3 Trunking provider

One generic suite, not one per provider. A fixture file names the provider's trunk settings, two
numbers (A points at our platform, B is routed to a SIP bot, the trunk peer) and a capability matrix
(REFER, INFO DTMF, TLS, SRTP, early media). Provider differences live in the fixture, and the suite
checks that observed behavior equals the declared one.

It runs in two modes with the same cases and code:

- **Reference mode:** against a local SIP trunk simulator. Free, so it runs every night and on any
  change to trunking code.
- **Live mode:** against a real provider. Calls cost money, so they are short, a daily spend cap
  applies, and it runs as a release gate. A nightly canary places one outbound and one inbound call.

Coverage: inbound, outbound, authentication and recovery, wrong credentials, DTMF, transfers, codecs,
number formats, failure responses, and TLS with SRTP.

### 2.4 Load and soak

- Calls per second (setup rate) and concurrent calls, until something breaks. Record where, and why.
- Registration storms (many softphones re-registering after a restart).
- Soak: a steady load for 12 to 24 hours. Watch memory, file descriptors, port usage and RTPEngine
  state. Calls must clean up.

### Exit criteria for Phase 2

- Every call flow in the matrix has a test and a result.
- The trunk suite passes in reference mode, and in live mode against the configured provider at the release gate.
- A load number we are willing to publish: "N concurrent calls, M calls per second, on this hardware".

## Phase 3: Roomr (the Go media node)

Roomr is isolated, so this is the one place we can be exact. The inputs are RTP and MediaControl; the
output is RTP and events.

### 3.1 Function

- Every MediaControl command and event has a test (the matrix from Phase 0). The existing conformance
  files cover the contract; extend them to the error paths.
- Rooms: create, add and remove participants, mix of 1, 2, 3, 10 participants, each hears everyone
  except themselves, room end cleans up.
- Codecs: PCMU, PCMA, Opus, and the narrowband and wideband mix. Resampling.
- Listeners (forks): attach and detach mid-call, both and single tracks.
- Recording output: complete, in sync, readable, correct length.
- DTMF in and out; transfer modes; hold.

### 3.2 Audio quality and packet loss

This is the center of the plan. Without numbers we cannot say it works.

- **A fixed test signal set:** speech samples in a few languages, silence, tones, and a sweep. Same
  files every run.
- **Measure at the edges:** send a known file in on one leg, record what comes out of the other.
  Compare input and output. Use ViSQOL or PESQ (open-source, objective) for a quality score, plus
  our own checks: latency added, clipping, gaps, drift, and sample count (no lost or duplicated audio).
- **Impair the network** with `tc netem` (or a UDP proxy in the test harness): loss at 0, 1, 2, 5, 10,
  20 percent; random and bursty loss; jitter; reordering; duplicate packets; delay. Report the score
  against each level.
- **Check RTP stats directly:** jitter buffer behavior, concealment, sequence gaps, RTCP reports,
  timestamp jumps, SSRC changes mid-call, silence suppression and comfort noise.
- **Processing cost:** CPU and memory per participant and per room, by codec and by mix size.
  Use `pprof` and the Go race detector. Look for allocations in the audio path.
- Pass bars are set after the first run (we do not know the right numbers yet). Write them down and
  keep them in the report.

### 3.3 Load

- Concurrent rooms and participants until quality drops. Define "drops" in advance (for example,
  ViSQOL under a set value, or p99 packet-out interval above 25 ms).
- Mixer fairness: one slow participant must not hurt the others.
- Soak 12 to 24 hours. Goroutine and memory graphs must be flat.
- Node loss: kill a node mid-call. Callers get a clean hangup, and the other nodes are fine.

### Exit criteria for Phase 3

- A quality table: score by loss level and codec.
- A capacity number per node size, with the limiting resource named (CPU, memory or network).
- A flat soak test.

## Phase 4: AppBridge

AppBridge is TypeScript, one per call, and speaks to apps over WebSocket. (Also called AppGateway; confirmed to be the same component.)

### 4.1 Function

- The session protocol in both flavors (`native` and `twilio`): every message, every command, every
  error. The existing conformance files are the base; fill in the gaps found by the matrix.
- Turn-taking: the turn corpus and replay tool, with the pass bars in `docs/turn-taking.md`.
- Speech layer: STT, TTS, play, interrupt, barge-in, with the fake providers. Real providers get a
  small live check in CI with keys from secrets.
- Call record: complete, signed, correct timing, no missing events.
- Webhooks: delivery, retry, signing, ordering.
- Pipecat and Twilio apps work unchanged (the golden tests).

### 4.2 Fakes and faults

Fakes tell us how the system behaves. The fake set is: Roomr node, STT, TTS, LLM, app (WebSocket
client), trunking provider. For each, add switches that break it on purpose:

- Audio: packet loss, late packets, silence, a one-way stream, clock drift.
- Providers: slow, error, hang, disconnect mid-stream, wrong audio format.
- App WebSocket: slow reader (backpressure), disconnect, reconnect, bad frames, huge frames.
- NATS: restart, partition, slow.
- Roomr node: crash, heartbeat stops.

Each fault has a stated expected behavior (hang up cleanly, retry, degrade). If it is not written, we
write it first. Many of these decisions are not in the specs today.

### 4.3 Packet loss and timing

Measure what AppBridge adds: audio-in to STT delay, TTS to audio-out delay, and end-of-turn to first
TTS audio. With loss on the RTP leg, check that STT accuracy drops gracefully and no audio is
duplicated or reordered. The existing timing tests (T1 at 50 ms p95 and so on) run on a dedicated
runner so the numbers mean something.

### 4.4 Load

`scale.ts` at 100, 500 and 1000 calls (with fakes, so we measure us and not the vendors). Memory per
call, event-loop lag, NATS message rate, and cleanup after calls end.

### Exit criteria for Phase 4

- Protocol matrix closed. Fault table with a passing test per row.
- A timing report and a capacity number per worker.

## Phase 5: Kubernetes and scale

Two environments, because they answer different questions.

- **kind or k3d on a laptop and in CI (functional).** Helm install from scratch, upgrade, rollback,
  config change, secrets, a pod killed at random, a rolling update with live calls, NATS restart. Does
  the chart work at all, and does the stack recover.
- **A real cluster, rented for a few days (scale).** The load numbers from Phases 2 to 4, repeated
  across nodes, plus: node drain with active calls, autoscaling, noisy neighbors, cross-zone
  latency, and a private region enrolled over the network.

**Push back:** media on Kubernetes is the hard part. UDP port ranges, `hostNetwork`, RTPEngine kernel
mode, and node IPs affect audio quality in ways a laptop will never show. Do not trust the kind run
for media. Decide early what the supported media setup is (for example, Roomr and RTPEngine on
dedicated nodes with host networking), and test that one.

## Things in your outline that I would change

1. **Add Phase 0.** Without a working real stack and a smoke, every later result has a doubt attached.
2. **Do not run strictly in order.** Phases 1 and 2 can overlap: live trunk testing waits on numbers and
   your time, so start it early. Phase 3 can also start as soon as the matrix exists.
3. **Control plane is cheap, so time-box it** (about 2 weeks). The expensive risk is in media and SIP,
   and that is where we most need the time.
4. **Pixels versus Pencil** (see 1.1): goldens change only in a reviewed pull request.
5. **Add security, upgrades, observability and chaos,** which are not in the outline:
   - Security: workspace isolation on every API and on SIP (the `X-App-Ref` issue), key scopes,
     rate limits, NATS auth between services.
   - Upgrade and migration (see Phase 1).
   - Observability: a call produces the traces, metrics and logs promised in the `observability` spec.
     A test that makes a call and checks the trace exists.
   - Chaos: service restarts under load, one at a time. Do this in Phase 5, after the base is stable.
6. **Private regions and billing** are control-plane features with their own risks (two machines;
   money). Both get a section in the Phase 1 matrix. Billing uses the Stripe fake.
7. **Stop rules.** Every phase has exit criteria. Without them this plan never ends.

## Order

Areas are worked in risk order, not phase order: the first area is the one with an open incident or
a known gap. There is no timeline in this document. Progress is measured by three numbers in the
release report: proven cases, the flake rate, and the `pr` tier wall time. Re-estimate after the
first area is done.

## Review (2026-10-20)

The plan was reviewed against published practice. The research, with sources, is in the design note
of `openspec/changes/unify-conformance-qa`. What changed:

1. **Proven, not green.** Coverage and mutation scores are weak predictors of whether LLM-written
   tests catch bugs. A case counts only once its test has been seen red against a seeded fault.
2. **Flake policy.** Marked by data, rerun once, quarantined for at most 14 days as Blocked. Without
   it the gate blocks every release or gets ignored.
3. **Tiers.** A `pr` tier under 15 minutes on fakes and mocks; everything else nightly or at release.
   Fast feedback is what makes AI-assisted work a net win.
4. **Production checks.** Synthetic calls and a sign-in after every deploy, with alerting. The
   strongest evidence found is that pre-release gates miss what continuous production checks catch.
5. **Stochastic cases declare trials** and are judged over all runs (pass^k).
6. **Measurements are relative** to a committed baseline and gate only on the dedicated runner.
   PESQ is dropped; ViSQOL plus our own sample-count, gap and latency checks.
7. **Visual baselines** come from the app in the pinned container, reviewed against the design once;
   few screenshot cases, structure checks carry the rest.
8. **The trunk simulator and the harness are builds, not tasks.** No estimate until the first area
   is done.
9. **Docs audit:** deterministic checks first; an LLM judge only with a human-labeled calibration
   set, multiple samples and an "Unknown" option, and never a hard gate until agreement is measured.

## Decisions (2026-10-20)

1. "Both SDKs" means the TypeScript and Python voice SDKs. The control-plane SDK stays TypeScript only.
2. "AppGateway" is AppBridge.
3. No separate Routr compliance repo in this plan. Routr protocol testing is separate work. This plan
   only proves the call flows Fonoster uses, through end-to-end tests.
4. Phase 5 gets a rented cluster for a few days, and dedicated runners for the nightly job.
5. No per-carrier suites. One generic trunking provider suite, with provider differences in a fixture file.
