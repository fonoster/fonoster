# Build log: rework-autopilot

Decisions taken while building, for the owner to review. Each can be reversed.

## 2026-10-15 (overnight, owner asleep)

### AP1. A new session engine next to the current Autopilot

- `mods/autopilot/src/session/` holds the new engine: an xstate machine (A4 states) driving an
  `Agent` that works only through `@fonoster/voice/session` (A2). The current Autopilot
  (Silero VAD, LangChain, gRPC voice) is untouched and its tests pass; it serves production until
  the cutover.
- Entry point: `createAutopilotHandler({ assistant, providers })` returns a `VoiceServer` handler.

### AP2. Plugs

- **Think:** a streaming interface with one implementation speaking OpenAI-compatible Chat
  Completions (OpenAI and most hosted models; the conformance fake LLM). Catalog ids
  (`openai/gpt-4o-mini`) resolve through a `providers` map (base URL + key) until the provider
  registry exists. LangChain is not used by the new engine.
- **Tools:** `ToolPort` with the HTTP implementation from the existing tool schema. Built-in
  `hangup` and `transfer` are offered to the model as tools (`transfer` only when the assistant
  has transfer options).
- **Knowledge:** not implemented yet (task 4.1).

### AP3. Behaviour details

- Replies stream as sentence-sized `speak` pieces (split on `.`, `!`, `?` or at 160 characters),
  one `id` per reply, ending with an empty `last: true` piece.
- History is written once per round after the outcome: full text on `output.done`, `heardText`
  on `output.interrupted`. A new turn waits for the cancelled reply to settle so what was heard
  of it lands before the new user message; a reply cancelled before speaking leaves nothing.
- Tool start messages are spoken without waiting for them to finish (the gateway queues the
  reply behind them); they are not written to the LLM history (they would sit between a tool
  call and its result).
- Pacing: `patience: eager | patient` (default eager: prepare on `turn.likely_ended`). After three
  `turn.resumed` in one call an eager assistant becomes patient for the rest of the call and
  notes it (Recorder).
- `turn.estimate` is subscribed at start (spec) but not used by the policy yet.
- Idle: the clock runs only in listening; with `maxTimeoutCount: N`, the first N-1 timeouts
  speak the idle message and the Nth speaks the goodbye and hangs up.
- Barge-in: `turn.user_started` while speaking sends `clear` when `allowUserBargeIn`; speak items
  carry `interruptible: allowUserBargeIn`.
- `SPOKEN` events are tagged with their source (greeting, reply, idle, error) so a late event
  from an earlier phase cannot end a newer reply (found by the scenarios).

### AP4. Assistant config

- `sessionAssistantSchema` (strict) lives next to the current schema, in the engine. It rejects
  `eventsHook`, `apiKey`, `baseUrl`, `provider`, `vad`, `maxSpeechWaitTimeout` and `audioFilters`
  with messages naming where each moved. New optional settings: `patience`, `filler.url`, `voice`,
  `language`. Migrating stored configs (tasks 5.x) is not done.

### AP5. Gap found: Autopilot cannot write to the call record

- A10 wants per-turn traces (timings, token counts, tool calls) in the call record, but the
  session protocol gives apps no way to append to it. The engine reports traces through a
  `Recorder` interface (logged by default). Proposal for review: an additive session command
  such as `record.note { data }` that the gateway appends to the call record.
- **Resolved the same night:** `record.note { data }` was added to `voice-session` (requirement
  "Apps can annotate the call record"), both SDKs (`session.note(data)`), and the engine's default
  recorder sends `autopilot.turn` and `autopilot.note` notes. Task 6.1 is done; token counts are
  not reported yet (the Think plug does not surface usage).

### Conformance

- 21 autopilot scenarios (`mods/conformance/scenarios/autopilot`), one per wire-observable spec
  scenario, pass against the engine with the fake LLM and fake tools. Config validation, catalog
  id resolution, sentence splitting and turn traces are unit tests.
- Scenario format additions: `autopilot` contract, `setup.assistant`, `$excludes`, fake LLM
  `chunkDelayMs`, assertions `providers.llm.last_messages` and `tools.calls`.

### AP7. Knowledge port

- `KnowledgePort.find(question)` is asked once per reply (or when a reply is prepared) with an
  800 ms limit; what it finds goes to the LLM as a system message for that request and its tool
  rounds only, never into the history. `fromKnowledgeBase()` adapts the current S3 + Unstructured
  knowledge bases. Moving their keys out of Autopilot's environment (operator wiring) is still to
  do, so task 4.1 stays open.

### Not done

- 1.3 latency stopwatch as a repeated measurement (traces carry the timings), 1.4 evals, 3.1 the
  provider registry's LLM interface (stand-in above), 4.1 knowledge port, 4.3 removing VAD and
  the raw stream from the current engine, 5.x schema migration, 7.x docs.

### AP6. Full-stack test

- `mods/autopilot/test/session/fullstack.test.ts` runs a whole call with fakes only at the edges:
  fake media node → real gateway (STT, turn detection, TTS, output queue) → Autopilot over the
  session protocol → fake LLM, and back as audio to the caller. Passes in about 3 s.
