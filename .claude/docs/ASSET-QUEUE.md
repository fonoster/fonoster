# Asset queue

Writers append rows here. The asset agent draws them in Pencil (`designs/docs.pen` in THIS worktree), exports them to `docs-site/images/<slug>/`, adds a row to `docs-site/images/ASSETS.md`, swaps the TODO comment in the page for the image, and moves the row to "Done".

## Pending

| Asset | Page | What |
| ----- | ---- | ---- |
| `quickstart/talk-to-agent-{light,dark}.png` | `quickstart` | Screenshot of the dashboard: agent "Front desk", **Talk to agent** panel ("Talk to Front desk", "Calls reach the saved version") in the Connected state: call timer, Mute and Hang up buttons; the "Call this number" card below. Takeaway: you call the agent from the browser, no number needed. Note: needs live dashboard. |
| `build-an-agent/configure-tab-{light,dark}.png` | `autopilot/build-an-agent` | Screenshot of the dashboard: agent "Front desk", **Configure** tab, showing the **Conversation** panel (First message, System prompt with token count, Goodbye message, Error message), **Model & voice** (Language model, Voice, Transcriber) and **Behavior** (Let callers interrupt, Hang up after silence 2 × 10 s, Max call length 10 min, Transfer to an operator +1 809 555 0100). Takeaway: where the main settings live. |
| `tools/tool-editor-{light,dark}.png` | `autopilot/tools` | Screenshot of the dashboard: agent "Front desk", **Tools** tab. Left: **Built-in** panel (`hangup` Always on, `transfer` On · +1 809 555 0100) and **Your tools** with `get_order_status` GET `https://api.example.com/orders/status`. Right: the tool editor with Description, Method GET, URL, Parameters (`order_number` string, required), Headers (`x-api-key`), "Say while it runs" = "One moment while I check that." and **Wait for response** on. Takeaway: a tool is a description plus a request. |
| `knowledge-base/lookup-{light,dark}.svg` | `autopilot/knowledge-base` | Diagram, left to right. Box "Caller says: How much is the premium plan?" → arrow "search (max 800 ms)" → cylinder "Your PDFs (workspace bucket)" → arrow "2 best passages" → box "Model request" which also receives two arrows from boxes "System prompt" and "Conversation history". Model request → arrow "reply" → box "Agent speaks". A dashed arrow from the passages to a small trash/"dropped after this reply" label, showing passages never enter the history. A side note on the search arrow: "slower than 800 ms → answer without it". Takeaway: documents are looked up fresh on every turn, capped at 800 ms, and only used for that one reply. |
| `turn-taking/banner-{light,dark}.png` | `autopilot/turn-taking` | Banner, same preset as the other banners (1600 × 600). Motif: two speech bubbles (caller and agent) handing a turn back and forth over a waveform; title "Turn-taking and barge-in". |
| `turn-taking/timeline-{light,dark}.svg` | `autopilot/turn-taking` | Timeline diagram, time flows left to right. Top lane "Caller": waveform block "My account number is…", gap (pause), waveform block "…4 8 1 0 2", then flat silence to the end. Middle lane "End-of-thought estimate": a line from 0 to 1 that rises during the first pause, crosses a dashed horizontal line labeled "halfway", drops back to near 0 when the caller speaks again, then rises steadily during the final silence, crossing "halfway" and reaching 1. Bottom lane "Agent": markers aligned with the curve: (1) at the first crossing, chip "likely ended → prepare reply (silent)"; (2) when the caller resumes, chip "resumed → drop it"; (3) at the second crossing, chip "likely ended → prepare reply"; (4) at 1, chip "ended → speak", followed by a waveform block "Thanks. I found your account." A small bracket over the final silence labeled "patience: low ← → high stretches this wait". Takeaway: the agent prepares at "likely ended", throws work away on "resumed", and only speaks on "ended", so it is fast without cutting people off. |

## Done

| Asset | Page |
| ----- | ---- |
| `introduction/banner-{light,dark}.png` | `introduction` |
| `how-fonoster-works/banner-{light,dark}.png` | `concepts/how-fonoster-works` |
| `how-fonoster-works/call-path-{light,dark}.png` (PNG, not SVG) | `concepts/how-fonoster-works` |
