> Build started 2026-10-15 under the owner's overnight go-ahead. Decisions: see build-log.md.

# Tasks

## 1. Conformance assets

- [x] 1.1 Write language-neutral scenario files for every scenario in `specs/autopilot/spec.md`
      (scripted session events in, expected commands out), in the format defined by
      `add-conformance-framework`
- [x] 1.2 Fake LLM (scripted token streams with delays, scripted tool calls), fake tool port and
      fake knowledge port
- [x] 1.3 Latency stopwatch: turn end to first `speak`, excluding fake provider delays
- [ ] 1.4 Extend the existing conversation evals (`models/evaluations`) to streaming replies and
      structured tool messages

## 2. State machine (`mods/autopilot/src/machine`)

- [x] 2.1 Replace the states with greeting, listening, thinking, speaking, transferring, ended
      (design A4); keep the idle clock in listening only
- [x] 2.2 Map turn events to machine events; remove `SPEECH_START`/`SPEECH_END`/`SPEECH_RESULT`,
      `hasLateSpeech` and `maxSpeechWaitTimeout`
- [x] 2.3 Pacing policy: per-assistant patience, within-call adaptation, `turn.estimate`
      subscription
- [x] 2.4 Optional filler: `play` on entering thinking, first reply `speak` with `preempt: true`

## 3. Language model (`mods/autopilot/src/models`)

- [x] 3.1 Replace `createChain` and LangChain chat models with the provider registry's streaming
      LLM interface
- [x] 3.2 Stream tokens into `say(stream)`; abort on `turn.resumed`, new turns and `session.end`
- [x] 3.3 Write history once per turn after the outcome (`output.done` or `output.interrupted`)
- [x] 3.4 Store tool calls and results as tool messages; remove the synthetic follow-up prompt
- [x] 3.5 Tool port with the HTTP implementation; built-in `hangup` and `transfer` tools

## 4. Ports and wiring

- [x] 4.1 Knowledge port; move the S3 + Unstructured implementation behind it and its keys out of
      Autopilot's environment
- [x] 4.2 Wiring factory: assistant config → catalog ids → plugs
- [x] 4.3 Run Autopilot as a hosted `VoiceServer` (removing `vad/`, the raw stream and `sgather`
      from the current engine moved to 8.1)

## 5. Assistant schema and migration (`mods/common/src/assistants`)

- [x] 5.1 `languageModel` uses one catalog id; remove `provider` enum and `apiKey`
- [x] 5.2 Move `vad` and `maxSpeechWaitTimeout` to the turn-taking configuration
- [ ] 5.3 Migration of stored assistant configs (see design Open Question 1)
- [x] 5.4 Remove `eventsHook` from the assistant schema and `sendConversation*Event`; add the
      optional filler setting (deleting `sendConversation*Event` with the current engine moved to 8.2)

## 6. Call record

- [x] 6.1 Append per-turn traces: user text, reply, heard text, interruptions, tool calls,
      timings, token counts

## 7. Documentation

- [x] 7.1 Autopilot docs: pacing, streaming, honest history, tools port, catalog ids
- [x] 7.2 Migration guide for assistant configs

## 8. Cutover (added 2026-10-15, AP-B6)

- [ ] 8.1 Delete the current engine: `vad/`, the raw stream, `sgather`, the LangChain chain and
      models (with `add-turn-taking` 3.1)
- [ ] 8.2 Delete the legacy assistant schema and `sendConversation*Event`
- [ ] 8.3 Run the stored-assistant migration job (5.3) and route Autopilot apps to the hosted
      Autopilot
