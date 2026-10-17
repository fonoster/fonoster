> Build approved by the owner on 2026-10-15.

## 1. Harness foundations

- [x] 1.1 Settle the scenario file schema (format, wildcards, timing assertions) and document it
- [x] 1.2 Create the `mods/conformance` workspace package (fakes, runners, scenario files) and publish the scenario files so the Python SDK and the Go media node runner can consume them
- [x] 1.3 Build the scenario runner for TypeScript
- [x] 1.4 Build the scenario runner for Python

## 2. Fakes

- [x] 2.1 Fake app (scripted native and Twilio flavor client)
- [x] 2.2 Fake gateway (scripted server for SDK suites)
- [x] 2.3 Fake media node (plays recorded caller audio, records output, accepts control commands)
- [x] 2.4 Fake STT, TTS and LLM providers with deterministic output and injectable delays and failures
- [x] 2.5 Caller bot that places real SIP calls through Routr (done: go/medianode/cmd/sipcaller + internal/caller, used by mods/gateway/test/routr.live.test.ts and `ops/rebuild/stack ask`; AU-B1)

## 3. Suites

- [x] 3.1 Session protocol suite (every `voice-session` scenario)
- [x] 3.2 SDK suites (TypeScript and Python, shared scenarios, old handler signature)
- [x] 3.3 Twilio flavor suite with an unmodified Pipecat bot
- [x] 3.4 Gateway timing suite (T1) (partial: speak to first audio and clear to silence measured in mods/gateway/test/timing.test.ts; caller audio to STT not measured) (moved to `harden-conformance`, 2026-10-17)
- [x] 3.5 Turn-taking replay suite, baseline detector and initial corpus (T3) (done: mods/gateway/test/replay.test.ts, src/turn/replay.ts, BaselineDetector, mods/conformance/turn-corpus/synthetic-v1.json with 60 synthetic calls; recorded calls pending in add-turn-taking 1.5; AU-B1)
- [x] 3.6 Autopilot suite (fake session, extended conversation evals, stopwatch) (partial: mods/autopilot/test/session/{conformance,latency,fullstack}.test.ts and scenarios/autopilot; extended conversation evals open, rework-autopilot 1.4)
- [x] 3.7 Provider adapter suites per capability, plus on-demand live tests (T4) (done: mods/gateway/test/adapterConformance.test.ts, vendors.test.ts; on-demand live: mods/gateway/scripts/live-check.ts + .github/workflows/live-providers.yaml; AU-B1)
- [x] 3.8 Registry utility suite against a temporary database (done: mods/apiserver/test/registry/spec.test.ts against a throwaway Postgres, LO-B13; AU-B1)
- [x] 3.9 Call record suite (schema, seal deadline, hashes, signature, crash, redaction) (done: mods/callrecord/test/{callrecord,vconSchema,fixtures,keys}.test.ts, mods/gateway/test/crash.test.ts; AU-B1)
- [x] 3.10 Scale harness (T2) (partial: mods/gateway/scripts/scale.ts and go/medianode/cmd/loadgen measure one process; ten replicas and a dedicated runner open) (moved to `harden-conformance`, 2026-10-17)
- [x] 3.11 End-to-end nightly call (moved to `harden-conformance`, 2026-10-17)

## 4. CI wiring

- [x] 4.1 Run fake-based suites on every pull request, scoped to the contracts a change touches
- [x] 4.2 Nightly job for end-to-end and load suites on dedicated runners (moved to `harden-conformance`, 2026-10-17)
- [x] 4.3 Manual trigger for live provider tests
- [x] 4.4 Publish per-suite reports (latency percentiles, scale numbers, turn-taking metrics)
