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
  audio/                          # recorded caller audio (raw PCM16LE mono 16 kHz)
```

The file name is the scenario `name` plus `.yaml`. A scenario belongs to exactly one contract.

## Top-level fields

| Field | Required | Meaning |
| --- | --- | --- |
| `format` | yes | Always `fonoster.scenario.v1`. A breaking change to this format gets a new value. |
| `name` | yes | Kebab-case, equal to the file name. |
| `contract` | yes | `voice-session`, `twilio-media-streams-flavor`, `voice-sdk` or `media-control`. |
| `role` | yes | The side the runner plays: `app`, `gateway` or `media-control-client`. |
| `spec` | no | The requirement and scenario this file proves: `"Requirement / Scenario"`. |
| `description` | no | Free text. |
| `fixture` | `voice-sdk` | The fixture app the SDK runner starts (see Fixtures). |
| `tags` | no | Used to select subsets, e.g. `timing`, `slow`. |
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
| `caller: {dtmf | hangup | audio}` | The fake media node acts as the caller: presses keys (`dtmf: "12#"`), hangs up (`hangup: true`) or speaks (`audio`, same shape as `send_audio`, replacing any caller audio still pending). |

In the `twilio` flavor, `send_audio` sends μ-law 8 kHz `media` events (base64 payloads) using the
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

**Order.** Frames are consumed in arrival order. `expect` skips frames that do not match, then
consumes the first one that does, so two consecutive `expect` steps prove the second message came
after the first. Frames whose `type` (or Twilio `event`) is listed in `ignore` are never matched.
Binary frames are counted for `expect_audio` and never matched by `expect`.

A frame consumed by one `expect` cannot satisfy a later one.

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
| `call` | The call the fake media node offers to the gateway: `direction`, `from`, `to`, `metadata`. |
| `app` | The app record: `flavor`, `signingSecret`, `verifySignature`, `reachable`, `fallback`, `speech`. |
| `providers` | Initial fake provider behaviour (same shape as `inject`). |
| `callerAudio` | Audio the fake media node plays as the caller once the call is answered. |
| `media` | Fake media node behaviour: `dialOutcome` for `participant.dial` and transfers (`answered`, `busy`, `no_answer`, `failed`). |

### Fake provider behaviour

| Key | Meaning |
| --- | --- |
| `delayMs` | Fixed delay before the provider's first byte. Subtracted by `budget_ms`. |
| `failNext` | The next request fails: `provider_unavailable` (HTTP 503), `provider_timeout` (no response), `bad_request` (HTTP 400). |
| `script` | STT: `[{atMs, text, final}]` transcripts keyed to caller-audio time. LLM: replies in order. |

## Assertions

`assert` names checks that a harness evaluates against its fakes. Each value is a literal or a
matcher, compared with what the harness measured.

| Assertion | Measured value |
| --- | --- |
| `media.output_silent_within_ms` | ms between the previous step and the last agent-audio packet the fake media node received |
| `media.output_audio_ms` | ms of agent audio the fake media node has received since the previous step |
| `media.commands` | the list of `media-control` commands received (for `$includes`) |
| `providers.vendor_calls` | network calls to anything other than the fakes (always expected to be `0`); needs a harness that watches egress, such as a proxy around the implementation |
| `providers.tts.requests`, `providers.stt.requests`, `providers.llm.requests` | requests (or streams) the fake provider has served |

A runner that does not know an assertion name fails the step; it never passes it silently.

## Fixtures (`voice-sdk`)

SDK scenarios exercise an app written with the SDK. `fixture` names that app; every SDK runner
ships one implementation per fixture, written idiomatically in its language. The fixture's
behaviour is described in `scenarios/voice-sdk/FIXTURES.md` and is part of the contract: two SDKs
implementing the same fixture must produce the same frames.

## Versioning

The format only grows: new optional keys, new actions, new operators and new assertions. Runners
must reject unknown keys (the schema forbids them), so a scenario that uses a newer feature fails
loudly on an older runner instead of passing by accident. Removing or changing the meaning of a key
needs `format: fonoster.scenario.v2`.
