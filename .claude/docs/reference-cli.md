# Docs checkpoint — reference/cli

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** Look-up page for the developer fonoster CLI: install, login, the global flag, and every developer command grouped by topic with args and flags. Operator tools link to the Self-hosting tab.

**Diátaxis type:** reference
**Reader:** developers building on Fonoster

**Placement:** new `docs-site/reference/cli.mdx` · slug `reference/cli` · nav group `Reference`

**Sources:**
- mods/ctl/package.json, src/BaseCommand.ts, AuthenticatedCommand.ts, constants.ts
- mods/ctl/src/commands/** (every command's description, args, flags, prompts)
- mods/ctl/src/utils/applicationFlags.ts, applicationRequest.ts, webhookFlags.ts
- mods/apiserver/src/applications/createRotateSigningSecret.ts

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | skipped | reference page, no picture needed |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | nav entry listed in report; docs.json not edited |

## Unverified
- Node.js 22 kept for consistency with other pages; root package.json says >=20.11.1.

## Decision log
- 2026-10-19 — Interactive commands documented by what they ask for, from their prompt messages.
- 2026-10-19 — Left out apikeys:create --expiration: it's defined but never sent (open question).
