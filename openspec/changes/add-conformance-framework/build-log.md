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
