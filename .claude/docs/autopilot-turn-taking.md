# Docs checkpoint — autopilot/turn-taking

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** A developer wants to understand why their agent waits, answers fast or gets cut off. Explains end of thought vs endpointing, likely-ended/resumed/ended, patience levels and in-call adaptation, barge-in and honest history, idle and abandoned turns, the operator-chosen detector, and turn labels in the call record.

**Diátaxis type:** explanation
**Reader:** developers building Autopilot agents

**Placement:** new `docs-site/autopilot/turn-taking.mdx` · slug `autopilot/turn-taking` · nav group `Autopilot`

**Sources:**
- docs/turn-taking.md
- openspec/specs/turn-taking/spec.md, openspec/specs/autopilot/spec.md
- mods/appbridge/src/turn/Pacing.ts (PATIENCE 0.6/1/1.6, ADAPTATION_STEP 0.15, MAX 1.6, ABANDON 10 s), config.ts (silenceTimeoutMs 600, detector in gateway config)
- mods/autopilot/src/session/Agent.ts (prepareEarly off at high, 3 resumes), machine.ts (barge-in guard, idle)
- docs/call-records.md (analysis.turn_decisions)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | done | TODO banner + timeline diagram queued |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | Autopilot group, MENU order |

## Unverified
- Turn labels thresholds copied from docs/turn-taking.md (labelVersion 2); not re-read in Call.ts.
- Patience precedence between app speech.patience and agent conversationSettings.patience.

## Decision log
- 2026-10-19 — Detector presented as operator config only, linked to self-hosting/turn-taking-and-audio (assignment + MENU never-promised).
- 2026-10-19 — Avoided internal names (gateway, Pacing policy, listen.update) in prose; said 'Fonoster'.
- 2026-10-19 — Did not give the 600 ms baseline number; described patience as relative factors.
