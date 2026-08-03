# Agent instructions

<!-- graphify-code-memory:begin -->
## Code memory (Graphify) — use this before grepping

This repo is registered for Graphify AST code-memory (tier **p1**).
There is no dedicated HTTP MCP yet — use the report / S3 graph first.

### Where to look

| | |
|---|---|
| **In-repo** | `graphify-out/GRAPH_REPORT.md` (after CI extract commits it) |
| **S3 graph** | `s3://ivx-graphify-graphs/graphs/fonoster/graph.json` |
| **S3 report** | `s3://ivx-graphify-graphs/graphs/fonoster/GRAPH_REPORT.md` |
| **Future MCP** | `https://graphify-fonoster.intelli-verse-x.ai/mcp` (not deployed for this tier yet) |

### Agent procedure

1. Read `GRAPH_REPORT.md` for communities / hotspots.
2. Prefer structural navigation over broad greps when answering "who calls / where defined".
3. Fallback to normal search for fuzzy prose. Graphify is **code DNA**, not Brand DNA / vector RAG.

Org playbook: `intelli-verse-kube-infra/.agents/skills/graphify-code-memory/SKILL.md`
<!-- graphify-code-memory:end -->
