# Proposal

## Why

The call detail's Response time panel shows how long the caller waited for each answer (from
turn.ended to the agent's first audio), but not where that wait went (#1068). Autopilot's
`autopilot.turn` note had `firstTokenMs` and `firstSpeakMs`, not the time speech took to start.

## What Changes

- Autopilot: the `autopilot.turn` note gains optional `llmMs` (turn.ended to the first sentence handed
  to speech) and `ttsMs` (that sentence to its first audio, `output.started`). Both are measured on
  Autopilot's clock and set only when a reply finished playing: an interrupted say reports audio sent,
  not a time. Existing fields are unchanged.
- Dashboard: an answer whose note has both draws a stacked bar (LLM, Text-to-speech) with a legend;
  older records keep today's single bar.

## Not in this change

- Speech-to-text. The wait the panel measures starts at turn.ended, which AppBridge's Pacing emits on
  the end-of-turn estimate with the text it has; it does not wait for a final transcript. So there is
  no speech-to-text stage inside it. The time before turn.ended (end-of-turn detection) is
  AppBridge's to record, not Autopilot's, and is left for a follow-up.
