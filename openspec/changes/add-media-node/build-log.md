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

## 2026-10-15 (first Go slice)

### MN-B1. Where the code is

- `go/medianode` (module `github.com/fonoster/fonoster/go/medianode`), outside `mods/` so npm
  workspaces and lerna never see it. Go 1.25 (pinned `nats.go` v1.48 to avoid a 1.26 toolchain).
- `internal/node` (rooms, mixer, media-control), `internal/sipua` (sipgo UAS and Routr REGISTER),
  `internal/rtpio`, `internal/audio`, `internal/sdp`, `internal/caller` + `cmd/sipcaller` (the SIP
  caller bot, conformance 2.5 / media-node 1.1), `cmd/medianode`.

### MN-B2. `livekit/media-sdk` not used yet (MN7 deferred, not reversed)

- The slice needs only PCMU, L16 and RFC 4733, which are a few hundred lines; the mixer is a 20 ms
  mix-minus tick with a 4-frame inbox per participant (no real jitter buffer yet). media-sdk comes
  in with Opus, G.722, PCMA, SRTP and the jitter buffer, behind the same interfaces.

### MN-B3. Slice behavior choices

- `call.incoming` goes out only after the caller's room and RTP port exist; `answer` writes the SDP
  answer then. An INVITE with no PCMU gets 488 (other codecs are next slices).
- `hangup` before answer answers the INVITE with `sipStatus` (default 480); after answer it sends
  BYE. Ending reason is `rejected` with a status, `removed` without.
- Commands that exist in the contract but not in this version (`participant.dial`, transfers,
  listeners) answer `error` `not_implemented`; unknown ones answer `unknown_command`.
- Hold music: mono PCM16 WAV at 8 or 16 kHz, looped; anything else logs and plays silence.

### MN-B4. Results

- `go test -race ./...`: unit tests and 4 end-to-end tests (inbound slice, unclaimed → 503, reject
  404 and node BYE, heartbeats) pass.
- media-control scenarios: 11 of 20 pass against the Go node (9 need dial, transfers, listeners or
  fake-only measurements); all 20 pass against the fake node.
- voice-session through gateway → Go node → caller bot: 29 of 36 pass (7 need transfers or
  fake-only measurements). This is the first real-SIP, real-RTP run of the whole stack.
- Not yet tried against a real Routr (registration and `least-sessions` routing).
