# Docs checkpoint — quickstart

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** A new developer wants an agent answering within minutes. They create an Autopilot agent (Dashboard, SDK or CLI), talk to it from the browser with no carrier, see the call under Calls, then learn how to put a real number on it.

**Diátaxis type:** tutorial
**Reader:** developers new to Fonoster

**Placement:** new `docs-site/quickstart.mdx` · slug `quickstart` · nav group `Get started`

**Sources:**
- mods/dashboard/src/agents/create-agent-dialog.tsx, templates.ts, catalog.ts, agent-detail.tsx, talk/talk-drawer.tsx
- mods/dashboard/src/numbers/route-picker.tsx, routing.ts; app/shell/nav.ts
- openspec/specs/talk-in-browser/spec.md
- mods/ctl/src/commands/applications/create.ts, utils/applicationFlags.ts, utils/applicationRequest.ts, commands/workspaces/login.ts
- mods/sdk/src/Applications.ts, client/Client.ts
- mods/common/src/assistants/sessionAssistantSchema.ts; mods/apiserver/src/applications/session/appModel.ts
- mods/identity/src/utils/generateAccessKeyId.ts (WO/AP key formats); docs/try-the-new-platform.md

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | done | TODO talk-panel screenshot in ASSETS.md |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | Get started, after introduction |

## Unverified
- Browser test calls produce a call record visible under Calls (with transcript).
- Fonoster Cloud runs the template's openai/gpt-4o-mini and Deepgram voice without workspace vendor keys.
- `@fonoster/ctl` and `@fonoster/sdk` 0.30 are published on npm.

## Decision log
- 2026-10-19 — Browser call (Talk to agent) is the phone path: no carrier, and it's dashboard-only, so Tabs only on the create step.
- 2026-10-19 — SDK/CLI examples use a short receptionist prompt from the dashboard template; model openai/gpt-4o-mini (template default).
- 2026-10-19 — Real number: link to telephony/link-twilio and trunks, then route via Numbers drawer.
