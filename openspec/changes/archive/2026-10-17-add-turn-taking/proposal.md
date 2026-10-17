## Why

Voice agents feel robotic when they talk over people who are pausing to think, or wait too long
after people are clearly done. Today the decision is "silence plus a timer" inside Autopilot: a
local Silero VAD, speech-to-text final results and a fixed `maxSpeechWaitTimeout`. It produces
both false positives (cutting the caller off mid-thought) and false negatives (slow replies), and
only Autopilot benefits from it.

The hard problem is **End of Thought (EoT)**: knowing when a person has finished their thought,
not just when they stopped making sound. Nobody has solved it yet, and models for it are arriving
fast (semantic end-of-turn models, STT engines that detect turns themselves, such as Deepgram
Flux). Fonoster should not marry one method. It should own a small, stable contract for
turn-taking, run the best available detector behind it, and collect the data that tells it which
detector is better.

## What Changes

- **Turn-taking moves into the VoiceSessionGateway's Speech layer.** Every app that uses the
  Speech layer gets turn-taking, not just Autopilot.
- **Three parts with one job each:**
  - The **Detector** perceives. It publishes a continuous end-of-thought estimate (0 to 1) plus a
    few facts: whether the caller is speaking, and whether caller speech during agent output is a
    backchannel ("uh-huh") or a real interruption.
  - The **Pacing policy** decides. It turns the estimate into actions: prepare an answer, speak,
    back off. Patience is set per app or assistant and adapts within the call only.
  - The **app** acts on turn events and never needs to know how they were decided.
- **The Detector is pluggable behind one interface.** The v1 Detector reproduces today's
  silence-plus-timer behavior so nothing regresses on day one. Smart EoT models, STT engines that
  detect turns, and out-of-process detectors plug in behind the same interface.
- **Turn events on the session:** `turn.user_started`, `turn.likely_ended`, `turn.ended`,
  `turn.resumed`, `turn.backchannel`, and an opt-in `turn.estimate` stream for clients that run
  their own pacing (decision M1).
- **The system labels its own mistakes.** Every turn decision is written to the call record
  together with what happened next (the caller kept talking right after the agent started, or a
  long silence came before the agent spoke). Over time this becomes the dataset for a real EoT
  model.
- **Replay evaluation.** Any detector can be replayed against a corpus of calls with known
  outcomes and scored. A new detector must not regress against the baseline.
- **Removed from Autopilot:** its own Silero VAD, its `maxSpeechWaitTimeout` timer, late-speech
  handling and barge-in decision. Autopilot keeps only an optional pacing policy (see
  `rework-autopilot`).

## Capabilities

### New Capabilities

- `turn-taking`: the Detector and Pacing policy in the gateway's Speech layer, the turn events and
  estimate stream they emit, the record of every decision and its outcome, and the replay
  evaluation that compares detectors.

### Modified Capabilities

None. `voice-session` (from `add-voice-session-gateway`) carries the turn events defined here.

## Impact

- **Depends on:** `add-voice-session-gateway` (the session, its Speech layer and the `subscribe`
  command), `add-call-record` (where decisions and outcomes are written).
- **Used by:** `rework-autopilot` (reacts to turn events, may apply its own policy on the
  estimate), `rework-voice-sdk` (`gather()` waits on `turn.ended`), `add-conformance-framework`
  (replay harness and corpus).
- **Affected code when built:** the voice worker (gateway Speech layer); `mods/autopilot` loses
  `vad/`, the Silero model and the timer states in `machine/`.
- **Scope guard:** turn-taking sits above the model and is converging across vendors. This change
  invests in the contract, the data and the evaluation, not in building an EoT model.
