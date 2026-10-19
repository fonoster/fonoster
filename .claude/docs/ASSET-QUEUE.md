# Asset queue

Writers append rows here. The asset agent draws them in Pencil (`designs/docs.pen` in THIS worktree), exports them to `docs-site/images/<slug>/`, adds a row to `docs-site/images/ASSETS.md`, swaps the TODO comment in the page for the image, and moves the row to "Done".

## Pending

| Asset | Page | What |
| ----- | ---- | ---- |
| `introduction/banner-{light,dark}.png` | `introduction` | Banner, same preset as the other banners (1600 × 600). Motif: a phone call answered by an AI agent; tagline "The AI that answers the phone." Replace the `{/* TODO banner */}` comment with the light/dark <img> pair like hacking/overview.mdx. |
| `quickstart/talk-to-agent-{light,dark}.png` | `quickstart` | Screenshot of the dashboard: agent "Front desk", **Talk to agent** panel ("Talk to Front desk", "Calls reach the saved version") in the Connected state: call timer, Mute and Hang up buttons; the "Call this number" card below. Takeaway: you call the agent from the browser, no number needed. |
| `how-fonoster-works/banner-{light,dark}.png` | `concepts/how-fonoster-works` | Banner, same preset as the other banners (1600 × 600). Motif: a call flowing from a phone into a workspace and out to an AI agent. |
| `how-fonoster-works/call-path-{light,dark}.svg` | `concepts/how-fonoster-works` | Diagram. Outer frame "Region"; inside it a frame "Workspace". Left column (entry points), three boxes: "Phone (PSTN)", "Softphone / desk phone", "Your code (API, SDK, CLI)", plus a small "Browser (Talk to agent)". Middle column: "Number" box under a "Trunk" box (edge Phone → Trunk labeled "carrier, SIP"; Trunk → Number); "Domain" box containing "SIP agent" (edge Softphone → SIP agent labeled "signs in"); Your code → "Outbound call". Center: "Application" box split in two: "Autopilot agent (hosted by Fonoster)" and "Stream (your WebSocket server)" with two tags `fonoster` / `twilio`. Edges into Application: Number → Application labeled "routes to"; Outbound call → Application labeled "connects to"; Browser → Autopilot agent labeled "test call". Optional dashed edge Number → SIP agent labeled "or rings". Stream → an outside box "Your server" labeled "signed WebSocket". Right column (after the call): "Call record (signed: transcript, recording)" and "Webhooks" with event chips `call.started`, `call.ended`, `call.failed`, `call_record.sealed`; Application → Call record labeled "at hangup"; Call record → Webhooks; Webhooks → outside box "Your systems". Takeaway: every call enters through a number, a SIP agent or the API, goes to one application, and leaves a signed record and webhooks, all inside one workspace in one region. |

## Done

| Asset | Page |
| ----- | ---- |
