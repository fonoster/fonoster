# Asset build doc — lookup

**Artifact:** `lookup-dark.png`, `lookup-light.png` (this folder)
**Used on:** `autopilot/knowledge-base`
**Type:** diagram · flow / pipeline (left to right)
**Preset:** 16:9 1600 × 900 (exported at 1×, 1601 × 901 with stroke)
**Diagram Kit version:** v1 ("Docs / Diagram Kit", fdbKR)
**Pencil node id:** `DkAff` (dark), `In0cE` (light) (file: `designs/docs.pen`, at x 3400 y 1500 / 2500)

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then re-export.

PNG, not SVG (the queue asked for SVG; Pencil exports raster, same as call-path).

## One message

Documents are looked up fresh on every turn, capped at 800 ms, and only used for that one reply.

## Sources (ground truth)

- `docs-site/autopilot/knowledge-base.mdx`: "How it works".
- `.claude/docs/ASSET-QUEUE.md`: the queued spec.

## Node / edge spec

```
Main line (y 490):
  Caller says ("How much is the premium plan?") → "search (max 800 ms)" → Your PDFs (workspace bucket, cylinder)
  → "2 best passages" → Model request (accent node) → "reply" → Agent speaks
Note under the search edge: "slower than 800 ms → answer without it"
Into Model request (muted): System prompt (above, ↓) · Conversation history (below, ↑)
Dashed muted arrow down from the passages edge → chip "dropped after this reply" (trash icon),
  note "never added to the history"
Legend: accent = this turn's lookup · muted = sent on every turn
```

## Built from (Diagram Kit v1)

| Component | id | Used for |
| :--- | :--- | :--- |
| Diagram/Node | sEKX6 | Caller says, System prompt, Conversation history, Agent speaks |
| Diagram/Node Accent | pifOQ | Model request |
| Diagram/Pill | V8p0b | edge labels |
| Diagram/Arrow R / D | oSkeo / AdWAH | arrowheads (the up arrow is a plain path in the same style) |

The cylinder is two `path` nodes (body + lid) in the Node style. Colors are `$ui:` tokens; the frame's
`theme: { "ui:mode": … }` picks light or dark. Edges are 2px rectangles; the dashed edge is 6px dashes every 11px.

## Re-export

```
Export(["DkAff", "In0cE"], "png", "docs-site/images/knowledge-base", {scale: 1})
```
Then rename to `lookup-dark.png` / `lookup-light.png`.
