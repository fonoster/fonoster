# Asset build doc — rotation

**Artifact:** `rotation-dark.png`, `rotation-light.png` (this folder)
**Used on:** `self-hosting/call-record-keys`
**Type:** diagram · timeline (three snapshots)
**Preset:** 16:9 1600 × 900 (exported at 1×)
**Diagram Kit version:** v1 ("Docs / Diagram Kit", fdbKR)
**Pencil node id:** `RL0nj` (dark), `hbHpH` (light) (file: `designs/docs.pen`)

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then re-export.

PNG, not SVG (the queue asked for SVG; Pencil exports raster, same as call-path).

## One message

Rotation adds a key without a restart, retirement deletes only the private half, and the published set keeps every public key.

## Sources (ground truth)

- `docs-site/self-hosting/call-record-keys.mdx`
- `.claude/docs/ASSET-QUEUE.md`: the queued spec.

## Node / edge spec

```
Columns: 1 · before / 2 · keys rotate / 3 · keys retire local-1, each a config/record-keys folder
  1: local-1.key.pem [signing], local-1.pub.pem, current → local-1
  2: + local-20261019T143000.key.pem [signing] and .pub.pem, current → local-20261019T143000
  3: local-1.key.pem struck through, local-1.pub.pem [verify only]
Band: call-record-keys.json (published): local-1 / local-1 + new / local-1 + new
```

## Built from

Diagram/Chip PHmh8, Diagram/Arrow R oSkeo; file rows and badges are plain frames with $ui tokens.

Edges are 2px rectangles (`$ui:accent` for the main path, `$ui:text-muted` for the rest). Colors are `$ui:` tokens;
light = copy of dark with `theme: { "ui:mode": "light" }`.

## Re-export

```
Export(["RL0nj", "hbHpH"], "png", "<dir>", {scale: 1})
```
Then rename to `rotation-dark.png` / `rotation-light.png`.
