## Context

The rebuild specifies contracts before code: the session protocol (`voice-session` and
`twilio-media-streams-flavor`), `turn-taking`, `provider-registry`, `call-record`, `voice-sdk` and
`autopilot`. Today's test suites test implementations from the inside: unit tests with mocks of
internal modules. That proves nothing about a Go or Python rewrite, and it cannot catch two SDKs
drifting apart.

Each rebuild spec writes its scenarios so a harness could execute them. This change defines that
harness.

## Goals / Non-Goals

**Goals**

- Every contract has an executable proof that is independent of the implementation's language.
- The same scenarios run against the TypeScript and Python SDKs.
- The gateway's own latency and its scale are measured, not assumed.
- Turn-taking changes are judged on real conversations, against a baseline.
- Fast feedback on every pull request; heavy tests on a schedule.

**Non-Goals**

- Judging whether a replacement model is good enough. That review happens outside the system,
  with internal evals (provider-registry decision P5).
- Testing vendor quality (word error rate, voice naturalness) beyond "the declared features work".
- The media node's own behavior rules. They are specified in `add-media-node`; its Go test runner
  consumes this harness's scenario files.

## Decisions

### C1. Test only through the public contract

Suites talk to an implementation only through what its users see: WebSocket messages for the
gateway and SDKs, the registry utility's commands and the database it writes for the registry, and
vCon files and their storage for the call record.

- **Why:** a rewrite in Go or Python must pass the same suite unchanged. Inside-out tests are tied
  to one codebase.
- **Rejected:** reusing today's mocha unit tests as the conformance suite. They mock internal
  modules and break on any rewrite.

### C2. A fake for each side of every contract

| Contract | Fakes |
| --- | --- |
| Session (native and Twilio) | Fake app (scripted client); fake gateway (scripted server) |
| Gateway ↔ media node | Fake media node: plays recorded caller audio, records what it is asked to play, accepts control commands |
| Speech providers | Fake STT, TTS and LLM with deterministic output and injectable delays and failures |
| Telephony end to end | Caller bot: places real SIP calls through Routr, speaks recorded audio, records the answer |

- **Why:** each side can be tested alone, and timing can be measured without vendor noise.

### C3. Language-neutral scenario files (proposed format)

Scenarios are YAML files. Each describes the messages one side sends, what the other side must
send back, and timing limits. One runner per language executes them.

```yaml
# proposed format
name: say-interrupted-by-clear
flavor: native
steps:
  - expect: { type: session.start }
  - send:   { type: speak, id: s1, text: "Hello there, how are you today?", last: true }
  - expect: { type: output.started, id: s1 }
    within_ms: 50          # gateway-added time only; fake TTS delay is subtracted
  - send:   { type: clear }
  - expect: { type: output.interrupted, id: s1, heardText: "*", heardMs: "*" }
  - assert: { outbound_silence_within_ms: 40 }
```

- **Why:** the TypeScript and Python SDKs run byte-identical cases, and a third SDK later costs one
  runner, not a new suite.
- **Status:** settled. YAML for authoring, validated against a JSON Schema so every runner rejects
  the same malformed files. The format is `fonoster.scenario.v1`, documented in
  `mods/conformance/SCENARIOS.md` with the schema in `mods/conformance/schema/scenario.schema.json`.
- **Rejected:** writing each SDK's tests in its own language. They drift apart within a release.

### C4. Suites per domain

| Domain | What runs | Proves |
| --- | --- | --- |
| Session protocol (gateway) | Scripted fake app against the real gateway, with fake media node and fake providers with injected delays | Every message, ordering and id echo; `clear`, `mark`, `preempt`; handoff; listener tracks; bad-signature rejection; unreachable-app retry and fallback; outbound session opening at answer |
| SDKs (TS, Python) | Scripted fake gateway plays the same scenario files to each SDK | `say`, `gather`, `say(stream)` and events behave the same in both; the old `(req, res)` handler still works |
| Twilio flavor | An unmodified Pipecat bot (Twilio serializer) against the gateway | Audio, barge-in (`clear`), DTMF, hangup by socket close and by `auto_hang_up` through `base_url` |
| Gateway timing | Stopwatch on the fakes, provider time subtracted | Pass bar T1 |
| Turn-taking | Replay corpus through any Turn Detector | False cut-offs, delay after a real end of turn, missed barge-ins, backchannels taken as interruptions; no regression against the baseline detector |
| Autopilot | Fake session sends scripted turn events; extended conversation evals; stopwatch | Correct commands per state, streamed speech, honest history after interruption, tools, handoff |
| Provider adapters | One suite per capability (STT, TTS, LLM) against each adapter; live smoke tests with real keys | Every declared feature works; cancel is fast; vendor errors map to session `error` codes |
| Registry utility | Temporary database with fixtures | Add, deprecate, retire; impact reports and cascades; retire anyway; audit entries; no secret field can be stored; `plan`/`apply` across two databases |
| Call record (vCon) | Fixture calls, plus calls whose gateway is killed mid-call | Valid vCon schema; sealed within the deadline after hangup; hashes match; signature verifies; a crash still yields a sealed record; seeded personal data is masked in the redacted copy |
| Scale | Load harness: N concurrent fake calls per gateway replica, then more replicas | Pass bar T2 |
| End to end | Caller bot phones an Autopilot through real SIP (Routr) | The whole path works on every nightly build |

### C5. Pass bars

- **T1, gateway latency.** The gateway itself adds at most 50 ms at p95 from `speak` text to the
  first audio frame sent to the media node, and from caller audio arriving to it reaching STT.
  Provider time is subtracted. `clear` silences the call within 40 ms.
- **T2, scale.** One replica of about 2 vCPU holds 100 concurrent calls with zero dropped audio
  frames while meeting T1. Ten replicas hold 1,000 calls (near-linear growth).
- **T3, turn-taking corpus.** Built from our own consented calls plus synthetic calls. Customers
  can opt in later. Call records label the outcomes, so the corpus grows on its own.
- **T4, live provider tests.** Run on demand only: before a release or when adding a provider.

### C6. Cadence

Fake-based suites run on every pull request. End-to-end and load tests run nightly. Live provider
tests run only when triggered by hand.

- **Why:** fakes are fast and free; real SIP, load and vendor calls are slow or cost money.

### C7. "Architecture done"

A domain is architecture-done when its OpenSpec change is approved and its conformance suite is
specified (scenarios written, fakes and pass bars defined). Building the suite and the
implementation stays deferred until the owner approves the build.

### C8. The harness lives in `mods/conformance`

The harness is a new workspace package, `mods/conformance`, built, linted and released with the
monorepo like any other module. It holds the fakes, the runners and the language-neutral scenario
files. The scenario files are consumed by three runners: the TypeScript tests in this repo, the
Python SDK's test suite (which pulls the files from the published package), and the Go media
node's test runner. *Rejected:* a top-level `conformance/` folder, which would need its own tooling
and CI wiring, and a separate repository, which adds version coordination before there are SDKs in
other repositories to justify it.

## Risks / Trade-offs

- **Fakes can lie.** A fake media node or fake provider may behave more nicely than the real one.
  Mitigation: the nightly end-to-end run and the on-demand live provider tests use the real thing.
- **Timing tests are noisy on shared CI runners.** Mitigation: T1 and T2 run on dedicated runners
  at night; pull requests run only functional timing checks with loose limits.
- **A small turn-taking corpus at first.** Our own calls may not cover every accent or behavior.
  Mitigation: synthetic calls fill gaps; customer opt-in grows it later.
- **Live provider tests on demand only** can let a vendor-side change slip until the next manual
  run. Accepted to keep costs at zero between runs.
- **Scenario format churn.** Changing the format means touching every scenario. Mitigation: settle
  it with the first two suites (session protocol and SDKs) before writing the rest.

## Open Questions

- ~~The exact scenario file schema.~~ Resolved: YAML validated by a JSON Schema (`fonoster.scenario.v1`,
  see C3).
- CI resources for the nightly load test (dedicated runners, cloud machines per run) and its cost.
- How recorded calls in the turn-taking corpus are stored and access-controlled, given they come
  from sealed originals with restricted access.
- The seal deadline the call-record suite enforces (the "N seconds after hangup" from
  `call-record`).
