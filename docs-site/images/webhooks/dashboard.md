# Asset build doc — dashboard

**Artifact:** `dashboard-dark.png`, `dashboard-light.png` (this folder)
**Used on:** `observe/webhooks`
**Type:** screenshot · copied from the dashboard design
**Preset:** 1192 wide, content only, exported at 2×
**Pencil node id:** `yI2R5` (dark), `NVTva` (light) (file: `designs/docs.pen`, frames "Docs / Webhooks / Screen · Webhooks page / Dark" and "… / Light")
**Source screen:** `designs/dashboard.pen` → "Webhooks / List / Default" (`DGsBL`), read only; dashboard.pen is never edited.

> Regenerate from this doc. Re-copy from dashboard.pen when the screen changes, then re-export.

## One message

Endpoints and deliveries live on one page; resend from it.

## What was copied

Page header, endpoints table, Recent deliveries. The design keeps Rotate and Delete in the row's ⋯ menu and shows the signing secret in a separate popup ("Webhooks / Created / Signing secret", iv8MU), so the inline alert is not on this image.

Sample data swapped in: one endpoint https://hooks.example.com/fonoster (call.ended, call_record.sealed), secret whsec_…0E2s, deliveries call.ended delivered (1 · last 200) and call_record.sealed failed (12 · last 503).

Colors and fonts are `$ui:` tokens from the `ui` library (fonoster.lib.pen), so the frame's
`theme: { "ui:mode": … }` gives light and dark. The dashboard design is dark; light is the same frame
with the theme switched (the design system defines both modes, and dashboard.pen has a light-mode screen).

## Re-export

```
Export(["yI2R5", "NVTva"], "png", "<dir>", {scale: 2})
```
Then rename to `dashboard-dark.png` / `dashboard-light.png`.
