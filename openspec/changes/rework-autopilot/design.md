## Context

Autopilot (`mods/autopilot`) is the AI that talks on the phone. Today it is a voice app built on
`@fonoster/voice`:

- `handleVoiceRequest.ts` loads an assistant config (file or API), builds an S3 knowledge base,
  creates a LangChain-backed language model and starts `Autopilot`.
- `Autopilot.ts` runs a Silero VAD on the raw stream (`voice.stream()`) and listens to STT results
  (`voice.sgather()`), feeding `SPEECH_START`, `SPEECH_END` and `SPEECH_RESULT` into an xstate
  machine.
- `machine/machine.ts` has the states greeting, idle, announcingIdleTimeout, listeningToUser,
  waitingForSpeechTimeout, processingUserRequest and hangup, plus `hasLateSpeech` and
  `maxSpeechWaitTimeout` logic.
- `models/AbstractLanguageModel.ts` calls `chain.invoke()` once, runs tool calls in sequence,
  stores tool results as AI messages, then calls `chain.invoke()` again with the synthetic prompt
  "Write a quick message based on the tools results".
- TTS and STT run in the apiserver; Autopilot cannot measure them. Outputs are two webhooks
  (`conversation.started`, `conversation.ended`) carrying the chat history and a recording URL
  built by string convention.

Known issues found while reading the code:

1. **Non-streaming turns.** The whole LLM reply is generated before `say()` starts.
2. **Second full invoke after tools.** Tool use adds a full round trip before any speech.
3. **Late-speech rewind race.** When late speech re-enters `processingUserRequest`, the earlier
   `doProcessUserRequest` promise keeps running. Its `messages.pop()` rewind and its later history
   writes can interleave with the new turn and remove or add the wrong messages.
4. **Tool results as AI messages** (`"tool result (x): ..."`), which weakens native tool calling.
5. **Hardcoded providers.** `LanguageModelProvider` is a fixed enum.
6. **Inline secrets.** `languageModel.apiKey` lives in the assistant config.

The rebuild moves Hear, Speak and turn detection into the VoiceSessionGateway, adds a provider
registry and a call record. This design makes Autopilot a client of those contracts.

## Goals / Non-Goals

**Goals:**

- Speech starts at the first sentence of the LLM reply.
- Autopilot reacts to turn events; it never decides end of turn from raw audio.
- The conversation history matches what the caller actually heard.
- Autopilot names capabilities and catalog ids, never vendors or keys.
- Every turn leaves a complete trace in the call record.
- Behavior is testable with a scripted fake session and fake plugs, with no audio.

**Non-Goals:**

- Rewriting Autopilot in another language or replacing xstate.
- Building a Turn Detector (that is `add-turn-taking`).
- Remembering callers across calls (deferred; privacy).
- Multi-agent workflows, visual flow builders or new assistant features beyond parity.

## Decisions

### A1. Improve, don't rewrite

Keep TypeScript and xstate. None of the problems above come from the language or runtime; they
come from missing streaming, speech owned by the wrong layer, history semantics and a missing
event model. A later rewrite only has to pass the same conformance suite.

*Rejected:* rewriting in Go or Python now. It adds risk and time without fixing any listed
problem.

### A2. Autopilot is an ordinary session app

Autopilot runs as a hosted `VoiceServer` and uses only public session messages. If Autopilot needs
something, it becomes part of the public protocol, so developers can build agents of the same
quality.

*Rejected:* a private shortcut into the gateway or media node. It would let the two paths drift
and hide gaps in the public protocol.

### A3. Turn detection lives in the gateway; Autopilot keeps only pacing

The gateway's Turn Detector emits turn events to every client. Autopilot subscribes to
`turn.estimate` and applies its own pacing policy: when to start preparing, when to speak, how
patient to be. Patience is set per assistant and adapts within the call (for example, to a caller
who pauses a lot). Silero VAD, the raw-audio stream, `hasLateSpeech` and `maxSpeechWaitTimeout`
leave Autopilot.

*Rejected:* the detector inside Autopilot (an earlier decision). Simple apps would get worse
turn-taking, and there would be two detectors to maintain.

### A4. A smaller state machine

States: `greeting`, `listening`, `thinking`, `speaking`, `transferring`, `ended`.

| From | Event | To | Action |
| --- | --- | --- | --- |
| greeting | `output.done` (greeting) | listening | arm idle timer |
| greeting, speaking | `turn.user_started` (barge-in allowed) | listening | `clear` |
| listening | `turn.likely_ended` | listening | start preparing a reply (silent) |
| listening | `turn.resumed` | listening | discard the prepared reply |
| listening | `turn.ended` | thinking | finish or start the reply |
| thinking | first sentence ready | speaking | `speak` pieces, same `id` |
| speaking | `output.done` | listening | arm idle timer |
| speaking | `output.interrupted` | listening | record `heardText` only |
| any | `turn.backchannel` | same | nothing (not an interruption) |
| listening | idle timeout | speaking or ended | idle message, or goodbye after the maximum count |
| thinking | transfer tool | transferring | transfer message, then `transfer` |
| any | `session.end` or max duration | ended | goodbye when the call is still up |

The idle clock runs only in `listening`, which keeps the fix from the idle-clock bug.

### A5. Stream LLM tokens into `say(stream)`

The LLM interface streams tokens. Autopilot feeds them into `say(stream)`, which sends `speak`
pieces with one `id` and `last: true` at the end. On `turn.likely_ended`, Autopilot may start
generation early but sends nothing to the gateway until `turn.ended`. On `turn.resumed` it aborts
the generation and drops the partial text.

*Rejected:* one `say()` per sentence. Each sentence would start its own TTS request and add gaps.

### A6. Honest history

Only what the caller heard becomes history. On `output.done` the full text is stored. On
`output.interrupted` only `heardText` is stored, marked as interrupted. A new user turn that
arrives while a reply is in flight cancels that reply's generation; nothing from a cancelled turn
is written. This removes the rewind race (issue 3) by construction: history is written in one
place, after the outcome is known.

### A7. Structured tools behind a port

Tool calls and results are stored as tool-call and tool-result messages. After tools run, the LLM
continues from those messages; there is no synthetic user prompt. Tools sit behind a port with one
operation, "run tool X with these inputs". HTTP tools are the first implementation; MCP comes
later. Built-in `hangup` and `transfer` stay as tools. A tool's `requestStartMessage` is spoken
with `speak` and recorded as heard or interrupted like any other output.

### A8. Plugs, not vendors

- **Think:** the provider registry's streaming LLM interface, chosen by catalog id. LangChain's
  `RunnableSequence` is removed. Parameters the model does not accept are handled by the
  registry's compatibility rules.
- **Knowledge:** a port with one operation, "find what's relevant to this question". The S3 +
  Unstructured implementation moves behind it; its keys leave Autopilot's environment.
- **Tools:** see A7.
- **Hear and Speak:** the gateway's Speech layer. Autopilot passes voice and language as catalog
  ids per `speak` when the assistant overrides the app defaults.

Wiring happens outside the state machine: a small factory reads the assistant config, resolves
catalog ids and hands the machine its plugs.

### A9. Autopilot plays its own filler; filters live in the pipeline

Noise cancellation works on caller audio, so it belongs in the audio pipeline, configured per app.
There is no platform "thinking" signal (gateway decision VS21). An assistant may set an optional
filler (comfort noise or a soft sound, by URL or catalog asset); Autopilot plays it with `play`
when it enters `thinking` and stops it when it speaks, by sending its first `speak` with
`preempt: true`. With no filler configured, Autopilot plays nothing. Rejected: an explicit
`agent.state` message with gateway-played filler, and gateway inference from the gap between
`turn.ended` and the first `speak`.

### A10. Conversation events go to the call record

Autopilot records per turn: the user text, the reply text, what was heard, interruptions, tool
calls and results, and timings (turn end to first token, first token to first audio). Session
messages are already appended by the gateway; Autopilot adds only what the gateway cannot know
(LLM timings, tool latency, token counts).

### A11. Assistant config holds no secrets and no vendor enums

`languageModel.provider` + `model` become one catalog id (for example `openai/gpt-4o-mini`).
`apiKey` is removed; credentials come from the provider registry (platform keys or the
workspace's own keys).

### A12. Assistant webhooks are retired

**BREAKING.** The assistant `eventsHook` (`conversation.started`, `conversation.ended`) is removed.
Its job moves to workspace webhooks (`add-workspace-webhooks`): `call.started`, `call.ended` and
`call_record.sealed`, which links to the call record holding the transcript and recording. One
webhook system serves every app type. Rejected: keeping the assistant webhooks, slimmed or as
they are, which would leave two webhook systems and two copies of the same data.

## Risks / Trade-offs

- **Preparing early costs tokens.** Starting generation on `turn.likely_ended` wastes tokens when
  the caller resumes. Mitigation: pacing policy thresholds; measure the discard rate per call.
- **Dependence on the gateway's detector.** Autopilot quality now depends on another component.
  Mitigation: the opt-in estimate lets Autopilot tune its own pacing, and the conformance suite
  pins the turn events Autopilot relies on.
- **Interrupted history needs word timings.** If the TTS model lacks word timings, `heardText` is
  estimated from elapsed time and may be off by a few words.
- **Config migration.** Existing assistants use `provider` + `model` + `apiKey`. A wrong mapping
  would change behavior silently.

## Migration Plan

1. Map each existing `provider` + `model` pair to a catalog id; move inline `apiKey` values to
   workspace secrets (bring-your-own-key) and drop them from the config.
2. Move `vad` and `maxSpeechWaitTimeout` to the turn-taking configuration with equivalent values,
   so the baseline detector behaves like today.
3. Ship Autopilot as a hosted app; route existing Autopilot applications to it.
4. Rollback: the previous Autopilot image keeps working until `voice.proto` is retired.

## Open Questions

1. **Assistant schema migration.** Automatic rewrite of stored assistant configs, or a versioned
   schema that accepts both shapes for one release?
2. **Knowledge port shape.** Is "query returns passages" enough, or do we need ingest and
   citation metadata in the port?
3. **Initial DTMF and first message.** `initialDtmf` is sent after answer today. Keep it as an
   Autopilot setting or move it to app routing?
