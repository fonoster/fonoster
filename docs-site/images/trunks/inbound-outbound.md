# Asset build doc — inbound-outbound

**Artifact:** `inbound-outbound-dark.png`, `inbound-outbound-light.png` (this folder)
**Used on:** `telephony/trunks`
**Type:** diagram · component (two parties, two directed edges)
**Preset:** 16:9 1600 × 900 (exported at 1×, 1601 × 901 with stroke)
**Diagram Kit version:** v1 ("Docs / Diagram Kit", fdbKR)
**Pencil node id:** `Kay48` (dark), `OMdZt` (light) (file: `designs/docs.pen`, at x 1700 y 4200 / 5200)

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then re-export.

PNG, not SVG (the queue asked for SVG; Pencil exports raster).

## One message

Inbound and outbound are configured separately on one trunk.

## Sources (ground truth)

- `docs-site/telephony/trunks.mdx`: intro, connection details, outbound URIs (priority, weight).
- `.claude/docs/ASSET-QUEUE.md`: the queued spec.

## Node / edge spec

```
Left: Your carrier ("speaks SIP", tall Node, 260 high) · Right: Fonoster ("trunk Acme", tall Node Accent)
Inbound (accent, y 410, →): pill "Inbound"; text above "calls for your numbers → sip:acme.pstn.fonoster.com";
  chip under the Fonoster end (shield, accent) "checked by ACL or inbound credentials"
Outbound (muted, y 570, ←): pill "Outbound"; text below "your calls → sip.acme.com:5060 (UDP)";
  chip above the Fonoster end (key) "outbound credentials"
Under it: a stack of three URI cards (front: "1 sip.acme.com:5060"), note "outbound URIs, tried by priority, then weight"
Legend: accent = inbound: calls for your numbers · muted = outbound: calls you make
```

## Built from (Diagram Kit v1)

| Component | id | Used for |
| :--- | :--- | :--- |
| Diagram/Node | sEKX6 | Your carrier |
| Diagram/Node Accent | pifOQ | Fonoster |
| Diagram/Pill | V8p0b | Inbound, Outbound |
| Diagram/Arrow R | oSkeo | arrowheads (flipX for the left one) |

Icon chips and the URI stack are plain frames in the kit's style (`$ui:` tokens). Light = copy of dark with the theme switched.

## Re-export

```
Export(["Kay48", "OMdZt"], "png", "docs-site/images/trunks", {scale: 1})
```
Then rename to `inbound-outbound-dark.png` / `inbound-outbound-light.png`.
