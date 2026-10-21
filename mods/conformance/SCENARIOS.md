# Conformance scenario format (`fonoster.scenario.v1`)

A scenario is a YAML file that scripts one side of a contract and states what the other side must
send back, and how fast. Every runner (TypeScript here, the Python SDK suite, the Go Roomr node
runner) executes the same files. The machine-readable definition is
[`schema/scenario.schema.json`](./schema/scenario.schema.json); every file in `scenarios/` must
validate against it.

YAML is the authoring format because scenarios are written and reviewed by people. The JSON Schema
is the contract: runners in any language parse the YAML into plain data and validate it with their
own JSON Schema library, so they all reject the same malformed files.

## Layout

```
scenarios/
  voice-session/                  # runner plays the app, AppBridge is under test
  twilio-media-streams-flavor/    # runner plays a Twilio Media Streams app
  voice-sdk/                      # runner plays AppBridge, an SDK fixture app is under test
  media-control/                  # runner plays the controller and the app against a Roomr node (fake or Go)
  autopilot/                      # runner plays AppBridge, Autopilot (with setup.agent) is under test
  turn-taking/                    # runner plays the app, AppBridge's turn-taking is under test
  regions/                        # runner plays a region's cell, the control plane is under test
  billing/                        # runner plays the platform, billing (with the Stripe fake) is under test
  audio/                          # recorded caller audio (raw PCM16LE mono 16 kHz)
```

The file name is the scenario `name` plus `.yaml`. A scenario belongs to exactly one contract.

## Top-level fields

| Field | Required | Meaning |
| --- | --- | --- |
| `format` | yes | Always `fonoster.scenario.v1`. A breaking change to this format gets a new value. |
| `name` | yes | Kebab-case, equal to the file name. |
| `contract` | yes | `voice-session`, `twilio-media-streams-flavor`, `voice-sdk`, `media-control`, `autopilot`, `turn-taking`, `regions` or `billing`. |
| `role` | yes | The side the runner plays: `app`, `appbridge`, `media-control-client`, `region-cell` or `platform`. |
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
| `control: {op, …}` | The harness acts on the implementation under test's management side. `regions`: `enroll` (`token`: `issued` (default), `reissued`, `expired` or `invalid`; the answer arrives as a `region.enrollment` frame with the HTTP `status`, and on success the runner's cell link opens), `reissue`, `disconnect`, and `relay` (`callRef`: a member reads that call's recording through the control plane; the answer arrives as a `relay.result` frame). `billing`: see billing scenarios. |
| `stripe: {…}` | `billing`: the harness sets Stripe's state and failures (see billing scenarios). |
| `caller: {dtmf | hangup | audio | drop | nodeCrash}` | The fake Roomr node acts as the caller: presses keys (`dtmf: "12#"`), hangs up (`hangup: true`) or speaks (`audio`, same shape as `send_audio`, replacing any caller audio still pending). `drop: {reason, sipStatus?}` makes the node end the room with a media-control reason; `nodeCrash: true` kills the node (no heartbeats, replies or events). |

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
| `budget_ms` | Like `within_ms`, but fake-provider delays that overlap the interval are subtracted first. This is how AppBridge's own added time is measured (pass bar T1). |
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
| `call` | The call the fake Roomr node offers to AppBridge: `direction`, `from`, `to`, `metadata`, `callRef`. With `direction: outbound` the runner places the call as the control plane does and the app's socket opens when the callee answers (`media.dialOutcome`). |
| `app` | The app under test (`app-1`): `protocol`, `signingSecret` (what AppBridge signs with), `verifySignature`, `verifySecret` (what the fake app checks, when a rotation has not reached it), `reachable`, `fallback` (`{app: app-2}` or `{message}`), `speech`, `filters`, `workspaceRef` (both apps' workspace; Twilio's `accountSid`). |
| `listener` | `voice-session`: a listen-only socket on `app-2` with `tracks`; `peer: listener` makes the runner play the listener while `app-1` stays silent. |
| `providers` | Initial fake provider behaviour (same shape as `inject`). |
| `callerAudio` | Audio the fake Roomr node plays as the caller once the call is answered. |
| `agent` | `autopilot` only: the agent config Autopilot runs for this scenario. |
| `media` | Fake Roomr node behaviour: `dialOutcome` for outbound calls and transfers (`answered`, `busy`, `no_answer`, `failed`); `appRef` sent as Routr's `X-App-Ref`; `heartbeatMs`; `maxRooms` (the Go node's room limit, real-media harness). |
| `roomr` | `media-control` only: the node(s) under test and the fakes around them (see media-control scenarios). |
| `catalog` | `voice-session` only: the provider catalog AppBridge resolves ids with. The runner registers the `fake` provider, a TTS model and `fake/default`, then each listed voice (`{id, state, replacement}`), deprecating or retiring it as `state` says. |

#Besides the app under test (`app-1`), voice-session runners configure a second app, `app-2`,
served by the harness: the target of `fallback`, `handoff` and routing (`media.appRef: app-2`), and
the listen-only socket. The runner plays whichever app AppBridge reaches first. A call set up
never to reach an app (unreachable or refusing app without `fallback.app`, busy or unanswered
outbound callee) gives the runner no socket: such scenarios use only `wait`, `caller` and `assert`.
Every runner registers two audio filters: `conformance-mute`, which silences every caller frame,
and `conformance-boom`, which passes audio through and throws on the third frame.

## Fake provider behaviour

| Key | Meaning |
| --- | --- |
| `delayMs` | Fixed delay before the provider's first byte. Subtracted by `budget_ms`. |
| `failNext` | The next request fails: `provider_unavailable` (HTTP 503), `provider_timeout` (no response), `bad_request` (HTTP 400). |
| `script` | STT: `[{atMs, text, final}]` transcripts keyed to caller-audio time. LLM: replies in order, each `{content, chunkDelayMs?}` (a pause after every sentence) or `{tool_calls: [{name, arguments}]}`. |

## media-control scenarios

With `role: media-control-client` the runner plays the controller and the app against a Roomr node
(redesign-roomr): the fake node (`test/media-control.test.ts`) or the Go node
(`test/media-control-go.test.ts`), alone. Around the node the harness runs the caller bot (the
caller, the fake trunk the node dials through, and the fake registrar it registers with; in memory
against the fake node), the fake session endpoint (the app side of every control stream, with a
real UDP RTP app leg per call), the fake controller (a `roomr.v1.Roomr` client over every node),
four RTP parties (`rtp_a` .. `rtp_d`, for RTP participants and listener destinations), a local
HTTP server for hold music, and a TCP fault proxy between the nodes and NATS.

Frames: every event the node publishes (`roomr.events.<call_ref>`, `roomr.events.room.<room_ref>`,
`roomr.nodes.<node_ref>.events`, heartbeats and `node.down`), as published, and every message the
node sends on a control stream, as `stream.<member>` in snake_case: `stream.start`, `stream.dtmf`,
`stream.participant_joined`, `stream.participant_left`, `stream.transfer_result`, `stream.ended`,
and `stream.closed` when the stream ends. The three sources (events, heartbeats, streams) are not
ordered among each other, so `expect` keeps one cursor per source.

| Step | Effect |
| --- | --- |
| `rpc: {method, node?, request, reply?, error?, order?}` | The fake controller calls a Roomr RPC (`CreateCall`, `EndCall`, `CreateRoom`, `EndRoom`, `AddParticipant`, `RemoveParticipant`) on node `node` (default 0), with the request in the proto's snake_case. It must succeed and its reply match `reply`, or fail and `{code, reason, message}` match `error` (`code` is the gRPC status name, `reason` the ErrorInfo reason). `method: place` places a `CreateCall` across the nodes as a controller does (best heartbeat score first, the next on `RESOURCE_EXHAUSTED` or `UNAVAILABLE`, up to 3; `order` forces the order). `capture` reads the reply (or the error). An `AddParticipant` naming `${rtp_x}` starts that party's RTP to the node's side of the leg. |
| `caller: {call, name, audio, dtmf, mute, hangup}` | `call: {to, from, appRef, callRef, headers, codecs, name, node}` sends an INVITE to a node (`appRef` and `callRef` become `X-App-Ref` and `X-Call-Ref`); the other actions apply to the call `name` (default the last): a tone (`audio: {kind, ms, hz}`), RFC 4733 keys, no RTP at all (`mute: true`), BYE or CANCEL (`hangup`). |
| `app: {mode, sip_status, answer_after_ms, max_duration_s, call_ref, answer, send, audio, mute, kill}` | The fake session endpoint: `mode` for new streams (`answer` with Answer or Ready, `reject` with `sip_status`, `stall` never answering, `down` refusing connections), `answer` a stalled stream now, `send` one AppMessage in snake_case (`{hold: {music: "${media}/hold.wav"}}`, `{transfer: {to, mode}}`, `{send_dtmf: {digits}}`, `{add_listener: {...}}`), the app leg plays a tone (`audio`) or sends no RTP (`mute`), or every stream breaks (`kill`). |
| `trunk: {mode, after_ms, auth, challenge}` | How the trunk answers what a node dials: `answer`, `busy` (486), `unavailable` (480), `decline` (603), `no_answer` (rings until cancelled); with `auth` every INVITE is challenged (`challenge: 401` or `407`) until it carries those credentials. |
| `rtp: {name, audio, mute}` | An RTP party plays a tone or goes silent. |
| `nats: {drop, prefix, restore}` | Fault injection: `drop: connection` cuts the nodes' NATS connections and refuses new ones; `drop: messages` discards their publishes on subjects starting with `prefix` (default `roomr.`) while the connection stays up; `restore` ends both. |
| `node: {index, kill, sigterm}` | SIGKILL or SIGTERM a node. |

`setup.roomr`: `nodes` (default 1), `config` and `node_config[i]` (config overrides that shorten
timeouts and limits: `maxRooms`, `maxParticipants`, `maxDuration`, `mediaTimeout`,
`answerTimeout`, `readyTimeout`, `emptyRoomTimeout`, `drainWait`, `heartbeatInterval`,
`reregisterDelta`; and `region`, `roomHeader`, `callRefHeader` (default `X-Call-Ref`), `codecs`,
`registrations` against the fake registrar), `app`, `trunk` (initial behaviour, as the steps) and
`registrar: {username, password}` (the registrar requires digest auth). Variables: `${trunk}` (the
trunk's SIP URI, for `to.proxy`), `${media}` (the hold-music server), `${session}`, `${rtp_a}` ..
`${rtp_d}` (each an RTP endpoint `{ip, port, codec}`), `${node_kind}` (`go` or `fake`).
Scenarios tagged `go-node` need a real SIP stack and run against the Go node only.

The NATS-only scenarios of the retired offer-and-command contract (`one-replica-claims`,
`no-appbridge-answers`, `command-id-echoed`, `unknown-command-refused`, `ack-carries-results`,
`unknown-field-ignored`, `dtmf-scoped`) are gone with it.

## regions scenarios

With `role: region-cell` the runner plays a region's cell against the control plane. Everything the
control plane sends on the cell's link (`region.<ref>.config`, `revoked`, `secrets.needed`,
`endpoints.request`, `relay`) arrives as a frame. A `send` frame names its subject relative to
`region.<ref>.` and is published, or sent as a request with `request: true` (the reply, or
`no_reply` after 3 s, arrives as a frame); `respond: true` answers the latest relay request instead.
The link opens after a successful `control: {op: enroll}`. `${region}` is the region's ref and
`${workspace}` the workspace it serves. The control plane's link messages and the harness's HTTP
results travel separately, so expect only orders the contract guarantees.

## billing scenarios

With `role: platform` the runner plays the Fonoster platform against the billing service, with the
Stripe fake as Stripe (and, nightly, a Stripe test-mode sandbox). Each scenario gets a new owner.
There is no socket: scenarios use `control`, `stripe` and `assert` only.

| `control` op | What the platform does |
| --- | --- |
| `subscribe` | The owner's Trial starts, they add a card and a US address in the Customer Portal, and move to Pay-as-you-go |
| `top-up` | The owner buys `credits` |
| `usage` | The apiserver publishes stored usage: `meter` and `quantity`, from a call on Fonoster's keys |

| `stripe` key | Effect |
| --- | --- |
| `next_payment` | The outcome of the account's next payment: `succeed`, `decline`, `requires_action` or `timeout` |
| `advance_days` | Moves the test clock, and billing's clock, ahead; billing's expiry sweep runs |
| `fail_webhooks` | The next N webhook deliveries fail with 500 |
| `meter_error_report: true` | Stripe reports a meter event error |

After each `control` and `stripe` step the harness lets billing send what it owes Stripe and apply
what Stripe reported, until both are quiet.

## Assertions

`assert` names checks that a harness evaluates against its fakes. Measurements that refer to a
point in time (such as `media.output_silent_within_ms`) start at the end of the previous step, or
at the step named by `from`. Each value is a literal or a
matcher, compared with what the harness measured.

| Assertion | Measured value |
| --- | --- |
| `media.output_silent_within_ms` | ms between the previous step and the last agent-audio packet the fake Roomr node received |
| `media.output_audio_ms` | ms of agent audio the fake Roomr node has received since the previous step |
| `media.commands` | voice-session: the control-stream messages AppBridge sent the node, each `{type, ...}` (for `$includes`) |
| `media.held` | whether the caller is on hold. media-control observes it on the node: while the caller speaks a tone the app leg hears less than 100 ms of it (a ~0.8 s probe). voice-session: what the fake node did with Hold and Resume |
| `media.hold_audio_ms` | media-control: ms of audible audio the caller heard during the hold probe (its hold music) |
| `media.sip`, `caller.sip` | SIP statuses the caller received, in order (180, 200, refusals such as 404 or 503) |
| `caller.state`, `caller.digits`, `caller.codec`, `caller.secure`, `caller.heard_ms` | media-control: the last caller call's state (`calling`, `answered`, `ended`), the RFC 4733 digits it received, its negotiated codec, whether its media is SRTP, ms of audible audio it heard since the anchor; `caller.<name>.<field>` for a named call |
| `app.heard_ms`, `app.streams` | media-control: ms of audible audio the last stream's app leg heard since the anchor; how many control streams the node opened |
| `rtp.<x>.heard_ms` | media-control: ms of audible audio RTP party `x` heard since the anchor |
| `mix` | media-control: for every party (caller calls by name, RTP parties, `app`), the senders whose tone it heard since the anchor, sorted (the mix-minus checker: `{sip: [b], b: [sip], c: [b, sip]}`) |
| `trunk.invites`, `trunk.challenged`, `trunk.refers`, `trunk.calls`, `trunk.state`, `trunk.heard_ms` | media-control: every INVITE the trunk received (`requestUri`, X- `headers`, `authorized`), the challenges it sent, the REFER targets it accepted, the calls it answered, the last one's state and what it heard |
| `registrar.registers` | media-control: every REGISTER the registrar received (`expires`, X- `headers`, `challenged`) |
| `heartbeats`, `node.<i>.heartbeats` | media-control: heartbeats node 0 (or `i`) published since the anchor |
| `node.health`, `node.alive`, `node.files` (or `node.<i>.…`) | media-control: the node's gRPC health (`SERVING`, `NOT_SERVING`, `DOWN`), whether its process runs, the files it wrote |
| `secrets.leaked` | media-control: whether a password from the scenario (trunk or registrar auth) appears in any frame, RPC result or node log |
| `controller.attempts` | media-control: the fake controller's placement attempts, each `{node, node_ref, code}` |
| `providers.vendor_calls` | network calls to anything other than the fakes (always expected to be `0`); needs a harness that watches egress, such as a proxy around the implementation |
| `providers.tts.requests`, `providers.stt.requests`, `providers.llm.requests` | requests (or streams) the fake provider has served |
| `providers.stt.streams` | STT streams opened so far, waiting up to 2 s for the first one (use before caller audio that must reach STT) |
| `stt.caller_audio_lag_ms` | ms from the first audible caller packet the fake Roomr node sent after the step's anchor to the first audible frame the fake STT received (pass bar T1, caller audio to STT); waits up to 2 s, `null` if none arrived |
| `providers.llm.last_messages` | the `messages` of the fake LLM's latest request (how history is checked) |
| `record.events.<type>` | the call record's AppBridge events of that type, e.g. `record.events.turn.label` (needs a harness that can read the record) |
| `record.messages.<type>` | the call record's entries of that type from any source (app commands, appbridge messages, events), each with `source` and `at`, e.g. `record.messages.record.note` |
| `webhooks.events` | the lifecycle events AppBridge handed to the webhook dispatcher, in order, each as `{type, ...data}` |
| `app.attempts` | `app-1`'s connection attempts, each `{accepted, reason?}` (refused signatures show as `accepted: false`) |
| `app.text_frames` | text frames `app-1` received that were not JSON objects (always `0` with the `fonoster` protocol) |
| `other_app.messages` | every JSON message `app-2` received (fallback, handoff target or listener) |
| `other_app.audio_tracks` | the distinct track ids (first byte) of the binary frames `app-2` received, sorted |
| `providers.tts.voices` | the voice each fake TTS request named, in order |
| `regionStatus` | `regions`: the region's status as its owner sees it (`waiting`, `connected`, `degraded`, `offline`, `unsupported`) |
| `liveCredentials`, `revokedCredentials` | `regions`: how many of the region's issued credentials are live or revoked |
| `tools.calls` | names of the fake tools called (`${media}/tool/hours` answers `{"open":"9"}`, `${media}/tool/error` fails) |
| `balance` | `billing`: the owner's ledger balance, in credits |
| `topupCredits` | `billing`: credits left in top-up grants |
| `notices` | `billing`: the kinds of notice sent to the owner, in order (`topup_failed`, `payment_failed`, …) |
| `stripeEvents` | `billing`: the types of the Stripe events about the owner's customer that billing received, in order |
| `cycleInvoice` | `billing`: the invoice that closed the first period, in cents: `{status, plan, usage, credits, total}` (`{status: none}` before it exists) |
| `ledgerMinusStripe` | `billing`: the ledger balance less Stripe's available credit balance, in credits |

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
implement. `python/fonoster-conformance` is the reference second implementation; the Go Roomr node
runs the `media-control` files through `mods/conformance/test/media-control-go.test.ts` (the fake
node through `media-control.test.ts`).
Point other runners at the published `@fonoster/conformance` package of the same version (the Python
runner reads it from `FONOSTER_CONFORMANCE_DIR`) rather than copying the files.

## Versioning

The format only grows: new optional keys, new actions, new operators and new assertions. Runners
must reject unknown keys (the schema forbids them), so a scenario that uses a newer feature fails
loudly on an older runner instead of passing by accident. Removing or changing the meaning of a key
needs `format: fonoster.scenario.v2`.
