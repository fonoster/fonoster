> Build deferred: do not start until the owner approves the build.

# Tasks

## 1. Conformance assets

- [ ] 1.1 Write language-neutral scenario files for every scenario in `specs/autopilot/spec.md`
      (scripted session events in, expected commands out), in the format defined by
      `add-conformance-framework`
- [ ] 1.2 Fake LLM (scripted token streams with delays, scripted tool calls), fake tool port and
      fake knowledge port
- [ ] 1.3 Latency stopwatch: turn end to first `speak`, excluding fake provider delays
- [ ] 1.4 Extend the existing conversation evals (`models/evaluations`) to streaming replies and
      structured tool messages

## 2. State machine (`mods/autopilot/src/machine`)

- [ ] 2.1 Replace the states with greeting, listening, thinking, speaking, transferring, ended
      (design A4); keep the idle clock in listening only
- [ ] 2.2 Map turn events to machine events; remove `SPEECH_START`/`SPEECH_END`/`SPEECH_RESULT`,
      `hasLateSpeech` and `maxSpeechWaitTimeout`
- [ ] 2.3 Pacing policy: per-assistant patience, within-call adaptation, `turn.estimate`
      subscription
- [ ] 2.4 Optional filler: `play` on entering thinking, first reply `speak` with `preempt: true`

## 3. Language model (`mods/autopilot/src/models`)

- [ ] 3.1 Replace `createChain` and LangChain chat models with the provider registry's streaming
      LLM interface
- [ ] 3.2 Stream tokens into `say(stream)`; abort on `turn.resumed`, new turns and `session.end`
- [ ] 3.3 Write history once per turn after the outcome (`output.done` or `output.interrupted`)
- [ ] 3.4 Store tool calls and results as tool messages; remove the synthetic follow-up prompt
- [ ] 3.5 Tool port with the HTTP implementation; built-in `hangup` and `transfer` tools

## 4. Ports and wiring

- [ ] 4.1 Knowledge port; move the S3 + Unstructured implementation behind it and its keys out of
      Autopilot's environment
- [ ] 4.2 Wiring factory: assistant config → catalog ids → plugs
- [ ] 4.3 Run Autopilot as a hosted `VoiceServer`; remove `vad/`, the raw stream and `sgather`

## 5. Assistant schema and migration (`mods/common/src/assistants`)

- [ ] 5.1 `languageModel` uses one catalog id; remove `provider` enum and `apiKey`
- [ ] 5.2 Move `vad` and `maxSpeechWaitTimeout` to the turn-taking configuration
- [ ] 5.3 Migration of stored assistant configs (see design Open Question 1)
- [ ] 5.4 Remove `eventsHook` from the assistant schema and `sendConversation*Event`; add the
      optional filler setting

## 6. Call record

- [ ] 6.1 Append per-turn traces: user text, reply, heard text, interruptions, tool calls,
      timings, token counts

## 7. Documentation

- [ ] 7.1 Autopilot docs: pacing, streaming, honest history, tools port, catalog ids
- [ ] 7.2 Migration guide for assistant configs
