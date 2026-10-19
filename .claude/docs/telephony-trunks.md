# Docs checkpoint: telephony-trunks

Started: 2026-10-19
Current stage: 7, Wire (lead wires docs.json)

**Purpose:** Connect a SIP trunk (`telephony/trunks`). Reader: Developers bringing any SIP carrier.

**Diátaxis type:** how-to
**Placement:** new · `docs-site/telephony/trunks.mdx` · nav group `Telephony`

**Sources:**
- mods/common/src/protos/{trunks,credentials,acls}.proto
- mods/common/src/validators/sipnet/{trunks,acls,credentials}.ts
- mods/ctl/src/commands/sipnet/{trunks,credentials,acls}/create.ts
- mods/dashboard/src/trunks/*, regions/connection.tsx (CarrierHint)
- legacy/guides/linking-any-virtual-number.mdx

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

- 2026-10-19: Connection details come from the trunk form hint (public region); Settings → Region only for private regions.
- 2026-10-19: Warned that CLI-made trunks have Send REGISTER on.

## Unverified

- Inbound URI uniqueness and the `*.sip.fonoster.com` suffix on Cloud.
