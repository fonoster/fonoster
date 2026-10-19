# Docs checkpoint — autopilot/build-an-agent

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** A developer with a first agent wants it production-ready. They learn the three parts (conversationSettings, languageModel, speech), what each message does, which models run live, and how idle, barge-in, max length, transfer and initial DTMF behave, with Dashboard / SDK / CLI paths.

**Diátaxis type:** how-to
**Reader:** developers building Autopilot agents

**Placement:** new `docs-site/autopilot/build-an-agent.mdx` · slug `autopilot/build-an-agent` · nav group `Autopilot`

**Sources:**
- mods/common/src/assistants/sessionAssistantSchema.ts
- mods/dashboard/src/agents/agent-form.ts, tabs/configure-tab.tsx, tabs/advanced-tab.tsx, catalog.ts, templates.ts
- mods/autopilot/src/session/Agent.ts, machine.ts
- mods/ctl/src/utils/applicationFlags.ts, applicationRequest.ts, createOrUpdateApplication.ts; commands/applications/create.ts, update.ts
- mods/apiserver/src/applications/session/appModel.ts, createUpdateApplication.ts (PUT semantics)
- ops/bundle/config/catalog.yaml (LLM ids)
- docs/autopilot.md, docs/session-protocol.md (filler WAV, hints)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | done | TODO configure-tab screenshot queued |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | Autopilot group, MENU order |

## Unverified
- Calls that start after Save use the new settings (inferred from talk drawer copy 'Calls reach the saved version').
- Ollama availability on self-hosted installs (OPENAI_COMPATIBLE includes ollama; endpoint is operator config).

## Decision log
- 2026-10-19 — Steps per concern with a dashboard-location line each; one Tabs block at Save with full SDK and CLI examples (avoids tabs on every step).
- 2026-10-19 — Listed only catalog LLMs; said live calls run OpenAI-compatible models (never promise Anthropic/Google).
- 2026-10-19 — Added a Warning that dashboard saves drop patience/hints/filler/voice/language (code: toRequest).
