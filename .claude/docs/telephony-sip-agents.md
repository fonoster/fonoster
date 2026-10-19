# Docs checkpoint: telephony-sip-agents

Started: 2026-10-19
Current stage: 7, Wire (lead wires docs.json)

**Purpose:** SIP agents (softphones) (`telephony/sip-agents`). Reader: Developers giving operators or testers a softphone.

**Diátaxis type:** how-to
**Placement:** new · `docs-site/telephony/sip-agents.mdx` · nav group `Telephony`

**Sources:**
- mods/common/src/protos/{agents,domains}.proto
- mods/common/src/validators/sipnet/{agents,domains}.ts
- mods/dashboard/src/{sip-agents,domains,credentials}/*
- mods/dashboard/src/regions/connection.tsx (SoftphoneSettings)
- docs/try-the-new-platform.md (Linphone/Zoiper steps)

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

- 2026-10-19: Did not claim a SIP agent can call an application directly or another SIP agent (unconfirmed).
- 2026-10-19: Kept 'SIP agent' in prose, noted the API name `Agents`.

## Unverified

- Egress-rule behavior (pattern → caller ID and trunk) from dashboard copy only.
- Softphone steps from the local try-out doc.
