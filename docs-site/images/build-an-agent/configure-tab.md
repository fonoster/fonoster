# Asset build doc — configure-tab

**Artifact:** `configure-tab-dark.png`, `configure-tab-light.png` (this folder)
**Used on:** `autopilot/build-an-agent`
**Type:** screenshot · copied from the dashboard design
**Preset:** 1192 × 860 (main area, sidebar cropped), exported at 2×
**Pencil node id:** `V31RI` (dark), `S2xGj` (light) (file: `designs/docs.pen`, frames "Docs / Build an agent / Screen · Configure tab / Dark" and "… / Light")
**Source screen:** `designs/dashboard.pen` → "Agent / Detail / Configure" (`Vr01u`), read only; dashboard.pen is never edited.

> Regenerate from this doc. Re-copy from dashboard.pen when the screen changes, then re-export.

## One message

Where an agent's main settings live.

## What was copied

The main content of the screen (breadcrumb, agent header, tabs, Configure body). The app sidebar is cropped. The "Unsaved changes" marker was dropped.

Sample data swapped in: Front desk, English first/goodbye/error messages and prompt, Aura 2 Thalia en-US voice, one number +1 809 555 0123 (Claro), silence 2 × 10 s, max 10 min, transfer +1 809 555 0100.

Colors and fonts are `$ui:` tokens from the `ui` library (fonoster.lib.pen), so the frame's
`theme: { "ui:mode": … }` gives light and dark. The dashboard design is dark; light is the same frame
with the theme switched (the design system defines both modes, and dashboard.pen has a light-mode screen).

## Re-export

```
Export(["V31RI", "S2xGj"], "png", "<dir>", {scale: 2})
```
Then rename to `configure-tab-dark.png` / `configure-tab-light.png`.
