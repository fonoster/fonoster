# Docs checkpoint: telephony-link-twilio

Started: 2026-10-19
Current stage: 7, Wire (lead wires docs.json)

**Purpose:** Link a Twilio number (`telephony/link-twilio`). Reader: Developers with a Twilio number who want it ringing an agent fast.

**Diátaxis type:** how-to
**Placement:** new · `docs-site/telephony/link-twilio.mdx` · nav group `Telephony`

**Sources:**
- mods/ctl/src/commands/sipnet/numbers/linkTwilioNumber.ts
- mods/ctl/src/utils/{linkTwilioNumberToApplication,createTwilioTrunk,assignTwilioNumberToTrunk}.ts
- mods/ctl/src/constants.ts
- legacy/guides/linking-a-twilio-number.mdx

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

- 2026-10-19: CLI only; no dashboard flow exists, noted on page.
- 2026-10-19: Listed everything created on both sides, since it changes the reader's Twilio account.

## Unverified

- Default ACL IP / pstn.fonoster.com still valid on v0.30 Cloud.
- Twilio accepts the trunk despite sendRegister true.
