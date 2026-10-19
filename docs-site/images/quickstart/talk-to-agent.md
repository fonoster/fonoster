# Asset build doc — talk-to-agent

**Artifact:** `talk-to-agent-dark.png`, `talk-to-agent-light.png` (this folder)
**Used on:** `quickstart`
**Type:** screenshot · copied from the dashboard design
**Preset:** panel 440 wide on a 32px backdrop, exported at 2×
**Pencil node id:** `B2vUVK` (dark), `VzJBa` (light) (file: `designs/docs.pen`, frames "Docs / Quickstart / Screen · Talk to agent / Dark" and "… / Light")
**Source screen:** `designs/dashboard.pen` → "Agent / Detail / Talk to agent" (`S5mLA`), read only; dashboard.pen is never edited.

> Regenerate from this doc. Re-copy from dashboard.pen when the screen changes, then re-export.

## One message

You call the agent from the browser; no number needed.

## What was copied

The Talk to agent drawer only (header, In browser / Call my phone / Chat switch, microphone, Live call card, note). The two hidden fields (Your phone, Call from) were dropped. The design's buttons say **End call**; there is no Mute button and no "Call this number" card in the design, so they are not shown.

Sample data swapped in: agent Billing reminders → Front desk.

Colors and fonts are `$ui:` tokens from the `ui` library (fonoster.lib.pen), so the frame's
`theme: { "ui:mode": … }` gives light and dark. The dashboard design is dark; light is the same frame
with the theme switched (the design system defines both modes, and dashboard.pen has a light-mode screen).

## Re-export

```
Export(["B2vUVK", "VzJBa"], "png", "<dir>", {scale: 2})
```
Then rename to `talk-to-agent-dark.png` / `talk-to-agent-light.png`.
