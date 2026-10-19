# Docs checkpoint — autopilot/knowledge-base

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** A developer wants grounded answers from their documents. They learn how the per-turn lookup works (2 passages, 800 ms cap, not kept in history, loaded at call start), who configures storage (operator) versus the document list (developer), the PDF/S3-only limits, and how to list documents via SDK/CLI.

**Diátaxis type:** how-to
**Reader:** developers building Autopilot agents

**Placement:** new `docs-site/autopilot/knowledge-base.mdx` · slug `autopilot/knowledge-base` · nav group `Autopilot`

**Sources:**
- mods/common/src/assistants/sessionAssistantSchema.ts (knowledgeBase)
- mods/autopilot/src/session/knowledge.ts (KNOWLEDGE_TIMEOUT_MS=800), Agent.ts contextFor
- mods/autopilot/src/session/hosted.ts (knowledge config, s3Knowledge, bucket = workspaceRef lowercase, eagerKnowledge)
- mods/autopilot/src/knowledge/S3KnowledgeBase.ts (PDF only), AbstractKnowledgeBase.ts (k=2, chunk 1000)
- mods/dashboard/src/agents/agent-form.ts (knowledgeBase carried over)
- docs/autopilot.md

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | done | TODO lookup diagram queued |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | Autopilot group, MENU order |

## Unverified
- Whether Fonoster Cloud has knowledge storage configured, and how Cloud users upload PDFs.
- Parser (Unstructured) and embeddings (OpenAI) named only generically on the page.

## Decision log
- 2026-10-19 — 'Who sets up what' table: operator vs developer, per the assignment.
- 2026-10-19 — Said plainly there's no upload in dashboard/SDK/CLI.
- 2026-10-19 — No dashboard tab (not in UI); SDK and CLI tabs only.
