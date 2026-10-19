# Asset queue

Writers append rows here. The asset agent draws them in Pencil (`designs/docs.pen` in THIS worktree), exports them to `docs-site/images/<slug>/`, adds a row to `docs-site/images/ASSETS.md`, swaps the TODO comment in the page for the image, and moves the row to "Done".

## Pending

| Asset | Page | What |
| ----- | ---- | ---- |
| `sip-agents/softphone-settings-{light,dark}.png` | `telephony/sip-agents` | Screenshot of the dashboard: **SIP agents** page with the drawer for "Maria's softphone" open (description `sip:maria@acme.sip.fonoster.com`), showing Name, Username `maria` (fixed), Domain `Acme HQ`, Credentials, Privacy None, Max contacts, Enabled on, and the **Softphone settings** block with Server, Port and Transport copy fields. Takeaway: the values to type into the softphone are on the SIP agent. |

Blocked: `sip-agents/softphone-settings` — dashboard.pen has no SIP agent drawer or Softphone settings block (only "SIP agents / List / Default"). Draw it once the screen exists in the design.

## Done

| Asset | Page |
| ----- | ---- |
| `introduction/banner-{light,dark}.png` | `introduction` |
| `how-fonoster-works/banner-{light,dark}.png` | `concepts/how-fonoster-works` |
| `how-fonoster-works/call-path-{light,dark}.png` (PNG, not SVG) | `concepts/how-fonoster-works` |
| `turn-taking/banner-{light,dark}.png` | `autopilot/turn-taking` |
| `turn-taking/timeline-{light,dark}.png` (PNG, not SVG) | `autopilot/turn-taking` |
| `knowledge-base/lookup-{light,dark}.png` (PNG, not SVG) | `autopilot/knowledge-base` |
| `telephony/banner-{light,dark}.png` | `telephony/numbers` |
| `voice-sdk/session-flow-{light,dark}.png` | `streams/voice-sdk` |
| `numbers/routing-{light,dark}.png` (PNG, not SVG) | `telephony/numbers` |
| `link-twilio/what-it-creates-{light,dark}.png` (PNG, not SVG) | `telephony/link-twilio` |
| `trunks/inbound-outbound-{light,dark}.png` (PNG, not SVG) | `telephony/trunks` |
| `transfers/modes-{light,dark}.png` (PNG, not SVG) | `telephony/transfers` |
| `call-records/lifecycle-{light,dark}.png` | `observe/call-records` |
| `quickstart/talk-to-agent-{light,dark}.png` (copied from dashboard.pen) | `quickstart` |
| `build-an-agent/configure-tab-{light,dark}.png` (copied from dashboard.pen) | `autopilot/build-an-agent` |
| `tools/tool-editor-{light,dark}.png` (copied from dashboard.pen) | `autopilot/tools` |
| `numbers/add-number-{light,dark}.png` (copied from dashboard.pen) | `telephony/numbers` |
| `webhooks/dashboard-{light,dark}.png` (copied from dashboard.pen) | `observe/webhooks` |
| `access/save-secret-{light,dark}.png` (copied from dashboard.pen) | `workspace/access` |
| `access/credentials-{light,dark}.png` | `workspace/access` |
| `mcp/flow-{light,dark}.png` | `workspace/mcp` |
| `reference-api/banner-{light,dark}.png` | `reference/api` |
| `provider-catalog/lifecycle-{light,dark}.png` (PNG, not SVG) | `self-hosting/provider-catalog` |
| `call-record-keys/rotation-{light,dark}.png` (PNG, not SVG) | `self-hosting/call-record-keys` |
| `turn-taking-and-audio/recording-precedence-{light,dark}.png` (PNG, not SVG) | `self-hosting/turn-taking-and-audio` |
