# Docs checkpoint — autopilot/prompting

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** A developer whose agent sounds like a chatbot wants it to sound right on the phone. They learn which messages Fonoster speaks versus the model, a prompt structure, voice-specific rules (short, front-loaded, no formatting, mishearings, one language), tool instructions, honesty, and model settings, with a full example.

**Diátaxis type:** how-to
**Reader:** developers building Autopilot agents

**Placement:** new `docs-site/autopilot/prompting.mdx` · slug `autopilot/prompting` · nav group `Autopilot`

**Sources:**
- docs-site/legacy/guides/prompting-guide.mdx (was 'Coming soon': nothing to adapt)
- mods/dashboard/src/agents/templates.ts (Role/Goal/Rules structure)
- mods/autopilot/src/session/Agent.ts (first message in history, goodbye on hangup, transfer message, honest history, requestStartMessage)
- mods/common/src/assistants/sessionAssistantSchema.ts
- docs/autopilot.md (honest history)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | done | none |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | Autopilot group, MENU order |

## Unverified
- Advice on prompt technique is editorial, not code-backed (except who-speaks-what and honest history).

## Decision log
- 2026-10-19 — Legacy guide was empty, so wrote from scratch around v0.30 fields and the dashboard template structure.
- 2026-10-19 — Example company 'Northwind Supply' (fictional).
