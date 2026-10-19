# Docs checkpoint — reference/twilio-compatibility

Started: 2026-10-19
Current stage: 7 — Wire (listed in report; lead wires docs.json)

**Purpose:** Exactly which Twilio Media Streams messages a `twilio` stream sends and accepts, field by field, how they differ from Twilio, what's missing, and the hang-up REST route with its status codes.

**Diátaxis type:** reference
**Reader:** developers bringing a Twilio/Pipecat bot

**Placement:** new `docs-site/reference/twilio-compatibility.mdx` · nav group `Reference`

**Sources:**
- openspec/specs/twilio-media-streams-flavor/spec.md
- mods/appbridge/src/protocols/twilio.ts, http/hangupEndpoint.ts, Gateway.ts, config.ts, session/Call.ts (accountSid), apps/AppStore.ts (workspaceRef = accessKeyId)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | |
| 4 | Assets | skipped | reference page |
| 5 | Draft | done | |
| 6 | Proof | done | 200 on :3334 |
| 7 | Wire | done | reported |

## Unverified
- Twilio-side column (SID prefixes, TwiML `<Parameter>`, `track` attribute) is from Twilio's public behavior, not this repo.
- Whether Cloud serves the hang-up endpoint (see OPEN-QUESTIONS).

## Decision log
- 2026-10-19 — Documented both hang-up auth modes the code supports (workspace API keys via Identity, or one fixed pair), "where the operator turns it on".
