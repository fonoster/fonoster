## Why

Asterisk carries every Fonoster call today, and we use a small slice of it: a SIP peer that
registers to Routr, channels driven over ARI, bridges for `dial`, `MixMonitor` recordings and an
AMD hook. That slice ties the apiserver to one Asterisk per call path, ships a large C codebase we
do not change, and makes horizontal scaling, encryption and testing harder than they need to be.

The layers above are now specified: apps talk to the VoiceSessionGateway, speech and turn-taking
live there, and every call leaves a call record. What remains below is narrow and well defined:
accept and place SIP calls, carry their audio, put participants together in a room, and fork audio
where it is needed. This change specifies that media node and the contract the gateway and control
plane use to drive it.

## What Changes

- **Agents never connect to the media node.** An agent speaks only the WebSocket session to the
  VoiceSessionGateway. The gateway joins the room as a session participant and exchanges audio
  with the node as plain RTP (SRTP when encrypted), with ports and codec set up inside
  `participant.add`; commands travel over NATS.
- **A Go media node replaces Asterisk.** It sits behind Routr and registers to it as today. It
  terminates SIP legs and RTP, decodes and encodes PCMU, PCMA, G.722 and Opus, detects DTMF three
  ways, and mixes audio in rooms. It has no dialplan, no speech, no IVR and no recording logic of
  its own.
- **Rooms are the core concept.** A room lives on one node and mixes audio so each participant
  hears everyone but themselves. Participants are SIP legs, the gateway's session, and listeners
  (audio forks). The contract is track-based: every participant has tracks with a `kind` (`audio`
  in v1) and a codec, so video can be added later as forwarding without breaking the contract.
- **One primitive: add a participant to a room.** Inbound calls, outbound calls (originate) and
  transfers all use it. Transfers keep the caller in the room by default (cold or warm); an
  optional SIP REFER mode steps the node out.
- **Load balancing through Routr.** Nodes register with an `X-Session-Count` header often enough
  for Routr's existing `least-sessions` algorithm to spread new calls. A draining node reports
  itself full. For outbound calls the control plane picks the node from the session registry.
- **Optional encryption between the edge and the node.** TLS signaling and SRTP media can be
  switched on per deployment. Carrier-facing TLS and SRTP stay at the edge (Routr and RTPEngine).
- **A new internal contract, `media-control`.** Commands go down (create room, add participant,
  dial, remove participant, transfer, hold, resume, send DTMF, attach listener, end room); audio
  and call events come up.
- **Reuse, not rewrite.** The SIP stack is `sipgo` (BSD-2-Clause) and the real-time audio parts
  (mixer, jitter buffer, resampling, codecs, SRTP, DTMF, tones) come from `livekit/media-sdk`
  (Apache-2.0), both used as libraries.
- **BREAKING (operators):** Asterisk, its dialplan, `MixMonitor` file naming
  (`{appRef}_{id}.wav`) and the ARI connection in the apiserver are retired. Recording becomes a
  listener applied by policy (`add-call-record`), AMD becomes a listener in the voice worker, and
  the absolute call timeout moves from 1 hour to a configurable 4 hours.

## Capabilities

### New Capabilities

- `media-node`: rooms, SIP legs, codecs, DTMF, balancing, encryption, draining and limits of the
  Go media node.
- `media-control`: the contract between the VoiceSessionGateway or control plane and the media
  node.

### Modified Capabilities

None. Related alignments in `add-voice-session-gateway` (transfer modes, track-id frame header),
`add-call-record` (SIP trace from the Routr edge) and `rework-voice-sdk` (transfer modes) are made
in those changes directly.

## Impact

- **Retired:** `asterisk/` (image, dialplan, `pjsip_wizard.conf`), the apiserver's ARI and
  AudioSocket handling, `MixMonitor` recordings, the Asterisk AMD path.
- **New:** a Go module for the media node, a `media-control` contract (proto or schema), Routr
  peer configuration for media nodes with `least-sessions`.
- **Unchanged:** Routr and RTPEngine as the SIP edge; Routr keeps choosing carrier trunks.
- **Operations:** nodes need a public or edge-reachable RTP range, a session registry (NATS
  JetStream KV) and drain support in the orchestrator (SIGTERM with a grace period).
- **Testing:** every behavior is checked through SIP, RTP and `media-control` only, so the
  conformance suite (`add-conformance-framework`) can run against any implementation.
