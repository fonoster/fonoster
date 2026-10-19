# Asset queue

Writers append rows here. The asset agent draws them in Pencil (`designs/docs.pen` in THIS worktree), exports them to `docs-site/images/<slug>/`, adds a row to `docs-site/images/ASSETS.md`, swaps the TODO comment in the page for the image, and moves the row to "Done".

## Pending

| Asset | Page | What |
| ----- | ---- | ---- |
| `quickstart/talk-to-agent-{light,dark}.png` | `quickstart` | Screenshot of the dashboard: agent "Front desk", **Talk to agent** panel ("Talk to Front desk", "Calls reach the saved version") in the Connected state: call timer, Mute and Hang up buttons; the "Call this number" card below. Takeaway: you call the agent from the browser, no number needed. Note: needs live dashboard. |
| `build-an-agent/configure-tab-{light,dark}.png` | `autopilot/build-an-agent` | Screenshot of the dashboard: agent "Front desk", **Configure** tab, showing the **Conversation** panel (First message, System prompt with token count, Goodbye message, Error message), **Model & voice** (Language model, Voice, Transcriber) and **Behavior** (Let callers interrupt, Hang up after silence 2 × 10 s, Max call length 10 min, Transfer to an operator +1 809 555 0100). Takeaway: where the main settings live. |
| `tools/tool-editor-{light,dark}.png` | `autopilot/tools` | Screenshot of the dashboard: agent "Front desk", **Tools** tab. Left: **Built-in** panel (`hangup` Always on, `transfer` On · +1 809 555 0100) and **Your tools** with `get_order_status` GET `https://api.example.com/orders/status`. Right: the tool editor with Description, Method GET, URL, Parameters (`order_number` string, required), Headers (`x-api-key`), "Say while it runs" = "One moment while I check that." and **Wait for response** on. Takeaway: a tool is a description plus a request. |

## Done

| Asset | Page |
| ----- | ---- |
| `introduction/banner-{light,dark}.png` | `introduction` |
| `how-fonoster-works/banner-{light,dark}.png` | `concepts/how-fonoster-works` |
| `how-fonoster-works/call-path-{light,dark}.png` (PNG, not SVG) | `concepts/how-fonoster-works` |
| `turn-taking/banner-{light,dark}.png` | `autopilot/turn-taking` |
| `turn-taking/timeline-{light,dark}.png` (PNG, not SVG) | `autopilot/turn-taking` |
| `knowledge-base/lookup-{light,dark}.png` (PNG, not SVG) | `autopilot/knowledge-base` |
