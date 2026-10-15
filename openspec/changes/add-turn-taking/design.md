## Context

Today Autopilot decides turns by itself (`mods/autopilot/src`):

- A local Silero VAD (`vad/SileroVad.ts`) reads the raw stream and fires `SPEECH_START` /
  `SPEECH_END` from fixed thresholds (activation 0.4, deactivation 0.25, 4 debounce frames).
- Speech-to-text final results arrive from the apiserver's stream gather.
- The state machine waits `maxSpeechWaitTimeout` (default 0) in `waitingForSpeechTimeout`, then
  answers. Late speech is captured once (`hasLateSpeech`), and any speech during agent output
  interrupts it when `allowUserBargeIn` is on.

So "turn ended" means "silence, then a timer". Pauses mid-thought get answered, and "uh-huh"
stops the agent. Simple voice apps get none of this; they only have `gather()`.

The industry is moving the same way this design does. Twilio's ConversationRelay added Deepgram
Flux (transcription and turn detection in one model), `speechTimeout` and `ignoreBackchannel` in
May 2026; LiveKit and others ship semantic end-of-turn models. None of them is final.

## Goals / Non-Goals

**Goals**

- One turn-taking contract, in the gateway, that every Speech-layer app gets for free.
- Swap the method behind it (VAD, EoT model, turn-aware STT, external service) without touching
  apps or the session protocol.
- Separate perceiving from deciding, so behavior (patience) is tuned per app without retraining
  or replacing anything.
- Produce labeled data from every real call, so detectors can be compared on evidence.
- No regression on day one: v1 behaves like today.

**Non-Goals**

- Building or training an EoT model in this change.
- Remembering a caller across calls. Adaptation is within one call only (personal data,
  privacy rules).
- Deciding *what* to say. That stays in the app or Autopilot.
- Idle prompts and session timeouts. Those stay in the app (Autopilot keeps its idle timer).

## Decisions

### TT1. Turn-taking lives in the gateway's Speech layer

The Detector needs the caller's audio, the live transcript and whether the agent is speaking. The
gateway has all three for every call. Placing it there gives simple apps good turn-taking for
free and keeps one detector to improve.

- *Rejected: in Autopilot only.* Simple apps would get a weaker built-in rule, and two
  implementations would drift apart.
- *Rejected: both, client chooses.* Doubles the surface. Clients that want control can already
  subscribe to the estimate and run their own policy (TT4).

### TT2. A continuous estimate, not five yes/no events

The first design had the Detector emit five discrete events directly. The owner called it weak,
and rightly: end of thought is a belief that grows and shrinks while a person talks, not a
moment. Collapsing it into yes/no inside the Detector throws away the information a pacing
decision needs, and makes "patience" impossible to tune without replacing the Detector.

The Detector therefore publishes a **continuous estimate** `eot` in [0, 1] plus facts:
`speaking` (caller audio active) and `kind` of current caller speech (`speech`, `backchannel`,
`interruption`). Events are derived by the Pacing policy.

### TT3. Three parts: Detector perceives, Pacing policy decides, app acts

- **Detector**: produces the estimate and facts. Swapping it changes how well we perceive.
- **Pacing policy**: reads the estimate and emits turn events using thresholds:
  - `eot` crosses the *prepare* threshold → `turn.likely_ended` (start thinking, don't speak)
  - `eot` crosses the *commit* threshold → `turn.ended` (speak)
  - `eot` falls back below *prepare* after `turn.likely_ended`, or caller speech resumes →
    `turn.resumed` (discard the prepared answer)
  - caller speech of kind `backchannel` while agent output plays → `turn.backchannel`
    (output continues)
  - caller speech of kind `interruption` while interruptible output plays → the gateway stops
    output (the `output.interrupted` event from `voice-session`) and emits `turn.user_started`

  Tuning the policy changes behavior. Patience is a per-app (or per-assistant) setting; within a
  call, the policy may adapt (for example, a caller who pauses often gets a longer commit delay).
- **App**: reacts to `turn.*` events. It never sees thresholds or models.

### TT4. The gateway's default policy, and Autopilot's own

Every Speech-layer session runs the gateway's default pacing policy. An app that wants to pace
itself (Autopilot) subscribes to `turn.estimate` (decision M1: opt-in via `subscribe`) and applies
its own policy on top. It still receives the gateway's turn events and may ignore them. Apps that
do not subscribe never see the estimate.

### TT5. One Detector interface, four kinds of implementation

All implementations sit behind one interface: input is caller audio frames, interim and final
transcript segments with timings, and agent output state; output is the estimate and facts.

1. **Baseline (v1)**: VAD + endpointing that reproduces today's silence-plus-timer behavior. The
   estimate jumps to 1 once silence has lasted the configured timeout. Guarantees no regression.
2. **EoT model**: a semantic end-of-turn model on transcript and/or audio.
3. **Turn-aware STT**: an STT provider that reports turns itself (for example Deepgram Flux) is
   wrapped as a Detector. The provider's own turn signal maps onto the estimate.
4. **Out-of-process detector**: a separate service (for example a Python model) speaks the same
   interface over a local transport.

Which Detector runs is chosen per app from the provider catalog (a turn-aware STT is a catalog
entry with the `turn_detection` feature, see `add-provider-registry`). Default: baseline.

### TT6. Every decision is recorded with its outcome

Each turn event the policy emits is appended to the call record with the estimate and facts that
caused it, and the Detector and policy versions. The gateway then labels the outcome:

- **cut-off**: caller speech resumes within the cut-off window after agent output started
  following a `turn.ended`.
- **slow**: the gap between the caller's last speech and agent output start exceeds the slow
  threshold.
- **missed barge-in**: caller speech of kind `speech` lasting longer than the barge-in window
  while output continued.
- **backchannel misfire**: output was stopped and the caller's words were a backchannel.

Labels are written to the call record, so every real call adds labeled examples at no extra cost.

### TT7. Replay evaluation decides between detectors

A replay harness feeds recorded calls (audio, transcripts, agent output timings) through any
Detector + policy and computes: false cut-off rate, median and p95 delay after the true end of
turn, missed barge-in rate, backchannel misfire rate. A candidate replaces the current default
only if it does not regress any metric beyond tolerance against the baseline on the same corpus.

Corpus (decision T3): our own consented calls (internal and test calls, consented product calls)
plus synthetic calls first; customers may opt in later. The call record supplies the labels.

### TT8. Small investment above the model

Following the owner's thesis that everything above the telephony layer converges and is easy to
copy, this change specifies the contract, the data and the evaluation, and ships only the
baseline. Better detectors are adopted from vendors or open models when the replay shows they win.

## Risks / Trade-offs

- **Gateway CPU.** Running a model per call in the gateway costs CPU. Mitigation: the baseline is
  cheap; heavier detectors can run out of process (TT5.4) or come from the STT vendor (TT5.3).
  The scale bar (T2, 100 calls per replica) applies with the default detector.
- **Two policies at once.** Autopilot may disagree with the gateway's events. Mitigation: the
  gateway's events stay advisory for apps that subscribe to the estimate; output is only stopped
  by the gateway on a real interruption of interruptible output.
- **Label noise.** Outcome labels are heuristics (a caller can resume speaking for other
  reasons). Mitigation: they are used to compare detectors on the same corpus, not as ground
  truth; the corpus can be hand-reviewed.
- **Corpus privacy.** Replays need original audio. Only consented calls enter the corpus; the
  redacted copy of the call record is used wherever audio is not required.

## Open Questions

1. **Estimate update rate.** How often `turn.estimate` is sent: on every change above a delta,
   at a fixed rate (for example every 100 ms), or both with a cap.
2. **Default thresholds.** The prepare and commit thresholds, the cut-off window, the slow
   threshold and the barge-in window for the default policy, and their per-app ranges.
3. **Patience setting shape.** One knob (patient ↔ snappy) or several (thresholds, minimum
   silence, maximum wait).
4. **Out-of-process transport.** How an external detector connects to the gateway (local gRPC,
   WebSocket, or a shared-memory/sidecar protocol) and its latency budget inside T1.
5. **Interruption authority.** Whether an app that subscribes to the estimate can turn off the
   gateway's automatic stop on interruption and decide itself.
6. **Within-call adaptation rules.** Which adaptations the default policy may make, and their
   limits, so behavior stays predictable.
