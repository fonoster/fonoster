## Why

Autopilot's structure is sound: a state machine on top of a small `Voice` interface, a zod
assistant contract, barge-in, idle and late-speech handling, five LLM providers and text evals.
What keeps it from feeling as good as VAPI or LiveKit are design problems, not the language:

- **It waits too long to talk.** `chain.invoke()` waits for the full LLM reply, then `say()` speaks
  the whole text. A tool call adds a second full invoke before anything is spoken.
- **It owns turn-taking badly.** A Silero VAD, STT final results and a fixed timer
  (`maxSpeechWaitTimeout`) decide when the caller is done. There is no end-of-thought signal.
- **It can't see itself.** TTS and STT run in the apiserver, so Autopilot can't measure them, and
  its only outputs are two webhooks.
- **History doesn't match what the caller heard.** An interrupted reply is stored whole.
- **Vendors leak in.** LLM providers are a hardcoded enum behind LangChain, the knowledge base is
  hardwired to S3 and Unstructured, and `apiKey` sits inline in the assistant config.

The rebuild gives Autopilot a better place to stand: the session protocol, the gateway's Speech
layer and Turn Detector, the provider registry and the call record. This change makes Autopilot
an ordinary client of those contracts. It is an improvement, not a rewrite.

## What Changes

- **Autopilot becomes a hosted session app.** It runs as a `VoiceServer` (see `rework-voice-sdk`)
  and is reached the same way as any app: a number points to an app whose URL is our hosted
  Autopilot. It uses only public session messages; there is no private path.
- **The state machine shrinks** to greeting → listening → thinking → speaking → transferring →
  ended, and reacts to the gateway's turn events (`turn.user_started`, `turn.likely_ended`,
  `turn.ended`, `turn.resumed`, `turn.backchannel`) and, when subscribed, to `turn.estimate`.
- **A pacing policy replaces the detector.** Autopilot keeps "how patient to be" per assistant and
  adapts within the call. The Turn Detector itself lives in the gateway (`add-turn-taking`).
- **BREAKING (internal): Silero VAD, the raw-audio stream and `maxSpeechWaitTimeout` leave
  Autopilot.** The `vad` and `maxSpeechWaitTimeout` assistant settings move to the turn-taking
  configuration.
- **Streaming end to end.** LLM tokens flow into `say(stream)`, so speech starts at the first
  sentence. Autopilot prepares an answer on `turn.likely_ended` and discards it on
  `turn.resumed`.
- **Honest history.** On `output.interrupted`, only `heardText` enters the conversation history.
- **Structured tools.** Tool calls and results are stored as tool messages; the synthetic "Write a
  quick message based on the tools results" prompt is removed. Tools sit behind a port (HTTP
  today, MCP later).
- **Plugs, not vendors.** Think uses the provider registry by catalog id; Tools and Knowledge are
  ports; Hear and Speak are the gateway's Speech layer. LangChain's chain is replaced by a thin
  streaming LLM interface from the provider registry.
- **Thinking signal.** Autopilot tells the gateway when it is thinking, so the audio pipeline can
  fill silence (comfort noise or a filler sound). Noise cancellation and comfort noise themselves
  live in the audio pipeline.
- **Conversation events go to the call record**: turns, responses, interruptions with what was
  heard, tool calls and results, and per-turn timings.

## Capabilities

### New Capabilities

- `autopilot`: the conversation runtime as a session client: states, pacing, streaming speech,
  honest history, tools and knowledge ports, thinking signal and the events it records.

### Modified Capabilities

None. Autopilot has no spec in `openspec/specs/` today.

## Impact

- **Affected code:** `mods/autopilot` (machine, models, tools, knowledge, voice wrapper, entry
  point; `vad/` removed), `mods/common/src/assistants` (assistant schema: catalog ids instead of
  provider enum and inline `apiKey`, `vad` and `maxSpeechWaitTimeout` moved out).
- **Dependencies:** removes `onnxruntime` and the Silero model from Autopilot; removes LangChain
  chain usage in favor of the provider registry's LLM interface.
- **Depends on:** `add-voice-session-gateway`, `add-turn-taking`, `rework-voice-sdk`,
  `add-provider-registry`, `add-call-record`.
- **Users:** assistant configs are migrated (see design); callers get faster replies and fewer
  false cut-offs. Autopilot apps need no code changes.
