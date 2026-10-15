> Build deferred: do not start until the owner approves the build.

## 1. Harness foundations

- [ ] 1.1 Settle the scenario file schema (format, wildcards, timing assertions) and document it
- [ ] 1.2 Decide where the harness lives (`mods/conformance` or `conformance/`) and how scenario files reach the Python SDK
- [ ] 1.3 Build the scenario runner for TypeScript
- [ ] 1.4 Build the scenario runner for Python

## 2. Fakes

- [ ] 2.1 Fake app (scripted native and Twilio flavor client)
- [ ] 2.2 Fake gateway (scripted server for SDK suites)
- [ ] 2.3 Fake media node (plays recorded caller audio, records output, accepts control commands)
- [ ] 2.4 Fake STT, TTS and LLM providers with deterministic output and injectable delays and failures
- [ ] 2.5 Caller bot that places real SIP calls through Routr

## 3. Suites

- [ ] 3.1 Session protocol suite (every `voice-session` scenario)
- [ ] 3.2 SDK suites (TypeScript and Python, shared scenarios, old handler signature)
- [ ] 3.3 Twilio flavor suite with an unmodified Pipecat bot
- [ ] 3.4 Gateway timing suite (T1)
- [ ] 3.5 Turn-taking replay suite, baseline detector and initial corpus (T3)
- [ ] 3.6 Autopilot suite (fake session, extended conversation evals, stopwatch)
- [ ] 3.7 Provider adapter suites per capability, plus on-demand live tests (T4)
- [ ] 3.8 Registry utility suite against a temporary database
- [ ] 3.9 Call record suite (schema, seal deadline, hashes, signature, crash, redaction)
- [ ] 3.10 Scale harness (T2)
- [ ] 3.11 End-to-end nightly call

## 4. CI wiring

- [ ] 4.1 Run fake-based suites on every pull request, scoped to the contracts a change touches
- [ ] 4.2 Nightly job for end-to-end and load suites on dedicated runners
- [ ] 4.3 Manual trigger for live provider tests
- [ ] 4.4 Publish per-suite reports (latency percentiles, scale numbers, turn-taking metrics)
