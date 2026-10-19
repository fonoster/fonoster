# Docs checkpoint — reference/autopilot-config

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** Look-up page for every agent field (conversationSettings, languageModel, tools, testCases, removed fields) and the application fields an agent uses (speech, recording, amd, fallback), with types, defaults, limits and a full SDK + CLI example.

**Diátaxis type:** reference
**Reader:** developers building on Fonoster

**Placement:** new `docs-site/reference/autopilot-config.mdx` · slug `reference/autopilot-config` · nav group `Reference`

**Sources:**
- mods/common/src/assistants/sessionAssistantSchema.ts, tools/toolSchema.ts, tools/propertySchema.ts, testCasesSchema.ts
- mods/apiserver/src/applications/session/appModel.ts (app limits, defaults, fallback checks)
- mods/types/src/applications.types.ts
- mods/appbridge/src/config.ts (DEFAULTS.silenceTimeoutMs), session/Call.ts (fallback flow)
- mods/autopilot/src/session/Agent.ts (patience only sent when not normal)
- mods/dashboard/src/agents/agent-form.ts (tool name rule, dropped fields)
- mods/ctl/src/utils/applicationFlags.ts, applicationRequest.ts

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
- speech.silenceTimeoutMs description (base silence for the turn detector; platform default 600 ms is operator config, not stated).
- Ollama, 10 s tool timeout and 4 model rounds taken from autopilot/tools checkpoint.

## Decision log
- 2026-10-19 — ParamField per field, grouped as the schema; tables for tool limits, test cases and removed fields.
- 2026-10-19 — Left out stream-only app fields (url, protocol, audio, listeners); they belong in reference/voice-sdk.
- 2026-10-19 — Tool name rule labelled as a dashboard rule (schema accepts any string).
