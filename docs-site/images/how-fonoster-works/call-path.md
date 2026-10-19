# Asset build doc — call-path

**Artifact:** `call-path-dark.png`, `call-path-light.png` (this folder)
**Used on:** `concepts/how-fonoster-works`
**Type:** diagram · component / architecture (grouped by boundary, read left to right)
**Preset:** 16:9 1600 × 900 (exported at 1×, 1601 × 901 with stroke)
**Diagram Kit version:** v1 ("Docs / Diagram Kit", fdbKR)
**Pencil node id:** `qOjTY` (dark), `Xj5vj` (light) (file: `designs/docs.pen`, at x 1700)

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then re-export.

## One message

Every call enters through a number, a SIP agent or the API, goes to one application, and leaves a signed record
and webhooks, all inside one workspace in one region.

## Sources (ground truth)

- `docs-site/concepts/how-fonoster-works.mdx` — workspace, entry paths, application types, stream protocols, call record, webhooks.
- `.claude/docs/ASSET-QUEUE.md` — the queued node/edge spec.

## Node / edge spec

```
Boundaries: Region ⊃ Workspace ⊃ {Domain ⊃ SIP agent, Application ⊃ {Autopilot agent | Stream}}
Outside (left):  Browser (Talk to agent) · Phone (PSTN) · Softphone / desk phone · Your code (API, SDK, CLI)
Workspace:       Trunk · Number · Domain/SIP agent · Outbound call · Application · Call record · Webhooks
Outside (right): Your systems · Your server
Edges (accent = the call):
  Phone → Trunk ("carrier, SIP") · Trunk → Number · Softphone → SIP agent ("signs in")
  Your code → Outbound call · Number → Application ("routes to") · Outbound call → Application ("connects to")
  Browser → Autopilot agent ("test call") · Stream → Your server ("signed WebSocket")
Edges (muted = after the call / optional):
  Number ⇢ SIP agent ("or rings", dashed) · Application → Call record ("at hangup")
  Call record → Webhooks · Webhooks → Your systems
Tags: Stream: fonoster, twilio · Webhooks: call.started, call.ended, call.failed, call_record.sealed
Legend: accent = the call · muted = after the call
```

## Built from (Diagram Kit v1)

| Component | id | Used for |
| :--- | :--- | :--- |
| Diagram/Node | sEKX6 | entry points, trunk, number, SIP agent, outbound call, call record, your systems/server |
| Diagram/Node Accent | pifOQ | Autopilot agent |
| Diagram/Group | np3qG | Region, Workspace, Domain, Application (accent stroke override) |
| Diagram/Pill | V8p0b | edge labels |
| Diagram/Chip | PHmh8 | stream protocols, webhook events |
| Diagram/Arrow R / D | oSkeo / AdWAH | arrowheads |

Stream and Webhooks are plain frames in the Node style (they hold chips). Colors are `$ui:` tokens; the frame's
`theme: { "ui:mode": … }` picks light or dark (the project's convention, instead of flat `dgm-*` tokens).
Edges are 2px rectangles; the dashed edge is 6px dashes every 11px.

## How to change it

- **Minor content:** edit the instance in the `.pen` via the Pencil MCP, in both frames, re-export.
- **Structure:** update the spec above, mirror it in both frames, re-export.
- **Brand / style:** change the kit component or the `$ui:` token, re-export every ledger row.

## Re-export

```
Export(["qOjTY", "Xj5vj"], "png", "docs-site/images/how-fonoster-works", {scale: 1})
```
Then rename to `call-path-dark.png` / `call-path-light.png`.
