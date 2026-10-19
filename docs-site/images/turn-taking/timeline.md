# Asset build doc — timeline

**Artifact:** `timeline-dark.png`, `timeline-light.png` (this folder)
**Used on:** `autopilot/turn-taking`
**Type:** diagram · timeline (lanes, time left to right)
**Preset:** 16:9 1600 × 900 (exported at 1×, 1601 × 901 with stroke)
**Diagram Kit version:** v1 ("Docs / Diagram Kit", fdbKR)
**Pencil node id:** `SsXUR` (dark), `EyUjx` (light) (file: `designs/docs.pen`, at x 5100 y 1500 / 2500)

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then re-export.

PNG, not SVG (the queue asked for SVG; Pencil exports raster, same as call-path).

## One message

The agent prepares at "likely ended", throws the work away on "resumed", and only speaks on "ended", so it's
fast without cutting people off.

## Sources (ground truth)

- `docs-site/autopilot/turn-taking.mdx`: end-of-thought estimate, the three moments, patience.
- `.claude/docs/ASSET-QUEUE.md`: the queued spec.

## Spec

```
Lanes: CALLER (y≈210) · END-OF-THOUGHT ESTIMATE (0 at y 540, 1 at y 300) · AGENT
Time axis x 280 → 1552, "time" arrow at the bottom
Caller:   speech "My account number is…" 280–520 · pause 520–680 · speech "…4 8 1 0 2" 680–860 · silence to the end
Estimate: accent curve; rises in the pause, crosses dashed "halfway" at x 610, peaks, drops at 692 when the
          caller resumes, rises in the final silence, crosses halfway at 1000, reaches 1 at 1180
Agent:    chips with dotted guides from markers on the curve
          (1) likely ended → prepare reply (silent) · (2) resumed → drop it (hollow, muted)
          (3) likely ended → prepare reply · (4) ended → speak (accent stroke)
          then accent waveform "Thanks. I found your account." 1200–1552
Bracket over the final silence 864–1180: "patience: low ← → high stretches this wait"
```

## Built from (Diagram Kit v1)

| Component | id | Used for |
| :--- | :--- | :--- |
| Diagram/Arrow R | oSkeo | time axis arrowhead |

Waveforms, chips, markers, curve (a single `path` with a 3px `$ui:accent` stroke), dashes and lane labels are
plain nodes in the kit's style (`$ui:` tokens, `--font-primary` for labels, `--font-secondary` for quotes).
The frame's `theme: { "ui:mode": … }` picks light or dark.

## Re-export

```
Export(["SsXUR", "EyUjx"], "png", "docs-site/images/turn-taking", {scale: 1})
```
Then rename to `timeline-dark.png` / `timeline-light.png`.
