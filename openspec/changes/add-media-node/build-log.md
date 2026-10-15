# add-media-node build log

## 2026-10-15 (spec review rulings, with the owner)

A separate reviewer read every rebuild spec; the owner ruled on each finding one by one.

### MN-R1. Rulings applied to the specs

- S1: Routr's `X-App-Ref` decides the app (MN14); the gateway's number routing file is dev-only.
- S2: `ring`, `reason` + `sipStatus` on endings, `node.heartbeat` / `node.down`, RTP block fields,
  listener RTP destinations, `unknown_command` for unknown commands (MN16).
- S7: `call.incoming` and `gateway.outbound` are claimed by request and reply (MN15, PL3 revised).
- S9: hold by mixing with node-fetched music; warm transfer holds the caller, 30 s no-answer (MN17).
- S6: SIP traces dropped for the first release (MN10 revised).
- Media-control scenarios (`kind: media-control`) are the next asset (tasks 1.0).
