# Autopilot

Autopilot is the AI that answers the phone. It is an ordinary application: the gateway dials it
like any app, and it uses only the public [session protocol](./session-protocol.md). Anything
Autopilot does, your own app can do too.

## How a call runs

1. A number points to an app whose URL is the hosted Autopilot. The gateway opens a signed session.
2. Autopilot verifies the signature, loads the app's assistant, subscribes to `turn.estimate` and
   speaks the first message.
3. It listens to [turn events](./turn-taking.md). On `turn.likely_ended` it may start a reply
   silently; on `turn.resumed` it drops it; on `turn.ended` it answers.
4. The reply streams: language model tokens become sentence-sized `speak` pieces with one `id`, so
   the first sentence plays while the rest is still being written.
5. When the caller talks over the agent, the gateway reports `turn.user_started`; with barge-in
   allowed, Autopilot sends `clear`. The history keeps only what the caller heard.

States: greeting, listening, thinking, speaking, transferring, ended. The idle clock runs only
while listening.

## Pacing

`conversationSettings.patience` is the turn-taking knob: `low`, `normal` (default) or `high`.
Autopilot sends it to the gateway with `listen.update`, so the gateway's Pacing policy waits less
or more before `turn.ended` (see [patience](./turn-taking.md#patience)). At `low` and `normal`
Autopilot prepares a reply on `turn.likely_ended`; at `high` it waits for `turn.ended`.

Within a call the gateway adapts its timing to a caller who pauses often. Autopilot adapts its own
preparation: after three `turn.resumed` in one call it stops preparing early for the rest of the
call and notes it in the call record (`autopilot.note`, `pacing.adapted`). Nothing is remembered
across calls.

## Honest history

What the caller heard is what the model remembers:

- `output.done`: the whole reply is stored.
- `output.interrupted`: only `heardText` is stored.
- A new turn that arrives while a reply is being written cancels it; what was already heard of it
  is stored before the new user message.

Tool calls and their results are stored as tool messages, and the model continues from them; there
is no synthetic "write a message based on the tool results" prompt.

## Tools and knowledge

- **Tools** run behind a port: "run tool X with these inputs". HTTP tools come from
  `languageModel.tools`, as before. `hangup` and `transfer` are built in (`transfer` only when
  `transferOptions` is set). A tool's `requestStartMessage` is spoken while the tool runs.
- **Knowledge** runs behind a port: "find what is relevant to this question". It is asked once per
  reply with an 800 ms limit and its answer goes to the model for that request only, never into the
  history. The S3 + Unstructured knowledge bases are configured by the operator
  (`knowledge` in `autopilot-session.yaml`), with keys by credential ref.

## Models by catalog id

`languageModel.model` is one catalog id, `<provider>/<model>`, for example `openai/gpt-4o-mini`.
Autopilot asks the provider registry which provider serves it and with which credential ref, then
uses the workspace's own key for that ref if it has one, otherwise the platform key. No key lives
in the assistant. A retired model resolves to its replacement; using a deprecated or retired model
is noted in the call record (`provider.deprecated_used`, `provider.retired_used`). If the model
cannot be reached, Autopilot says the `systemErrorMessage` and hangs up.

## Call record, not webhooks

Each turn leaves a trace in the call record (`autopilot.turn`): the user text, the reply, what was
heard, whether it was interrupted, tool calls, and timings from `turn.ended` to the first token and
to the first `speak`. The gateway already records every session message.

The assistant webhooks (`eventsHook`, `conversation.started`, `conversation.ended`) are retired.
Use workspace webhooks instead: `call.started`, `call.ended`, and `call_record.sealed`, which links
to the call record with the transcript and recording.

## Assistant settings

| Setting | Meaning |
| --- | --- |
| `conversationSettings.firstMessage` | Spoken when the call starts (optional) |
| `systemPrompt`, `goodbyeMessage`, `systemErrorMessage` | As before |
| `initialDtmf` | Digits sent after answering (optional) |
| `maxSessionDuration` | Ends the call with the goodbye (default 30 minutes) |
| `transferOptions` | `{ phoneNumber, message }`; offers the `transfer` tool |
| `idleOptions` | `{ message, timeout, maxTimeoutCount }` |
| `allowUserBargeIn` | Whether the caller can cut the agent off (default true) |
| `patience` | `low`, `normal` (default) or `high` |
| `filler` | `{ url }`: played while thinking; the reply cuts it off |
| `voice`, `language` | Catalog ids overriding the app's speech defaults on every `speak` |
| `languageModel.model` | Catalog id |
| `languageModel.temperature`, `maxTokens`, `tools`, `knowledgeBase` | As before |

## Migrating an assistant

What changed from the previous assistant format:

| Before | After |
| --- | --- |
| `languageModel.provider` + `model` | `languageModel.model: "<provider>/<model>"` |
| `languageModel.apiKey` | Removed. A real key becomes the workspace's vendor key for that provider (Secret `provider-key/<provider>`, the same as the dashboard's Vendor keys); a key the workspace already has wins. Placeholders are dropped |
| `languageModel.baseUrl` | Removed; endpoints come from the provider registry |
| `maxSpeechWaitTimeout: 0` (the default) | `patience: normal` (today's timing) |
| `maxSpeechWaitTimeout` above 0 | `patience: high` (about 1.6 × the gateway's silence timeout, more as it adapts) |
| `vad.*` | Removed; turn detection runs in the gateway. Custom values produce a notice: use the app's audio filters for noisy lines or a more patient setting |
| `allowUserBargeIn` | Unchanged; sets `interruptible` on every `speak` and whether Autopilot sends `clear` |
| `transferOptions.timeout` | Removed |
| `eventsHook` | Removed; the migration creates a workspace webhook for the same URL |
| `audioFilters` | Moved to the app's configuration |

Each conversion returns plain-language notices for the workspace, so owners see what changed.
Validation rejects the removed fields with a message naming where each moved, so an old config
never runs half-converted.

## Running the hosted Autopilot

```bash
cp config/autopilot-session.example.yaml config/autopilot-session.yaml
node mods/autopilot/dist/session/main.js --config config/autopilot-session.yaml
```

The file names the signing secret the gateway uses for Autopilot apps, where apps and assistants
come from, the registry catalog, platform keys by credential ref, optional workspace Secrets,
endpoint overrides and the knowledge settings.
