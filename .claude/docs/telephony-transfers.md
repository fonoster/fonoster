# Docs checkpoint: telephony-transfers

Started: 2026-10-19
Current stage: 7, Wire (lead wires docs.json)

**Purpose:** Transfer calls (`telephony/transfers`). Reader: Developers handing callers to operators from Autopilot or a stream.

**Diátaxis type:** how-to
**Placement:** new · `docs-site/telephony/transfers.mdx` · nav group `Telephony`

**Sources:**
- openspec/specs/voice-session/spec.md (Call control)
- docs/session-protocol.md
- mods/voice/src/{Session,types}.ts
- python/fonoster-voice/src/fonoster/voice/session.py
- mods/appbridge/src/session/Call.ts (transfer flow)
- mods/autopilot/src/session/{Agent,machine}.ts
- mods/common/src/validators/sip.ts

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

- 2026-10-19: Warned that a failed Autopilot transfer leaves silence (code behavior).
- 2026-10-19: Warm example waits for operator speech since no answered event exists.

## Unverified

- Turn events from the operator during a warm transfer.
- `say` works during a warm transfer before completeTransfer.
