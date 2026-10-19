# Docs checkpoint — how-fonoster-works

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** A developer wants the mental model before building: workspace → how calls get in (numbers on trunks, SIP agents on domains, outbound) → application (Autopilot agent or stream with protocol fonoster|twilio) → what the call leaves (record, recording policy, webhooks), plus regions and Cloud vs self-hosted.

**Diátaxis type:** explanation
**Reader:** developers building on Fonoster

**Placement:** new `docs-site/concepts/how-fonoster-works.mdx` · nav group `Get started`

**Sources:**
- mods/common/src/protos/applications.proto (ApplicationType STREAM/AUTOPILOT); mods/apiserver/src/applications/session/appModel.ts
- mods/dashboard/src/numbers/routing.ts (number → Autopilot agent / stream / SIP agent)
- docs/migrating-to-sessions.md §2, §4 (signing, twilio protocol has no speech layer)
- docs/call-records.md (signed vCon, recording policy precedence app > workspace > region > off)
- mods/common/src/webhooks/events.ts (event names)
- mods/sdk/src/Regions.ts (workspace picks a region at creation)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | |
| 4 | Assets | done | TODO banner + call-path diagram (node/edge spec) in ASSETS.md |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 |
| 7 | Wire | done | |

## Unverified
- Whether a workspace's region can change after creation (page only says it picks one at creation).
- "An API key only sees its own workspace" (inferred from WO-scoped access key IDs).

## Decision log
- 2026-10-19 — provider.deprecated left out of the webhook list (about providers, not calls).
- 2026-10-19 — Ends with CardGroup: Autopilot build, Streams Voice SDK, bring-your-app, numbers.
