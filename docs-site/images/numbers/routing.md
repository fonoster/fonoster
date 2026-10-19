# Asset build doc — routing

**Artifact:** `routing-dark.png`, `routing-light.png` (this folder)
**Used on:** `telephony/numbers`
**Type:** diagram · flow / pipeline (left to right, fan-out at the end)
**Preset:** 16:9 1600 × 900 (exported at 1×, 1601 × 901 with stroke)
**Diagram Kit version:** v1 ("Docs / Diagram Kit", fdbKR)
**Pencil node id:** `kEITB` (dark), `C2SbKU` (light) (file: `designs/docs.pen`, at x 0 y 4200 / 5200)

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then re-export.

PNG, not SVG (the queue asked for SVG; Pencil exports raster, same as call-path).

## One message

A number rides on a trunk and points at exactly one destination.

## Sources (ground truth)

- `docs-site/telephony/numbers.mdx`: intro and routing.
- `.claude/docs/ASSET-QUEUE.md`: the queued spec.

## Node / edge spec

```
Main line (y 480): Carrier ("your phone company") → "calls for +1 809 555 0123" → Trunk (Claro) → Number (+1 809 555 0123)
Caption under the number: "one destination per number"
Fan-out from a bus at x 1080:
  solid accent → Autopilot agent (Front desk, Node Accent)            y 300
  dashed muted "or" → Stream (your WebSocket server)                   y 480
  dashed muted "or" → SIP agent (sip:maria@acme.sip.fonoster.com)      y 660
Legend: accent = where this number sends calls · dashed = or, instead, one of these
```

## Built from (Diagram Kit v1)

| Component | id | Used for |
| :--- | :--- | :--- |
| Diagram/Node | sEKX6 | Carrier, Trunk, Number, Stream, SIP agent |
| Diagram/Node Accent | pifOQ | Autopilot agent |
| Diagram/Pill | V8p0b | edge labels, "or" |
| Diagram/Arrow R | oSkeo | arrowheads |

Edges are 2px rectangles; dashed edges are 6px dashes every 11px. Colors are `$ui:` tokens; the frame's
`theme: { "ui:mode": … }` picks light or dark. Light = copy of dark with the theme switched.

## Re-export

```
Export(["kEITB", "C2SbKU"], "png", "docs-site/images/numbers", {scale: 1})
```
Then rename to `routing-dark.png` / `routing-light.png`.
