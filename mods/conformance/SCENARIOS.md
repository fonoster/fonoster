# Conformance scenario format (`fonoster.scenario.v1`)

A scenario is a YAML file that scripts one side of a contract and states what the other side must
send back, and how fast. Every runner (TypeScript here, the Python SDK suite, the Go media node
runner) executes the same files. The machine-readable definition is
[`schema/scenario.schema.json`](./schema/scenario.schema.json); every file in `scenarios/` must
validate against it.

YAML is the authoring format because scenarios are written and reviewed by people. The JSON Schema
is the contract: runners in any language parse the YAML into plain data and validate it with their
own JSON Schema library, so they all reject the same malformed files.

## Layout

```
scenarios/
  voice-session/                  # runner plays the app, the gateway is under test
  twilio-media-streams-flavor/    # runner plays a Twilio Media Streams app
  voice-sdk/                      # runner plays the gateway, an SDK fixture app is under test
  media-control/                  # runner plays the gateway against a media node (fake or Go) over NATS
  autopilot/                      # runner plays the gateway, Autopilot (with setup.assistant) is under test
  turn-taking/                    # runner plays the app, the gateway's turn-taking is under test
  regions/                        # runner plays a region's cell, the control plane is under test
  audio/                          # recorded caller audio (raw PCM16LE mono 16 kHz)
```

The file name is the scenario `name` plus `.yaml`. A scenario belongs to exactly one contract.

## Top-level fields

| Field | Required | Meaning |
| --- | --- | --- |
| `format` | yes | Always `fonoster.scenario.v1`. A breaking change to this format gets a new value. |
| `name` | yes | Kebab-case, equal to the file name. |
| `contract` | yes | `voice-session`, `twilio-media-streams-flavor`, `voice-sdk`, `media-control`, `autopilot`, `turn-taking` or `regions`. |
| `role` | yes | The side the runner plays: `app`, `gateway`, `media-control-client` or `region-cell`. |
| `spec` | no | The requirement and scenario this file proves: `"Requirement / Scenario"`. |
| `description` | no | Free text. |
| `fixture` | `voice-sdk` | The fixture app the SDK runner starts (see Fixtures). |
| `tags` | no | Used to select subsets. In use: `timing` (needs real time, loose limits on shared runners) and `slow` (run in the nightly job or on request). Runners may ignore tags they do not know. |
| `skip` | no | A reason; the scenario is reported as skipped, never silently dropped. |
| `ignore` | no | Message types that `expect` and `expect_none` never look at. |
| `setup` | no | How the harness prepares the fakes before the first step. |
| `steps` | yes | Executed in order. The first failing step fails the scenario. |

## Steps

Each step has exactly one action key.

| Action | Meaning |
| --- | --- |
| `send: {…}` | Send a JSON text frame. Strings may use `${var}` (see Variables). |
| `send_audio: {ms, kind, track, realtime}` | Send `ms` of audio as binary frames in the session's announced format. `kind` is `silence`, `tone` (default) or `file`. Paced at 20 ms per frame unless `realtime: false`. |
| `expect: {…}` | Wait for a JSON frame matching the pattern (see Matching). |
| `expect_none: {…}`, `for_ms` | Fail if a frame matching the pattern arrives within `for_ms`. |
| `expect_audio: {track, ms}` | Wait until at least `ms` (or a matcher) of audio has arrived on `track` since the previous step. |
| `expect_close: {code}` | Wait for the peer to close the socket. |
| `wait: {ms}` | Sleep. Use sparingly; prefer an `expect` with a timing limit. |
| `inject: {tts|stt|llm: {…}}` | Change a fake provider's behaviour from this point on. |
| `assert: {name: value}` | Evaluate named harness assertions (see Assertions). |
| `close: {code, reason}` | Close the socket from the runner's side. |
| `control: {op, …}` | The harness acts on the implementation under test's management side. `regions`: `enroll` (`token`: `issued` (default), `reissued`, `expired` or `invalid`; the answer arrives as a `region.enrollment` frame with the HTTP `status`, and on success the runner's cell link opens), `reissue`, `disconnect`, and `relay` (`callRef`: a member reads that call's recording through the control plane; the answer arrives as a `relay.result` frame). |
| `caller: {dtmf | hangup | audio | drop | nodeCrash}` | The fake media node acts as the caller: presses keys (`dtmf: "12#"`), hangs up (`hangup: true`) or speaks (`audio`, same shape as `send_audio`, replacing any caller audio still pending). `drop: {reason, sipStatus?}` makes the node end the room with a media-control reason; `nodeCrash: true` kills the node (no heartbeats, replies or events). |

With the `twilio` protocol, `send_audio` sends μ-law 8 kHz `media` events (base64 payloads) using the
`streamSid` from the `start` message, and `expect_audio` counts incoming `media` events.

A step may also carry `label` (so later steps can measure from it) and `capture` (see Variables).

## Matching

`expect` and `expect_none` take a pattern that is compared with incoming JSON frames:

- **Partial objects.** Every key in the pattern must be present and match; extra keys in the frame
  are ignored. This mirrors the protocol rule that unknown fields are ignored.
- **Literals** (string, number, boolean, null) must be equal.
- **Arrays** must have the same length and match element by element, unless written with
  `$includes`.
- **`"*"`** matches any value that is present (including null). To match the literal string `*`
  write `{ $eq: "*" }`.
- **Operators**, written as a one-key object whose key starts with `$`:

  | Operator | Matches |
  | --- | --- |
  | `$eq: v` | exactly `v`, with no partial-object rules |
  | `$absent: true` | the key is not present |
  | `$gte: n`, `$lte: n`, `$gt: n`, `$lt: n` | numeric comparisons |
  | `$near: n`, `$tolerance: t` | `|value − n| ≤ t` (both keys in one object) |
  | `$contains: "s"` | a string containing `s` |
  | `$re: "pattern"` | a string matching the regular expression (ECMAScript / RE2 common subset) |
  | `$oneOf: [a, b]` | any of the listed patterns |
  | `$includes: [p…]` | an array containing, in any order, an element matching each pattern |
  | `$excludes: [p…]` | an array with no element matching any of the patterns |

**Order.** Frames are consumed in arrival order. `expect` skips frames that do not match, then
consumes the first one that does, so two consecutive `expect` steps prove the second message came
after the first. Frames whose `type` (or Twilio `event`) is listed in `ignore` are never matched.
Binary frames are counted for `expect_audio` and never matched by `expect`.

A frame consumed by one `expect` cannot satisfy a later one. With `next: true`, an `expect` does not
skip: the next unconsumed JSON frame (ignored types aside) must match.

## Timing

Any `expect`, `expect_audio` or `expect_close` step can carry:

| Key | Meaning |
| --- | --- |
| `within_ms` | The match must arrive within this wall-clock time of the anchor. |
| `budget_ms` | Like `within_ms`, but fake-provider delays that overlap the interval are subtracted first. This is how the gateway's own added time is measured (pass bar T1). |
| `not_before_ms` | The match must not arrive earlier than this. Used for marks, which return only after the audio queued before them has played. |
| `from` | The `label` of an earlier step to measure from. The default anchor is the end of the previous step. |

Without `within_ms` or `budget_ms`, a step waits up to the runner's default timeout (5 s).

Timing limits in scenarios that run on every pull request are functional checks with loose limits.
The strict pass bar T1 (50 ms at p95) is computed by the timing suite over many runs on dedicated
runners, not from a single scenario run.

## Variables

`capture: {var: path}` on an `expect` step stores values from the matched frame, where `path` is a
dotted path such as `start.streamSid` or `tracks.0.id`. Later `send` steps may use `${var}` inside
strings. A string that is exactly `"${var}"` is replaced by the captured value with its type (so a
number stays a number). Built-in variables: `${scenario}` (the scenario name) and, from the fakes harness, `${media}`: the
base URL of a test media server serving `tone-<ms>.wav` (a 16 kHz tone of that length) and
returning 404 for anything else.

## Setup

`setup` prepares the fakes before the first step; a runner that cannot honour a setup key fails the
scenario rather than ignoring it.

| Key | Meaning |
| --- | --- |
| `call` | The call the fake media node offers to the gateway: `direction`, `from`, `to`, `metadata`, `callRef`. With `direction: outbound` the runner places the call as the control plane does and the app's socket opens when the callee answers (`media.dialOutcome`). |
| `app` | The app under test (`app-1`): `protocol`, `signingSecret` (what the gateway signs with), `verifySignature`, `verifySecret` (what the fake app checks, when a rotation has not reached it), `reachable`, `fallback` (`{app: app-2}` or `{message}`), `speech`, `filters`, `workspaceRef` (both apps' workspace; Twilio's `accountSid`). |
| `listener` | `voice-session`: a listen-only socket on `app-2` with `tracks`; `peer: listener` makes the runner play the listener while `app-1` stays silent. |
| `providers` | Initial fake provider behaviour (same shape as `inject`). |
| `callerAudio` | Audio the fake media node plays as the caller once the call is answered. |
| `assistant` | `autopilot` only: the assistant config Autopilot runs for this scenario. |
| `media` | Fake media node behaviour: `dialOutcome` for `participant.dial` and transfers (`answered`, `busy`, `no_answer`, `failed`); `appRef` sent as Routr's `X-App-Ref`; `heartbeatMs`; `claimCalls: false` (media-control only) makes the runner leave `call.incoming` unclaimed. |
| `catalog` | `voice-session` only: the provider catalog the gateway resolves ids with. The runner registers the `fake` provider, a TTS model and `fake/default`, then each listed voice (`{id, state, replacement}`), deprecating or retiring it as `state` says. |

#Besides the app under test (`app-1`), voice-session runners configure a second app, `app-2`,
served by the harness: the target of `fallback`, `handoff` and routing (`media.appRef: app-2`), and
the listen-only socket. The runner plays whichever app the gateway reaches first. A call set up
never to reach an app (unreachable or refusing app without `fallback.app`, busy or unanswered
outbound callee) gives the runner no socket: such scenarios use only `wait`, `caller` and `assert`.
Every runner registers the audio filter `conformance-mute`, which silences every caller frame.

## Fake provider behaviour

| Key | Meaning |
| --- | --- |
| `delayMs` | Fixed delay before the provider's first byte. Subtracted by `budget_ms`. |
| `failNext` | The next request fails: `provider_unavailable` (HTTP 503), `provider_timeout` (no response), `bad_request` (HTTP 400). |
| `script` | STT: `[{atMs, text, final}]` transcripts keyed to caller-audio time. LLM: replies in order, each `{content, chunkDelayMs?}` (a pause after every sentence) or `{tool_calls: [{name, arguments}]}`. |

## media-control scenarios

With `role: media-control-client` the runner plays the gateway and control plane against a media
node over NATS: `send` is a command (a NATS request on `media.<nodeId>.commands`) and its reply
(`ack` or `error`, or `no_reply` after 2 s) arrives as a frame; room events, `node.heartbeat`,
`node.down` and `call.incoming` (which the runner claims unless `claimCalls: false`) arrive as
frames too. `caller: {call: {to, from, appRef, callRef}}` makes a call arrive at the node, as an
INVITE from Routr would. Replies and events travel on different subjects, so do not rely on their
relative order. Against the fake node `caller` steps drive the fake; against a real node the
harness drives a SIP caller bot.

## regions scenarios

With `role: region-cell` the runner plays a region's cell against the control plane. Everything the
control plane sends on the cell's link (`region.<ref>.config`, `revoked`, `secrets.needed`,
`endpoints.request`, `relay`) arrives as a frame. A `send` frame names its subject relative to
`region.<ref>.` and is published, or sent as a request with `request: true` (the reply, or
`no_reply` after 3 s, arrives as a frame); `respond: true` answers the latest relay request instead.
The link opens after a successful `control: {op: enroll}`. `${region}` is the region's ref and
`${workspace}` the workspace it serves. The control plane's link messages and the harness's HTTP
results travel separately, so expect only orders the contract guarantees.

## Assertions

`assert` names checks that a harness evaluates against its fakes. Measurements that refer to a
point in time (such as `media.output_silent_within_ms`) start at the end of the previous step, or
at the step named by `from`. Each value is a literal or a
matcher, compared with what the harness measured.

| Assertion | Measured value |
| --- | --- |
| `media.output_silent_within_ms` | ms between the previous step and the last agent-audio packet the fake media node received |
| `media.output_audio_ms` | ms of agent audio the fake media node has received since the previous step |
| `media.commands` | the list of `media-control` commands received (for `$includes`) |
| `media.held` | whether the fake media node has the caller on hold |
| `media.sip` | SIP statuses the caller received, in order (180 for `ring`, 200 for `answer`, refusals such as 404 or 503) |
| `providers.vendor_calls` | network calls to anything other than the fakes (always expected to be `0`); needs a harness that watches egress, such as a proxy around the implementation |
| `providers.tts.requests`, `providers.stt.requests`, `providers.llm.requests` | requests (or streams) the fake provider has served |
| `providers.llm.last_messages` | the `messages` of the fake LLM's latest request (how history is checked) |
| `record.events.<type>` | the call record's gateway events of that type, e.g. `record.events.turn.label` (needs a harness that can read the record) |
| `record.messages.<type>` | the call record's entries of that type from any source (app commands, gateway messages, events), each with `source` and `at`, e.g. `record.messages.record.note` |
| `webhooks.events` | the lifecycle events the gateway handed to the webhook dispatcher, in order, each as `{type, ...data}` |
| `app.attempts` | `app-1`'s connection attempts, each `{accepted, reason?}` (refused signatures show as `accepted: false`) |
| `app.text_frames` | text frames `app-1` received that were not JSON objects (always `0` with the `fonoster` protocol) |
| `other_app.messages` | every JSON message `app-2` received (fallback, handoff target or listener) |
| `other_app.audio_tracks` | the distinct track ids (first byte) of the binary frames `app-2` received, sorted |
| `providers.tts.voices` | the voice each fake TTS request named, in order |
| `regionStatus` | `regions`: the region's status as its owner sees it (`waiting`, `connected`, `degraded`, `offline`, `unsupported`) |
| `liveCredentials`, `revokedCredentials` | `regions`: how many of the region's issued credentials are live or revoked |
| `tools.calls` | names of the fake tools called (`${media}/tool/hours` answers `{"open":"9"}`, `${media}/tool/error` fails) |

A runner that does not know an assertion name fails the step; it never passes it silently.

## Fixtures (`voice-sdk`)

SDK scenarios exercise an app written with the SDK. `fixture` names that app; every SDK runner
ships one implementation per fixture, written idiomatically in its language. The fixture's
behaviour is described in `scenarios/voice-sdk/FIXTURES.md` and is part of the contract: two SDKs
implementing the same fixture must produce the same frames.

## Running the files from another language

A runner needs, in any language: a YAML parser; a JSON Schema validator (validate every file
against `schema/scenario.schema.json` before running it and fail on any error); the matcher
(partial objects, `*` and the `$` operators above); a WebSocket client or server for the role it
plays; and the signature headers (`X-Fonoster-Timestamp`, `X-Fonoster-Signature`, see
`docs/session-protocol.md`) for roles that dial or verify an app. Steps run in order and the first
failure fails the scenario. Report every scenario as passed, failed or skipped, never silently
omitted, and fail any scenario that uses a `setup` key, action or assertion the runner does not
implement. `python/fonoster-conformance` is the reference second implementation; the Go media node
runs the `media-control` files through `mods/conformance/test/media-control-go.test.ts`.
Point other runners at the published `@fonoster/conformance` package of the same version (the Python
runner reads it from `FONOSTER_CONFORMANCE_DIR`) rather than copying the files.

## Versioning

The format only grows: new optional keys, new actions, new operators and new assertions. Runners
must reject unknown keys (the schema forbids them), so a scenario that uses a newer feature fails
loudly on an older runner instead of passing by accident. Removing or changing the meaning of a key
needs `format: fonoster.scenario.v2`.
