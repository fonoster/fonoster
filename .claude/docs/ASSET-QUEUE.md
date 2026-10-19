# Asset queue

Writers append rows here. The asset agent draws them in Pencil (`designs/docs.pen` in THIS worktree), exports them to `docs-site/images/<slug>/`, adds a row to `docs-site/images/ASSETS.md`, swaps the TODO comment in the page for the image, and moves the row to "Done".

## Pending

| Asset | Page | What |
| ----- | ---- | ---- |
| `quickstart/talk-to-agent-{light,dark}.png` | `quickstart` | Screenshot of the dashboard: agent "Front desk", **Talk to agent** panel ("Talk to Front desk", "Calls reach the saved version") in the Connected state: call timer, Mute and Hang up buttons; the "Call this number" card below. Takeaway: you call the agent from the browser, no number needed. Note: needs live dashboard. |

## Done

| Asset | Page |
| ----- | ---- |
| `introduction/banner-{light,dark}.png` | `introduction` |
| `how-fonoster-works/banner-{light,dark}.png` | `concepts/how-fonoster-works` |
| `how-fonoster-works/call-path-{light,dark}.png` (PNG, not SVG) | `concepts/how-fonoster-works` |
