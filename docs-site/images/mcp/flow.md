# Asset build doc — flow

**Artifact:** `flow-dark.png`, `flow-light.png` (this folder)
**Used on:** `workspace/mcp`
**Type:** diagram · flow (left to right)
**Preset:** 16:9 1600 × 900 (exported at 1×)
**Diagram Kit version:** v1 ("Docs / Diagram Kit", fdbKR)
**Pencil node id:** `XiyhK` (dark), `aI9jA` (light) (file: `designs/docs.pen`)

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then re-export.



## One message

The assistant only asks; Fonoster places the call and your agent talks.

## Sources (ground truth)

- `docs-site/workspace/mcp.mdx`
- `.claude/docs/ASSET-QUEUE.md`: the queued spec.

## Node / edge spec

```
AI assistant (Claude Desktop · Cursor) + bubble “Call +1 809 555 0123 with Front desk”
  → "MCP (stdio)" → fonoster-mcp (on your computer · API key) + TOOLS chips list_numbers, list_applications, create_call, create_call_batch
  → "API" → Fonoster (Node Accent)
  → "outbound call" → phone +1 809 555 0123
Fonoster ↓ box "Front desk (Autopilot agent) handles the call"
```

## Built from

Diagram/Node sEKX6, Diagram/Node Accent pifOQ, Diagram/Chip PHmh8, Diagram/Pill V8p0b, Diagram/Arrow R oSkeo, Diagram/Arrow D AdWAH.

Edges are 2px rectangles (`$ui:accent` for the main path, `$ui:text-muted` for the rest). Colors are `$ui:` tokens;
light = copy of dark with `theme: { "ui:mode": "light" }`.

## Re-export

```
Export(["XiyhK", "aI9jA"], "png", "<dir>", {scale: 1})
```
Then rename to `flow-dark.png` / `flow-light.png`.
