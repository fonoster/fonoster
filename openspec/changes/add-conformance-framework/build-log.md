# Build log: add-conformance-framework

## 2026-10-15

- 1.1–1.3, 2.1–2.4 shipped first (scenario format, package, TypeScript runner, fakes).
- 1.4: the Python runner is `python/fonoster-conformance`. It runs role-`gateway` scenarios (SDK
  suites); steps that need the fakes harness (`inject`, `assert`, `caller`) fail with a reason.
- 3.1: the session protocol suite is the 36 voice-session and Twilio-flavor scenarios plus the
  gateway integration tests in `mods/gateway/test/integration.test.ts` for what one peer cannot
  express (signatures, fallback, handoff, listeners, outbound calls, keepalive, filters, call
  record).
- 3.2: both SDKs pass all 24 voice-sdk scenarios.
- 3.4 (T1) is half done: `repeatScenario` + `mods/gateway/test/timing.test.ts` measure speak →
  first audio (p95 22 ms locally) and clear → silence (p95 1 ms). Caller audio → STT is not measured
  yet.
- Format additions, all additive to `fonoster.scenario.v1`: `caller` step, `setup.media`,
  `${media}` variable, `next: true` on `expect`, `from` on `assert`.
- 3.3: the Pipecat golden test passes (see the gateway build log, B15).
- 3.10 (T2) partly: `mods/gateway/scripts/scale.ts` measures one gateway process; first numbers
  are in the gateway build log (B17). Ten replicas and a dedicated runner are still to do.
- Not started: 2.5 caller bot, 3.5 turn-taking corpus, 3.6 Autopilot, 3.7 provider
  adapters, 3.8 registry, 3.9 call record, 3.10 scale, 3.11 e2e, 4.x CI wiring.

## CI (2026-10-15)

- `.github/workflows/conformance.yaml`: on pull requests to `main` or `next` that touch the rebuild
  packages, the NATS-backed suites (gateway conformance, integration, crash, Autopilot full stack)
  run with a NATS service container, and the Python SDK and runner tests run. Everything else is
  already covered by `unit-tests.yaml`, whose glob picks up the new test files (899 tests pass
  locally with it).
- Nightly (and on demand): T1 timing (200 runs), a 100-call load run, the turn-taking replay and
  the Pipecat golden test, with reports uploaded as the `conformance-reports` artifact (task 4.4).
  They run on shared runners, so they are trends, not pass bars; task 4.2 (dedicated runners) stays
  open. Live provider tests (4.3) wait for real adapters.

## 2026-10-15 (dashboard stream: docs)

### DX-B5. One page for running the suites

- `docs/conformance.md` covers the fake node, Go node and real stack layers, the nightly timing,
  load, replay and Pipecat jobs, the Python runner, how a third-party SDK runs `voice-sdk` scenarios
  (reusing `python/fonoster-conformance` as the reference) and the CI jobs. The real stack and the
  dedicated runners stay documented as "not yet" because tasks 2.5, 3.11 and 4.2 are open.

### DX-B6. `SCENARIOS.md` gaps closed

- Added `media-control/` to the layout and `autopilot` to the `contract` row (the schema already had
  both), described the `timing` and `slow` tags, and added "Running the files from another language"
  with the minimum a new runner needs.

### DX-B7. Live provider trigger (4.3)

- `.github/workflows/live-providers.yaml` is `workflow_dispatch` only and runs
  `mods/gateway/scripts/live-check.ts` with the vendor keys from repository secrets. It is not
  exercised locally (no Actions runner here) and no paid call was made. The remaining conformance
  tasks (2.5, 3.4 to 3.11, 4.2) are suite or infrastructure work, outside this stream's docs scope.
