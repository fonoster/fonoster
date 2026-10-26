# Asset build doc — talk-to-agent

**Artifact:** `talk-to-agent-dark.png`, `talk-to-agent-light.png` (this folder)
**Used on:** `quickstart`
**Type:** screenshot · copied from the dashboard design
**Preset:** panel 440 wide on a 32px backdrop, exported at 2×
**Pencil node id:** `B2vUVK` (dark), `VzJBa` (light) (file: `designs/docs.pen`, frames "Docs / Quickstart / Screen · Talk to agent / Dark" and "… / Light")
**Source screen:** `designs/dashboard.pen` → the "Talk drawer" component on "Agent / Detail / Talk to agent" (`S5mLA`), read only; dashboard.pen is never edited from here.

> Regenerate from this doc. Re-copy from dashboard.pen when the screen changes, then re-export.

## One message

You call the agent from the browser; no number needed.

## What was copied

A copy of the **Talk drawer** component (dashboard.pen, the drawer the dashboard ships): header, the
browser card before a call (Talk in the browser, Call) and the Call this number card. The copy is
detached, so it does not follow later edits to the component; re-copy it when the component changes.

Sample data swapped in: agent Billing reminders → Front desk. At this Quickstart step the agent has
no number yet, so both number fields are hidden and the card's **Empty** state (No phone number is
linked yet, Go to Numbers) is shown.

Colors are the dashboard's theme tokens (`--card`, `--muted`, `--primary`…), which follow the frame's
theme: the Dark frame is set to dark, the Light frame to light, and the drawer inside is the same.

## Re-export

```
Export(["B2vUVK", "VzJBa"], "png", "<dir>", {scale: 2})
```
Then rename to `talk-to-agent-dark.png` / `talk-to-agent-light.png`. In Pen: select each frame, Export at 2x, PNG.
