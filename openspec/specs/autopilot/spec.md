# autopilot Specification

## Purpose
The Autopilot AI voice agent: how it runs a conversation over a voice session and how it is configured.

## Requirements

### Requirement: Autopilot reacts to turn events and never detects turns itself

Autopilot SHALL decide when to listen, prepare and speak only from AppBridge's turn events and,
when subscribed, `turn.estimate`. It MUST NOT run voice activity detection or read raw caller
audio.

#### Scenario: Normal turn

- **WHEN** the scripted session sends `turn.user_started`, then `turn.ended` with text "What are your hours?"
- **THEN** Autopilot moves to thinking and then sends `speak` pieces with one `id` carrying the reply
- **AND** it never requests the Audio layer

#### Scenario: Backchannel is ignored

- **WHEN** Autopilot is speaking and the session sends `turn.backchannel` with text "uh-huh"
- **THEN** Autopilot sends no `clear` and keeps speaking

#### Scenario: Subscribing to the estimate

- **WHEN** a session starts
- **THEN** Autopilot sends `subscribe` with `events` including `turn.estimate`

### Requirement: Pacing policy

Autopilot SHALL apply a pacing policy that sets how patient it is per agent and MAY adapt
within a call. The policy MUST only change when Autopilot prepares and speaks, never what it
says.

#### Scenario: Patient agent waits for the detector's final event

- **WHEN** an agent is configured as patient and the session sends `turn.likely_ended`
- **THEN** Autopilot may prepare a reply but sends no `speak` until `turn.ended`

#### Scenario: Adapting to a caller who pauses often

- **WHEN** a caller resumes after `turn.likely_ended` three times in one call
- **THEN** Autopilot raises its patience for the rest of that call
- **AND** records the adjustment in the call record

### Requirement: Replies stream into speech

Autopilot SHALL stream LLM tokens into speech so the first sentence is spoken before the reply is
complete. All pieces of one reply MUST share one `speak` `id`, and the last piece MUST carry
`last: true`.

#### Scenario: First sentence starts before generation ends

- **WHEN** the fake LLM streams "Sure. We open at nine. We close at five." with a delay between sentences
- **THEN** the first `speak` piece is sent before the fake LLM finishes
- **AND** the final piece carries `last: true`

#### Scenario: Prepared reply is discarded on resume

- **WHEN** Autopilot starts preparing on `turn.likely_ended` and the session sends `turn.resumed`
- **THEN** Autopilot aborts the generation and sends no `speak`
- **AND** nothing from that generation enters the history

### Requirement: Barge-in stops speech and keeps history honest

When the caller interrupts, Autopilot SHALL stop its speech with `clear` and SHALL store in the
history only the text the caller heard. It SHALL keep reading the interrupted model response to its
end without speaking it, so the vendor's usage report for the request is received.

#### Scenario: Interrupted reply

- **WHEN** Autopilot is speaking reply `r1` and the session sends `turn.user_started`
- **THEN** Autopilot sends `clear`
- **AND WHEN** the session sends `output.interrupted` for `r1` with `heardText` "We open at nine."
- **THEN** the history holds "We open at nine." for that reply, marked as interrupted, and not the full text

#### Scenario: Barge-in disabled

- **WHEN** the agent disallows barge-in and the session sends `turn.user_started` while Autopilot speaks
- **THEN** Autopilot sends no `clear`

#### Scenario: A new turn cancels an in-flight reply

- **WHEN** Autopilot is thinking about turn A and the session sends `turn.ended` for turn B
- **THEN** the generation for turn A is discarded, read to its end for its usage, and nothing from it
  enters the history
- **AND** Autopilot answers turn B with turns A and B in the history as user messages

#### Scenario: An interrupted reply is still metered

- **WHEN** the caller interrupts reply `r1` while the model is still streaming it
- **THEN** no further text from `r1` is spoken or added to the history
- **AND** Autopilot reads the response to its end and reports the vendor's token counts for it

### Requirement: Tools are structured and behind a port

Autopilot SHALL store tool calls and tool results as structured tool messages and SHALL continue
the reply from them without a synthetic user prompt. Tools MUST be invoked through a tool port.

#### Scenario: Tool call during a turn

- **WHEN** the fake LLM requests tool `getHours` and the fake tool port returns `{"open":"9"}`
- **THEN** the history holds a tool-call message and a tool-result message
- **AND** the LLM's next request contains those messages and no user message other than the caller's

#### Scenario: Tool start message

- **WHEN** the requested tool has a `requestStartMessage`
- **THEN** Autopilot speaks it with `speak` before the tool returns

#### Scenario: Tool failure

- **WHEN** the tool port returns an error
- **THEN** a tool-result message records the error and the LLM continues the reply

### Requirement: Built-in hangup and transfer

Autopilot SHALL offer `hangup` and `transfer` as built-in tools that end with the session commands
`hangup` and `transfer`. When a transfer fails (`transfer_failed`), Autopilot SHALL speak the agent's
`transferOptions.failedMessage` (optional; default "Sorry, I couldn't connect you. How else can I
help?"), turn its idle timer back on and listen again, so the conversation goes on.

#### Scenario: Hangup tool

- **WHEN** the fake LLM calls `hangup`
- **THEN** Autopilot speaks the goodbye message and, after `output.done`, sends `hangup`

#### Scenario: Transfer tool

- **WHEN** the fake LLM calls `transfer` and the agent has a transfer number
- **THEN** Autopilot speaks the transfer message, moves to transferring and sends `transfer` with that number

#### Scenario: Transfer fails

- **WHEN** the fake LLM calls `transfer` and AppBridge answers the transfer with `error` `transfer_failed`
- **THEN** Autopilot speaks the failed-transfer message and returns to listening with its idle timer on
- **AND** the caller's next turn gets a reply from the language model

### Requirement: Plugs, not vendors

Autopilot SHALL reach language models through the provider registry by catalog id, and knowledge
and tools through ports. Agent configs MUST NOT contain vendor credentials.

#### Scenario: Model chosen by catalog id

- **WHEN** an agent names `openai/gpt-4o-mini`
- **THEN** Autopilot obtains a streaming LLM from the provider registry for that id
- **AND** no vendor key appears in the agent config or Autopilot's environment

#### Scenario: Agent config with an inline key

- **WHEN** an agent config contains `apiKey`
- **THEN** validation rejects it with a message pointing to workspace secrets

#### Scenario: Voice override

- **WHEN** an agent sets a voice different from the app default
- **THEN** each `speak` Autopilot sends carries that voice's catalog id

#### Scenario: Recognition hints

- **WHEN** an agent lists recognition `hints` (names, brands)
- **THEN** Autopilot sends them with `listen.update` when the session starts, and AppBridge adds
  them to the app's default hints

### Requirement: Idle handling

Autopilot SHALL run its idle clock only while listening, announce idleness with the idle message,
and end the call after the configured maximum number of idle announcements.

#### Scenario: Idle message then goodbye

- **WHEN** the session sends no turn events for the idle timeout twice, with a maximum count of 2
- **THEN** Autopilot speaks the idle message once, then the goodbye message, then sends `hangup`

#### Scenario: Idle clock paused while speaking

- **WHEN** Autopilot is speaking for longer than the idle timeout
- **THEN** no idle message is sent until speech ends and the timeout elapses again

#### Scenario: A turn with no words is not an answer

- **WHEN** a turn ends with no words (line noise, an abandoned start) after an idle message
- **THEN** Autopilot sends no reply, keeps its idle count, and still says goodbye and hangs up on
  the next idle timeout

### Requirement: Optional filler while thinking

When the agent config sets a filler, Autopilot SHALL play it with `play` while it prepares a
reply and MUST stop it when it speaks. Autopilot MUST NOT rely on any platform "thinking" signal,
and MUST NOT play a filler when none is configured.

#### Scenario: Filler configured

- **WHEN** the agent sets a filler URL and the session sends `turn.ended`
- **THEN** Autopilot sends `play` with that URL and `interruptible: true` before its first `speak`
- **AND** its first `speak` for the reply carries `preempt: true`, so the filler stops

#### Scenario: No filler configured

- **WHEN** the agent sets no filler and the session sends `turn.ended`
- **THEN** Autopilot sends no `play` before its first `speak`

### Requirement: No agent webhooks

Autopilot SHALL NOT send `conversation.started` or `conversation.ended` webhooks; the agent
config MUST NOT accept an `eventsHook` block. Call notifications come from workspace webhooks.

#### Scenario: Old config with eventsHook

- **WHEN** an agent config containing `eventsHook` is validated
- **THEN** validation fails with an error naming `eventsHook` and pointing to workspace webhooks

### Requirement: Conversation events in the call record

Autopilot SHALL add to the call record, per turn, the user text, the reply text, what was heard,
interruptions, tool calls and results, and timings from turn end to first token and to first
audio.

#### Scenario: Complete turn trace

- **WHEN** a scripted call has one normal turn and one interrupted turn
- **THEN** the call record holds both turns with reply text, heard text and timings
- **AND** the interrupted turn is marked as interrupted

### Requirement: Session limits

Autopilot SHALL end the call with the goodbye message when the maximum session duration is
reached, and SHALL stop all work when the session ends.

#### Scenario: Maximum duration

- **WHEN** the maximum session duration elapses during a call
- **THEN** Autopilot speaks the goodbye message and sends `hangup`

#### Scenario: Caller hangs up mid-reply

- **WHEN** the session sends `session.end` while Autopilot is generating a reply
- **THEN** Autopilot aborts the generation, sends nothing further and raises no unhandled error

### Requirement: A rejected vendor key fails the call at once

When a provider the call uses (the agent's language model, or the app's speech recognition or
voice) rejects the key (HTTP 401 or 403, on a request or a WebSocket handshake), its adapter SHALL
report a typed auth error naming the provider, nothing SHALL retry it, and the call SHALL be hung
up at once. The call record SHALL have status `failed` with reason `provider_auth_failed` and the
`provider`, never `completed`. Autopilot ends such a call with `hangup` carrying `failure`;
AppBridge ends a call whose speech provider rejected the key with a fatal `error` and hangs up.

#### Scenario: The language model rejects the key

- **WHEN** the caller asks a question and the agent's model provider answers with HTTP 401
- **THEN** Autopilot sends `hangup` with `failure: {reason: "provider_auth_failed", provider, kind: "llm"}`, without the error message and without asking the model again
- **AND** the call record has status `failed` with reason `provider_auth_failed` naming the provider

#### Scenario: Speech recognition rejects the key

- **WHEN** the app's speech recognition provider refuses the stream's handshake with HTTP 401
- **THEN** AppBridge sends a fatal `error` naming the provider, does not reconnect, and hangs up
- **AND** the call record has status `failed` with reason `provider_auth_failed` naming the provider

#### Scenario: The voice rejects the key

- **WHEN** the app's voice provider answers the greeting's `speak` with HTTP 401
- **THEN** AppBridge sends a fatal `error` related to that `speak`, does not ask again, and hangs up
- **AND** the call record has status `failed` with reason `provider_auth_failed` naming the provider

### Requirement: Autopilot is an ordinary application

Autopilot SHALL run as a hosted `VoiceServer` and SHALL use only public session messages of the
fonoster protocol. It MUST NOT depend on any private interface to AppBridge or the Roomr node.
Because every Autopilot app shares one signing secret, the hosted Autopilot SHALL require its
`publicUrl` (the URL Autopilot apps point to) and verify signatures against it only, never against
the request's `Host` header; it SHALL require the app-bound signature (`voice-session`,
"Connection requests are bound to the app") and serve a session only when `session.start` names
the signed app and that app belongs to the signed workspace.

#### Scenario: A call reaches Autopilot like any app

- **WHEN** a number points to an app whose URL is the hosted Autopilot
- **AND** AppBridge opens a signed fonoster-protocol session with `session.start`
- **THEN** Autopilot verifies the signature, loads the agent for that app and speaks the first message with `speak`
- **AND** every message it sends is part of the public session protocol

#### Scenario: Bad signature

- **WHEN** a connection arrives without a valid signature
- **THEN** Autopilot rejects it before loading any agent

#### Scenario: Signature for another tenant's app

- **WHEN** a connection carries a valid signature bound to app A of workspace W1 and its
  `session.start` names app B, or app A no longer belongs to W1
- **THEN** Autopilot closes the session without running app B's (or A's) agent

#### Scenario: Missing public URL

- **WHEN** the hosted Autopilot's config has no `publicUrl`
- **THEN** it refuses to start, naming `publicUrl`
