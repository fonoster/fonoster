# Asset build doc — lifecycle

**Artifact:** `lifecycle-dark.png`, `lifecycle-light.png` (this folder)
**Used on:** `self-hosting/provider-catalog`
**Type:** diagram · state machine
**Preset:** 16:9 1600 × 900 (exported at 1×)
**Diagram Kit version:** v1 ("Docs / Diagram Kit", fdbKR)
**Pencil node id:** `baC6U` (dark), `EuqNs` (light) (file: `designs/docs.pen`)

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then re-export.

PNG, not SVG (the queue asked for SVG; Pencil exports raster, same as call-path).

## One message

Deprecation warns, retirement moves configs, and the operator triggers both.

## Sources (ground truth)

- `docs-site/self-hosting/provider-catalog.mdx`
- `.claude/docs/ASSET-QUEUE.md`: the queued spec.

## Node / edge spec

```
States: active → deprecated (Node Accent) → retired
Edge labels: registry deprecate-voice … --replacement … --retire-on 2026-12-01 / registry retire-voice … --yes (on or after the date, by you)
Note under the second arrow: nothing happens on its own when the date passes
Cards under each state: WHAT WORKSPACES SEE (from the queue)
```

## Built from

Diagram/Node sEKX6, Diagram/Node Accent pifOQ, Diagram/Arrow R oSkeo.

Edges are 2px rectangles (`$ui:accent` for the main path, `$ui:text-muted` for the rest). Colors are `$ui:` tokens;
light = copy of dark with `theme: { "ui:mode": "light" }`.

## Re-export

```
Export(["baC6U", "EuqNs"], "png", "<dir>", {scale: 1})
```
Then rename to `lifecycle-dark.png` / `lifecycle-light.png`.
