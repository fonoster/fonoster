# Docs checkpoint — workspace/mcp

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** A developer wants Claude or Cursor to place calls. They connect fonoster-mcp (mcp:configure or manual JSON), learn the env vars, the four tools and the prompt, how batches really run, and what it can't do.

**Diátaxis type:** how-to
**Reader:** developers building on Fonoster

**Placement:** new `docs-site/workspace/mcp.mdx` · slug `workspace/mcp` · nav group `Workspace`

**Sources:**
- mods/mcp/src/{env,index,schemas}.ts, tools/*, prompts/*, utils/createClient.ts, README.md, package.json
- mods/ctl/src/commands/mcp/configure.ts
- mods/common/src/validators/calls.ts, sip.ts; mods/apiserver/src/calls/createCall.ts (from must be a workspace number)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | done | TODO mcp/flow diagram queued |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | Workspace group, MENU order (lead wires docs.json) |

## Unverified
- Cursor config paths (~/.cursor/mcp.json, .cursor/mcp.json) and Claude Desktop prompt menu: third-party behavior, not from this repo.
- @fonoster/mcp 0.30 published on npm.

## Decision log
- 2026-10-19 — npx only; docker config from the README left out (image publication unknown).
- 2026-10-19 — Warning that batches run in the local process and stop if the assistant quits (from the code).
- 2026-10-19 — Note that this isn't MCP tools for Autopilot agents (MENU never-promised).
