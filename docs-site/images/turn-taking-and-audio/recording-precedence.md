# Asset build doc — recording-precedence

**Artifact:** `recording-precedence-dark.png`, `recording-precedence-light.png` (this folder)
**Used on:** `self-hosting/turn-taking-and-audio`
**Type:** diagram · layered
**Preset:** 16:9 1600 × 900 (exported at 1×)
**Diagram Kit version:** v1 ("Docs / Diagram Kit", fdbKR)
**Pencil node id:** `RI4UX` (dark), `n8oFTT` (light) (file: `designs/docs.pen`)

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then re-export.

PNG, not SVG (the queue asked for SVG; Pencil exports raster, same as call-path).

## One message

The first layer that's set wins; operators own the middle two.

## Sources (ground truth)

- `docs-site/self-hosting/turn-taking-and-audio.mdx`
- `.claude/docs/ASSET-QUEUE.md`: the queued spec.

## Node / edge spec

```
Layers: Application policy (developer: dashboard, SDK, CLI) = Workspace default (not set)
        Workspace policy (you: callRecord.workspaces.WO7d….recording) = on  ← arrow stops, "this call is recorded"
        Install default (you: callRecord.recording) = not checked (dimmed)
        Off (dimmed)
Call icon top-left, accent line falls past layer 1 ("not set") into layer 2
```

## Built from

Diagram/Pill V8p0b, Diagram/Arrow R oSkeo; layers are plain frames with $ui tokens.

Edges are 2px rectangles (`$ui:accent` for the main path, `$ui:text-muted` for the rest). Colors are `$ui:` tokens;
light = copy of dark with `theme: { "ui:mode": "light" }`.

## Re-export

```
Export(["RI4UX", "n8oFTT"], "png", "<dir>", {scale: 1})
```
Then rename to `recording-precedence-dark.png` / `recording-precedence-light.png`.
