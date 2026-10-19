# Docs checkpoint — autopilot/tools

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** A developer wants their agent to act: hang up, transfer, call their API. They learn the two built-ins, how to define an HTTP tool (fields, request shape, response handling, 10 s timeout, public URLs only), that headers are plain text (no Secrets), and that MCP tools aren't supported.

**Diátaxis type:** how-to
**Reader:** developers building Autopilot agents

**Placement:** new `docs-site/autopilot/tools.mdx` · slug `autopilot/tools` · nav group `Autopilot`

**Sources:**
- mods/common/src/assistants/tools/toolSchema.ts, propertySchema.ts
- mods/autopilot/src/session/tools.ts (HttpToolPort), Agent.ts (built-ins, requestStartMessage, MAX_TOOL_ROUNDS=4)
- mods/common/src/net/assertPublicDestination.ts (safeFetch 10 s, FONOSTER_ALLOWED_DESTINATIONS)
- mods/dashboard/src/agents/tabs/tools-tab.tsx, agent-form.ts (name rules, reserved headers)
- mods/autopilot/src/session/hosted.ts (secrets are provider keys only)
- openspec/specs/autopilot/spec.md (tools, built-ins)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | done | TODO tool-editor screenshot queued |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | Autopilot group, MENU order |

## Unverified
- Tool calls visible in the dashboard call view (page links to call records instead).
- Exact model behavior after a tool error (page says it continues the reply; code sends {error} as the tool result).

## Decision log
- 2026-10-19 — MCP note at the top, plainly; suggested an HTTP front or a stream as the alternative.
- 2026-10-19 — Secrets section says they don't apply to tool headers (code), contrary to MENU's WHY for workspace/secrets; raised as open question.
- 2026-10-19 — Linked self-hosting/configure for the destination allow-list rather than naming the env var on a developer page.
