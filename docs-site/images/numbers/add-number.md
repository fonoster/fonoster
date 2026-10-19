# Asset build doc — add-number

**Artifact:** `add-number-dark.png`, `add-number-light.png` (this folder)
**Used on:** `telephony/numbers`
**Type:** screenshot · copied from the dashboard design
**Preset:** drawer 480 wide on a 32px backdrop, exported at 2×
**Pencil node id:** `psT6W` (dark), `Qy2D2` (light) (file: `designs/docs.pen`, frames "Docs / Numbers / Screen · Add number / Dark" and "… / Light")
**Source screen:** `designs/dashboard.pen` → "Numbers / Create / Drawer" (`EBBhy`), read only; dashboard.pen is never edited.

> Regenerate from this doc. Re-copy from dashboard.pen when the screen changes, then re-export.

## One message

Where a number's destination is set.

## What was copied

The New number drawer only. In the design, Number and Location are read-only fields filled from the trunk, and the routing choice is Agent / Stream / SIP agent; the design has no separate City and Country fields.

Sample data swapped in: Name Support desk, Front desk checked, Trunk Claro, +1 809 555 0123, Santo Domingo, DO.

Colors and fonts are `$ui:` tokens from the `ui` library (fonoster.lib.pen), so the frame's
`theme: { "ui:mode": … }` gives light and dark. The dashboard design is dark; light is the same frame
with the theme switched (the design system defines both modes, and dashboard.pen has a light-mode screen).

## Re-export

```
Export(["psT6W", "Qy2D2"], "png", "<dir>", {scale: 2})
```
Then rename to `add-number-dark.png` / `add-number-light.png`.
