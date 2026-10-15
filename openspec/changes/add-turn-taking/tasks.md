> Build started 2026-10-15 under the owner's overnight go-ahead. Decisions: see build-log.md.

# Tasks

## 1. Conformance assets

- [x] 1.1 Define the Detector interface (inputs: audio frames, transcript segments with timings,
      agent output state; outputs: `eot`, `speaking`, `kind`) as a language-neutral contract
- [x] 1.2 Write scenario files for every requirement in `specs/turn-taking/spec.md`, runnable by
      the session conformance harness (`add-conformance-framework`)
- [x] 1.3 Build a fake Detector that replays a scripted estimate timeline, to test Pacing policies
      in isolation
- [x] 1.4 Build a fake Pacing policy that records the estimate it receives, to test Detectors in
      isolation
- [ ] 1.5 Assemble the first replay corpus: consented internal calls plus synthetic calls (TTS
      callers with scripted pauses, backchannels and interruptions), with expected outcomes
- [x] 1.6 Build the replay harness and its report: false cut-off rate, delay after true end
      (median, p95), missed barge-in rate, backchannel misfire rate, versus baseline

## 2. Gateway implementation (voice worker)

- [x] 2.1 Detector host in the Speech layer, fed by caller audio, STT segments and output state
- [ ] 2.2 Baseline Detector reproducing today's VAD + silence timeout behavior; verify against
      recorded calls that decisions match today's Autopilot
- [x] 2.3 Default Pacing policy: prepare and commit thresholds, `turn.resumed`, backchannel and
      interruption handling, per-app patience, within-call adaptation
- [x] 2.4 Emit `turn.*` events; stop interruptible output on interruption and report
      `output.interrupted`
- [x] 2.5 `subscribe` support for `turn.estimate`
- [x] 2.6 Turn-aware STT adapter: map a `turn_detection` provider's turn signals onto the estimate
- [x] 2.7 Out-of-process Detector client (transport per open question 4)
- [x] 2.8 Append decisions and outcome labels to the call record
- [x] 2.9 Measure the default Detector against the gateway budgets (T1, T2)

## 3. Migration and docs

- [x] 3.1 Remove Silero VAD, `maxSpeechWaitTimeout`, late-speech and barge-in handling from
      `mods/autopilot` (coordinated with `rework-autopilot`) (CB-B5, LG-B5)
- [x] 3.2 Map existing assistant settings (`maxSpeechWaitTimeout`, `allowUserBargeIn`, `vad.*`) to
      the new patience setting and interruptible defaults; document the mapping
- [x] 3.3 Docs page: turn events, patience, choosing a Detector, reading turn labels in the call
      record
