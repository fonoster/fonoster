# Asset build doc — tool-editor

**Artifact:** `tool-editor-dark.png`, `tool-editor-light.png` (this folder)
**Used on:** `autopilot/tools`
**Type:** screenshot · copied from the dashboard design
**Preset:** 1192 × 700 (main area, sidebar cropped), exported at 2×
**Pencil node id:** `Xdcfv` (dark), `y0Yw3` (light) (file: `designs/docs.pen`, frames "Docs / Tools / Screen · Tool editor / Dark" and "… / Light")
**Source screen:** `designs/dashboard.pen` → "Agent / Detail / Tools" (`T3l3zY`), read only; dashboard.pen is never edited.

> Regenerate from this doc. Re-copy from dashboard.pen when the screen changes, then re-export.

## One message

A tool is a description plus a request.

## What was copied

Main content: agent header, Tools tab, Built-in panel, Your tools, tool editor.

Sample data swapped in: get_order_status GET https://api.example.com/orders/status, one parameter order_number (string, required), x-api-key header, "One moment while I check that.", Wait for response on.

Colors and fonts are `$ui:` tokens from the `ui` library (fonoster.lib.pen), so the frame's
`theme: { "ui:mode": … }` gives light and dark. The dashboard design is dark; light is the same frame
with the theme switched (the design system defines both modes, and dashboard.pen has a light-mode screen).

## Re-export

```
Export(["Xdcfv", "y0Yw3"], "png", "<dir>", {scale: 2})
```
Then rename to `tool-editor-dark.png` / `tool-editor-light.png`.
