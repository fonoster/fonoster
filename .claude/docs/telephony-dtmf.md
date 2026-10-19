# Docs checkpoint: telephony-dtmf

Started: 2026-10-19
Current stage: 7, Wire (lead wires docs.json)

**Purpose:** DTMF (`telephony/dtmf`). Reader: Developers building menus/PINs or dialing through IVRs.

**Diátaxis type:** how-to
**Placement:** new · `docs-site/telephony/dtmf.mdx` · nav group `Telephony`

**Sources:**
- mods/voice/src/Session.ts (gather, feedGather, playDtmf)
- python/fonoster-voice/src/fonoster/voice/session.py
- mods/common/src/assistants/sessionAssistantSchema.ts (initialDtmf)
- mods/autopilot/src/session/Agent.ts (greet)
- mods/appbridge/src/protocols/twilio.ts

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | how-to spine |
| 4 | Assets | done | TODOs queued in ASSET-QUEUE.md |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | pending | lead edits docs.json |

## Decision log

- 2026-10-19: Stated Autopilot ignores caller keypresses (no handler in Agent).
- 2026-10-19: Suggested a stream + handoff for menus.

## Unverified

- None beyond OPEN-QUESTIONS.md.
