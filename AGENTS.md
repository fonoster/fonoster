# Agent instructions

<!-- graphify-code-memory:begin -->
## Code memory (Graphify) — use this before grepping

This repo is registered for Graphify AST code-memory (tier **p1**).
There is no dedicated HTTP MCP yet — use the offline / S3 path below (MCP is optional later).

### Without MCP (primary for this tier)

1. **In-repo:** read `graphify-out/GRAPH_REPORT.md` when present.
2. **S3:**
   ```bash
   aws s3 cp s3://ivx-graphify-graphs/graphs/fonoster/GRAPH_REPORT.md graphify-out/GRAPH_REPORT.md
   aws s3 cp s3://ivx-graphify-graphs/graphs/fonoster/graph.json graphify-out/graph.json   # optional
   ```
3. **Local rebuild:**
   ```bash
   uv tool install graphifyy
   graphify update . --no-cluster && graphify cluster-only . --no-viz --no-label
   ```
4. **Last resort:** normal `rg` / IDE search / vector RAG.

| | |
|---|---|
| **In-repo** | `graphify-out/GRAPH_REPORT.md` |
| **S3 graph** | `s3://ivx-graphify-graphs/graphs/fonoster/graph.json` |
| **S3 report** | `s3://ivx-graphify-graphs/graphs/fonoster/GRAPH_REPORT.md` |
| **Future MCP** | `https://graphify-fonoster.intelli-verse-x.ai/mcp` (not deployed for this tier yet) |

### Ops

- CI: `.github/workflows/graphify.yml` (if present) dispatches org extract
- Org playbook: `intelli-verse-kube-infra/.agents/skills/graphify-code-memory/SKILL.md`
- Enable MCP later via `serve_mcp: true` in `graphify/repos.yaml` (kube-infra)
<!-- graphify-code-memory:end -->
