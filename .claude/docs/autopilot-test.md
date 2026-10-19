# Docs checkpoint — autopilot/test

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** A developer wants confidence before and after prompt changes. They talk to the agent in the browser, then write testCases and run them with applications:eval or evaluateIntelligence, and learn how exact/similar/tool checks pass and which keys are used.

**Diátaxis type:** how-to
**Reader:** developers building Autopilot agents

**Placement:** new `docs-site/autopilot/test.mdx` · slug `autopilot/test` · nav group `Autopilot`

**Sources:**
- mods/dashboard/src/agents/talk/talk-drawer.tsx
- mods/common/src/assistants/testCasesSchema.ts
- mods/ctl/src/commands/applications/eval.ts, utils/printEval.ts
- mods/sdk/src/Applications.ts (evaluateIntelligence)
- mods/autopilot/src/models/evaluations/createEvaluateIntelligence.ts, session/runSessionEval.ts, session/evaluateSessionScenario.ts (evalToolPort, 60 s step, builtin reply), evaluateSingleTool.ts (valid-date), evaluateToolCalls.ts, evaluateTextResponse.ts
- mods/types/src/applications.types.ts, calls.types.ts (CallDirection)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | done | none (CLI output shown as text) |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | Autopilot group, MENU order |

## Unverified
- The sample CLI output's AI Actual text (illustrative).
- SDK eval without productRef (page passes llm.openai).

## Decision log
- 2026-10-19 — Test file nests the agent under intelligence.config because that's what applications:eval reads (differs from the --agent file shape); stated on the page.
- 2026-10-19 — Lowercase exact/similar in YAML (CLI maps case); noted SDK needs capitals.
