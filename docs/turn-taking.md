# Turn-taking

The gateway decides when the caller starts and stops talking, for every app that uses the Speech
layer. Your app reacts to turn events; it never runs voice activity detection or reads raw audio to
find the end of a turn. This page explains the events, the patience knob, how to choose a Detector,
and how to read turn labels in the call record. The wire messages are in the
[session protocol reference](./session-protocol.md).

## How it works

```
caller audio ─┐
transcripts ──┼─▶ Detector ──(eot, speaking, kind)──▶ Pacing policy ──▶ turn.* events ─▶ your app
output state ─┘
```

- The **Detector** turns caller audio, transcripts and whether the agent is talking into an
  end-of-thought estimate `eot` (0 to 1) and two facts: `speaking`, and `kind` of the caller's
  speech (`speech`, `backchannel`, `interruption` or `none`).
- The **Pacing policy** turns the estimate into events: `turn.likely_ended` when `eot` crosses 0.5,
  `turn.ended` when it reaches 1, `turn.resumed` when the caller keeps going after
  `turn.likely_ended`.

## Turn events

Each turn arrives as `turn.user_started`, zero or more (`turn.likely_ended`, `turn.resumed`)
pairs, an optional `turn.likely_ended`, then exactly one `turn.ended`.

- `turn.likely_ended` is a good moment to start preparing a reply silently. Throw the preparation
  away on `turn.resumed`; speak on `turn.ended`.
- A turn with a noise burst and no words ends after 10 seconds as `turn.ended` with
  `abandoned: true` and empty `text`.
- A short acknowledgment over the agent ("uh-huh") arrives as `turn.backchannel` and does not start
  a turn, when the Detector classifies backchannels (the baseline does not; see below).

### Interruptions are yours to decide

When the caller talks over the agent, the gateway sends `turn.user_started` and keeps playing. To
stop, send `clear` (or a `preempt` item); the gateway then reports `output.interrupted` with what
the caller heard. The SDKs send `clear` for you when the item playing was sent with
`interruptible: true` (the default). Autopilot clears when the assistant allows barge-in
(`allowUserBargeIn`, default true).

## Patience

One knob, per app (`speech.patience` in the app's configuration) or at any time with
`listen.update {patience}`:

| Patience | Baseline silence timeout (600 ms default) | Use it for |
| --- | --- | --- |
| `low` | 0.6 × (about 360 ms) | Quick question-and-answer flows |
| `normal` (default) | 1 × (600 ms) | Most conversations |
| `high` | 1.6 × (about 960 ms) | Callers who think aloud, dictate numbers or speak a second language |

The policy also **adapts within a call**: every `turn.resumed` (the caller paused mid-thought)
makes it 15% more patient, up to 1.6 times the app's level. It never becomes less patient than the
app asked for, and nothing carries over to the next call: every call starts from the app's
setting. Each change is recorded in the call record as `turn.patience` with the factor and whether
the app or the adaptation set it.

## Choosing a Detector

The Detector is chosen per app in its speech settings (`speech.detector`); the app's code and the
session protocol do not change.

| Detector | What it does | When to use it |
| --- | --- | --- |
| `baseline` (default) | Energy voice activity, final transcripts and a silence timeout: today's behaviour | Always, unless a replay shows a better one |
| `backchannel-hold` | Like the baseline, but speech over the agent counts as an interruption only after 500 ms, and known acknowledgments never do | Agents that talk at length; fewer "uh-huh" interruptions, slightly slower barge-in |
| `stt` | A turn-aware speech recognizer (catalog feature `turn-detection`) decides; the gateway keeps its voice activity for `speaking` and `kind`. With no signal for 2.5 s after a final transcript the turn ends anyway | Recognizers that report end of turn themselves |
| `ws://…` | An out-of-process Detector over a local WebSocket, protocol `fonoster.detector.v1` (contract: `mods/conformance/schema/detector.v1.schema.json`) | A model you host next to the gateway, in any language. If it is unreachable or more than 200 ms behind, the baseline answers and the call record shows `detector.source` |

A Detector becomes the default only after a replay of the evaluation corpus shows it does not
regress on false cut-offs, delay after the true end of turn (median and p95), missed barge-ins or
backchannel misfires:

```bash
npx tsx mods/appbridge/scripts/replay.ts --candidate backchannel-hold [--patience high] [--json]
```

The report shows the metrics overall and per category (clean turns, short and long pauses,
backchannels, barge-ins), the calls to listen to first, and PASS or FAIL for each candidate against
the baseline.

## Reading turn labels in the call record

Every turn event is recorded as `turn.decision` with the estimate behind it and the versions that
made it (`detector`, e.g. `baseline@1`, and `policy`, `default@2`). Each turn is then labeled
(`turn.label`, with `labelVersion: 2`):

| Label | Meaning |
| --- | --- |
| `ok` | Neither cut off nor slow |
| `slow` | More than 2,000 ms between the caller's last speech and the reply starting |
| `cut-off` | The caller spoke again within 1,500 ms of the reply starting: the turn probably ended too early |
| `missed-barge-in` | The caller talked over the agent for more than 1,000 ms and the app did not stop |
| `backchannel-misfire` | The app stopped the agent within 1,000 ms of a backchannel |

Compare labels only between records with the same `labelVersion`. Many `cut-off` labels suggest a
more patient setting; many `slow` labels suggest a less patient one or a slow reply path.
