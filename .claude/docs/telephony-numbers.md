# Docs checkpoint: telephony-numbers

Started: 2026-10-19
Current stage: 7, Wire (lead wires docs.json)

**Purpose:** Numbers and routing (`telephony/numbers`). Reader: Developers who have a trunk or Twilio number and need to add numbers and point them at an agent, stream or SIP agent.

**Diátaxis type:** how-to
**Placement:** new · `docs-site/telephony/numbers.mdx` · nav group `Telephony`

**Sources:**
- mods/common/src/protos/numbers.proto
- mods/common/src/validators/sipnet/numbers.ts
- mods/sipnet/src/numbers/createNumber.ts, convertToRoutrNumber.ts
- mods/ctl/src/commands/sipnet/numbers/*
- mods/dashboard/src/numbers/{number-drawer,route-picker,routing,index}.tsx

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

- 2026-10-19: Twilio-linked vs trunk-backed framed as two ways to bring a number (Fonoster sells none; import not built).
- 2026-10-19: CLI number create can't target a SIP agent; said so.

## Unverified

- Number matching requires the exact E.164 the carrier sends (from legacy guide + dashboard hint).
