# Asset build doc — what-it-creates

**Artifact:** `what-it-creates-dark.png`, `what-it-creates-light.png` (this folder)
**Used on:** `telephony/link-twilio`
**Type:** diagram · component / architecture (two boundaries side by side)
**Preset:** 16:9 1600 × 900 (exported at 1×, 1601 × 901 with stroke)
**Diagram Kit version:** v1 ("Docs / Diagram Kit", fdbKR)
**Pencil node id:** `XzrCr` (dark), `kGxLQ` (light) (file: `designs/docs.pen`, at x 3400 y 4200 / 5200)

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then re-export.

PNG, not SVG (the queue asked for SVG; Pencil exports raster).

## One message

One command sets up both sides of the trunk and the number.

## Sources (ground truth)

- `docs-site/telephony/link-twilio.mdx`: "What the command sets up".
- `.claude/docs/ASSET-QUEUE.md`: the queued spec.

## Node / edge spec

```
Group "YOUR TWILIO ACCOUNT" (x 48):
  Elastic SIP trunk (Trunk-wo7d…) holding chips "IP ACL: Fonoster's address", "Origination URL: sip:wo7d….pstn.fonoster.com"
  Number +1 809 555 0123 ↑ into the trunk; note "moved onto the trunk"
Group "YOUR FONOSTER WORKSPACE" (x 992):
  Twilio Trunk (inbound URI wo7d….pstn.fonoster.com) holding chip "outbound URI wo7d….pstn.twilio.com"
  ↓ Number +1 809 555 0123 → Front desk (Node Accent, Autopilot agent); note "points at the app you pick"
Between the trunks: accent → "incoming calls (origination)" (y 340); muted ← "outbound calls (termination)" (y 420),
  note "to wo7d….pstn.twilio.com"
Subtitle names the command: fonoster sipnet:numbers:linkTwilio
Legend: accent = incoming calls · muted = outbound calls
```

## Built from (Diagram Kit v1)

| Component | id | Used for |
| :--- | :--- | :--- |
| Diagram/Group | np3qG | the two account boundaries |
| Diagram/Node | sEKX6 | both Numbers |
| Diagram/Node Accent | pifOQ | Front desk |
| Diagram/Pill | V8p0b | edge labels |
| Diagram/Arrow R / D | oSkeo / AdWAH | arrowheads (flipped for left/up) |

The trunk boxes are plain frames in the Node style holding icon chips. Light = copy of dark with the theme switched.

## Re-export

```
Export(["XzrCr", "kGxLQ"], "png", "docs-site/images/link-twilio", {scale: 1})
```
Then rename to `what-it-creates-dark.png` / `what-it-creates-light.png`.
