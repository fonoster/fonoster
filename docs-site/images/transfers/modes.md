# Asset build doc — modes

**Artifact:** `modes-dark.png`, `modes-light.png` (this folder)
**Used on:** `telephony/transfers`
**Type:** diagram · timeline (three lanes, time left to right)
**Preset:** 16:9 1600 × 900 (exported at 1×, 1601 × 901 with stroke)
**Diagram Kit version:** v1 ("Docs / Diagram Kit", fdbKR)
**Pencil node id:** `UKjCd` (dark), `xMrG7` (light) (file: `designs/docs.pen`, at x 5100 y 4200 / 5200)

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then re-export.

PNG, not SVG (the queue asked for SVG; Pencil exports raster).

## One message

Cold leaves at answer, warm briefs first, refer hands the call back to the carrier.

## Sources (ground truth)

- `docs-site/telephony/transfers.mdx`: mode table, `completeTransfer`, SIP REFER.
- `.claude/docs/ASSET-QUEUE.md`: the queued spec.

## Spec

```
Lanes (Group, label hidden) at y 140 / 375 / 610, each with tracks Caller · Your app · Operator, time x 240 → 1500
Bars: muted = on the call with your app · accent = caller and operator connected · stripes = on hold · dashes = ringing / outside Fonoster
cold:  marker "transfer()" at 640; operator rings 640–860, answers; app leaves at 860; caller+operator accent from 860. Chip "recording continues"
warm:  marker "transfer({mode: warm})" at 640; caller on hold (music) 640–1100; operator rings, then "briefing" 860–1100;
       marker "completeTransfer()" at 1100; app leaves; caller+operator accent from 1100. Chip "recording continues"
refer: marker "transfer({mode: refer})" at 640; accent "SIP REFER" arrow from app up to caller; app leaves;
       caller dashed "call leaves Fonoster"; operator dashed "called by the caller's side, outside Fonoster". Chip "recording stops"
Time axis with arrow at the bottom; legend top right
```

## Built from (Diagram Kit v1)

| Component | id | Used for |
| :--- | :--- | :--- |
| Diagram/Group | np3qG | lane backgrounds |
| Diagram/Pill | V8p0b | markers, SIP REFER |
| Diagram/Arrow R / D | oSkeo / AdWAH | time axis, REFER arrow (flipY) |

Bars, stripes, dashes and chips are plain nodes in the kit's style (`$ui:` tokens). Light = copy of dark with the theme switched.

## Re-export

```
Export(["UKjCd", "xMrG7"], "png", "docs-site/images/transfers", {scale: 1})
```
Then rename to `modes-dark.png` / `modes-light.png`.
