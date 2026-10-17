# turn-taking

## ADDED Requirements

### Requirement: Turn-taking runs in the gateway's Speech layer

The VoiceSessionGateway SHALL run turn-taking for every session that uses the Speech layer, so
that apps receive turn events without implementing voice activity detection or endpointing
themselves.

#### Scenario: A simple speech app gets turn events

- **WHEN** an app connects with the native flavor and uses only the Speech layer
- **AND** the caller says a sentence and then stays silent
- **THEN** the app receives `turn.user_started` when the caller starts speaking
- **AND** receives `turn.ended` with the caller's final `text` after the caller finishes
- **AND** the app never received or processed raw audio

#### Scenario: Audio-only sessions do not require turn-taking

- **WHEN** an app uses only the Audio layer and does not use the Speech layer
- **THEN** the gateway does not emit `turn.*` events to it

### Requirement: The Detector publishes a continuous end-of-thought estimate

The Detector SHALL produce, for each session, a continuous end-of-thought estimate `eot` in the
range 0 to 1, together with the facts `speaking` (whether the caller is producing speech) and
`kind` of current caller speech (`speech`, `backchannel` or `interruption`). The Detector MUST
NOT emit turn events itself.

#### Scenario: The estimate rises as a thought completes

- **WHEN** the caller finishes a complete sentence and stays silent
- **THEN** the estimate increases over time toward 1
- **AND** `speaking` is `false`

#### Scenario: The estimate falls when the caller resumes

- **WHEN** the estimate has risen above the prepare threshold
- **AND** the caller starts speaking again
- **THEN** the estimate decreases
- **AND** `speaking` becomes `true`

### Requirement: The Pacing policy derives turn events from the estimate

The Pacing policy SHALL turn the Detector's estimate and facts into turn events. It MUST emit
`turn.likely_ended` when the estimate crosses the prepare threshold, `turn.ended` when it crosses
the commit threshold, and `turn.resumed` when, after `turn.likely_ended` and before `turn.ended`,
the caller resumes speaking or the estimate falls back below the prepare threshold.

#### Scenario: Prepare, then speak

- **WHEN** the estimate crosses the prepare threshold
- **THEN** the app receives `turn.likely_ended` with the transcript so far in `text`
- **AND WHEN** the estimate later crosses the commit threshold
- **THEN** the app receives `turn.ended` with `text`, `language`, `confidence` and `durationMs`

#### Scenario: False alarm

- **WHEN** the app has received `turn.likely_ended`
- **AND** the caller resumes speaking before the commit threshold is crossed
- **THEN** the app receives `turn.resumed`
- **AND** does not receive `turn.ended` until the estimate crosses the commit threshold again

#### Scenario: Turn events are ordered per turn

- **WHEN** a caller turn completes
- **THEN** the events for that turn arrive in the order `turn.user_started`, zero or more
  (`turn.likely_ended`, `turn.resumed`) pairs, an optional `turn.likely_ended`, then exactly one
  `turn.ended`

### Requirement: Backchannels do not interrupt the agent

When caller speech of kind `backchannel` occurs while agent output is playing, the gateway SHALL
emit `turn.backchannel` with the recognized `text` and MUST NOT stop the output.

#### Scenario: "Uh-huh" while the agent talks

- **WHEN** the agent is speaking an interruptible `speak` item
- **AND** the caller says "uh-huh" and the Detector classifies it as `backchannel`
- **THEN** the app receives `turn.backchannel` with `text` "uh-huh"
- **AND** the `speak` item continues and later produces `output.done`

### Requirement: The app decides whether an interruption stops output

The app owns interruption (owner decision 2026-10-15). While agent output plays, the gateway SHALL
emit `turn.user_started` as soon as the Detector classifies caller speech as `interruption`, and
SHALL NOT emit it for speech classified as `backchannel`. The gateway MUST NOT stop output on its
own; output stops only when the app sends `clear` or a `preempt` item, and the gateway then reports
what was heard through `output.interrupted`. The SDKs SHALL send `clear` on `turn.user_started`
when the item playing was sent with `interruptible: true` (the default), so apps built on an SDK
keep today's behavior.

#### Scenario: The caller cuts in and the app clears

- **WHEN** the agent is speaking an item the app sent with `interruptible: true`
- **AND** the caller starts speaking and the Detector classifies it as `interruption`
- **THEN** the app receives `turn.user_started` and the output keeps playing
- **AND** when the app sends `clear`, the output stops and the app receives `output.interrupted` with `heardText` and `heardMs`

#### Scenario: The app keeps talking

- **WHEN** the agent is speaking an item with `interruptible: false` and the caller speaks over it
- **THEN** the app receives `turn.user_started`, the SDK sends no `clear`, and the item plays to the end with `output.done`

### Requirement: Turns that never end are abandoned

A turn SHALL end with `turn.ended` `{text: "", abandoned: true}` when no speech is detected for
10 seconds after `turn.user_started` and no transcript has arrived.

#### Scenario: Noise then silence

- **WHEN** a noise burst produces `turn.user_started` and the line stays silent for 10 seconds
- **THEN** the app receives `turn.ended` with `abandoned: true`

### Requirement: The estimate is available on request

The gateway SHALL send `turn.estimate` messages with `eot`, `speaking` and `kind` only to sessions
that subscribed to `turn.estimate` with the `subscribe` command. Sessions that did not subscribe
MUST NOT receive `turn.estimate`.

#### Scenario: Opting in

- **WHEN** an app sends `subscribe` with `events: ["turn.estimate"]`
- **THEN** it receives `turn.estimate` messages while the caller speaks and while silence follows
- **AND** it still receives the turn events from the gateway's Pacing policy

#### Scenario: Not opted in

- **WHEN** an app never subscribes to `turn.estimate`
- **THEN** it receives no `turn.estimate` messages during the whole session

### Requirement: Patience is configurable per app and adapts only within a call

Each app (or assistant) SHALL be able to set the patience of the gateway's default Pacing policy
as one knob, `low`, `normal` (the default) or `high`, in its configuration or at any time with
`listen.update` `{patience}`. The policy MAY adapt within a call to the caller's observed pauses, and MUST NOT carry any
adaptation or caller data to another call.

#### Scenario: A patient app waits longer

- **WHEN** two apps receive the same recorded caller turn
- **AND** one app is configured more patient than the other
- **THEN** the patient app receives `turn.ended` no earlier than the other app

#### Scenario: Nothing is remembered across calls

- **WHEN** a caller who paused often in an earlier call calls again
- **THEN** the new session starts from the app's configured patience, not from the adapted value

### Requirement: Detectors are pluggable behind one interface

The gateway SHALL accept any Detector that implements the Detector interface: input of caller
audio frames, transcript segments with timings, and agent output state; output of the estimate and
facts. The Detector used by an app MUST be selectable without changing the session protocol or the
app's code. A turn-aware STT provider (one with the `turn_detection` feature in the catalog) MUST
be usable as a Detector.

#### Scenario: Swapping the Detector

- **WHEN** the operator switches an app from the baseline Detector to another Detector
- **THEN** the app receives the same set of turn event types with the same fields
- **AND** the app's code is unchanged

#### Scenario: A turn-aware STT as the Detector

- **WHEN** an app's speech settings select an STT provider with the `turn_detection` feature as
  its Detector
- **THEN** the provider's turn signals drive the estimate
- **AND** the app receives the same turn events as with the baseline

### Requirement: The baseline Detector reproduces today's behavior

The gateway SHALL ship a baseline Detector, used by default, whose turn decisions on the same
input match today's Autopilot behavior: voice activity detection, final transcripts, and a silence
timeout before the turn ends.

#### Scenario: Silence timeout ends the turn

- **WHEN** the baseline Detector is used with a silence timeout of T milliseconds
- **AND** the caller stops speaking and a final transcript has arrived
- **THEN** `turn.ended` is emitted after T milliseconds of silence, within the gateway latency
  budget

### Requirement: Every turn decision is recorded with its outcome

The gateway SHALL append to the call record every turn event it emits, with the estimate and facts
that caused it and the Detector and policy versions. It MUST then label each `turn.ended` and each
output stop with its observed outcome: `cut-off`, `slow`, `missed-barge-in`,
`backchannel-misfire` or `ok`, and every label SHALL carry `labelVersion` so replays compare only
labels made by the same rules. Because the app owns interruption, `missed-barge-in` means caller
speech of kind `interruption` lasting longer than the barge-in window while output kept playing
(no `clear` arrived), and `backchannel-misfire` means output stopped by `clear` or `preempt`
within the barge-in window after caller speech that the labeler judges a backchannel.

#### Scenario: A cut-off is labeled

- **WHEN** the gateway emits `turn.ended`
- **AND** agent output starts
- **AND** the caller resumes speaking within the cut-off window after output started
- **THEN** the call record holds that `turn.ended` labeled `cut-off`

#### Scenario: A slow reply is labeled

- **WHEN** the gap between the caller's last speech and the start of agent output exceeds the slow
  threshold
- **THEN** the call record holds that turn labeled `slow`

#### Scenario: A clean turn is labeled

- **WHEN** a turn is neither cut off, slow, a missed barge-in nor a backchannel misfire
- **THEN** the call record holds that turn labeled `ok`

### Requirement: Detectors are compared by replay before adoption

A Detector or Pacing policy SHALL become the default only after a replay of the evaluation corpus
shows it does not regress against the current default on any of: false cut-off rate, delay after
the true end of turn (median and p95), missed barge-in rate, and backchannel misfire rate. The
corpus MUST contain only consented calls (our own calls and synthetic calls; customer calls only
when the customer opted in).

#### Scenario: A regressing candidate is rejected

- **WHEN** a candidate Detector is replayed against the corpus
- **AND** its false cut-off rate is worse than the baseline's beyond the tolerance
- **THEN** the replay report marks the candidate as failing
- **AND** the default Detector is not changed

#### Scenario: Non-consented calls are excluded

- **WHEN** the corpus is assembled
- **THEN** calls from customers who did not opt in are excluded
