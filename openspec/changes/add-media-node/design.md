## Context

### What Asterisk does for Fonoster today, and where each part goes

| Today (Asterisk) | Where it goes |
| --- | --- |
| Registers to Routr as its only SIP peer, over TCP (`pjsip_wizard.conf`), re-registering every 600 s | Media node, same model, with `X-Session-Count` and a short interval (MN3) |
| Reads `X-App-Ref`, `X-Call-Ref`, `X-Call-Direction` and the `To` user (ingress number) from the INVITE | Media node, same headers, reported up through `media-control` |
| Codecs `g722,ulaw,alaw,gsm`; DTMF `rfc2833` by default (`run.sh`) | Media node: PCMU, PCMA, G.722, Opus (D2); DTMF three ways (MN8). GSM is dropped |
| `MixMonitor(${APP_REF}_${UNIQUEID}.wav)` records every call | A recording listener applied by app policy (`add-call-record`) |
| AMD via `AMD()` or the ML sidecar over AGI/AudioSocket (`mods/amd`) | A listener in the voice worker |
| `Stasis(mediacontroller)` hands calls to the apiserver over ARI | `media-control` between the gateway and the node |
| ARI answer, hangup, ring, sendDTMF | `media-control` commands |
| ARI play, playbacks control, TTS audio | The gateway: audio arrives as frames on the session participant |
| Snoop and external media (AudioSocket) to copy caller audio | Room forks (listeners and the session participant) |
| `dial`: originate plus a bridge | Add a participant to the room (MN2, MN5) |
| Mute and unmute | Dropped (`rework-voice-sdk`) |
| `TIMEOUT(absolute)=3600` | Configurable maximum duration, 4 h by default (MN11) |

### LiveKit, for comparison

LiveKit's SIP service ([docs](https://docs.livekit.io/sip/), [code](https://github.com/livekit/sip))
is Go, built on `sipgo` and Pion, with its own [media-sdk](https://github.com/livekit/media-sdk)
(mixer, jitter buffer, resampling, G.711, G.722, Opus, AMR-WB, SRTP, DTMF, tones). Every SIP call
becomes a participant in a room, chosen by dispatch rules; outbound calls are created with
`CreateSIPParticipant`; transfers are cold (REFER) or warm. Signaling runs over UDP, TCP or TLS,
and media can be SRTP ([secure trunking](https://docs.livekit.io/sip/secure-trunking)). The core
server is an SFU and does not mix; the SIP bridge produces one stream for the phone leg. Nodes
report load to Redis, a room must fit on one node, and a stopping node drains
([distributed setup](https://docs.livekit.io/home/self-hosting/distributed/)).

What we take: rooms as the unit, one "add participant" primitive, a room on one node, draining,
and their libraries. What we do differently: we are audio-first telephony, so the room is a mixer,
not an SFU; and Routr, which already balances peers by session count, stays the SIP edge.

## Goals / Non-Goals

**Goals:**

- A media node small enough to read in an afternoon and test entirely from the outside.
- Rooms that cover inbound, outbound, transfer and, later, conference without new concepts.
- A contract that can carry video later without breaking.
- Horizontal scaling with no new balancer.

**Non-Goals:**

- Speech, turn detection, format conversion for apps, the output queue (all in the gateway).
- Recording files, AMD logic, SIP trace capture (listeners and the Routr edge do these).
- Dial-in conferences across nodes, video, SIP REGISTER from end devices (Routr handles those).
- Live migration of calls between nodes.

## Decisions

**MN1. A room is an audio mixer with a track-based, video-ready contract.**
- Each participant hears the mix of everyone but themselves (mix-minus).
- Participants have tracks with `kind` and `codec`. The room's promise is per kind: audio is
  mixed; video, when added, will be forwarded per track. v1 implements audio only.
- Rejected: an audio-only contract, because adding video would then break `media-control`, the
  session frame header and listeners. Rejected: an SFU now, because it is much more machinery for
  an audio-first product.

**MN2. Transfer keeps the caller in the room by default; SIP REFER is optional.**
- Cold: the new party is dialed into the room and the session participant leaves on answer.
  Warm: the session stays until the app completes the transfer. Recording and the call record
  stay complete.
- `refer` mode sends a SIP REFER on the caller's leg and the node leaves the call.
- Rejected: REFER by default (the earlier tentative choice), because it loses recording and
  visibility once rooms make staying cheap. Rejected: room only, because some deployments want the
  capacity back.

**MN3. Routr balances new inbound calls with `least-sessions`, fed by fresh session counts.**
- Each node registers to Routr with `X-Session-Count` (Routr already reads it and sorts routes by
  it) and re-registers often, and right after a large change in load.
- A draining node reports itself full so Routr stops choosing it.
- Rejected: the control plane picking nodes for every inbound call, which adds a lookup and a
  Routr change. Rejected: round-robin, which ignores load and lets long calls pile up.

**MN4. Rooms live on one node; no cross-node joins in v1.**
- Every room is created by the node that received or placed the call. Transfers dial out from
  that node, so no cross-node joins exist in v1.
- Rejected for now: redirecting dial-in joins to the owning node (needs Routr to follow 3xx) and
  cascading rooms across nodes (complex). Dial-in conferences get their own design later.

**MN5. Originate: the control plane picks a node, the node dials into a room.**
- The API's create-call request goes to the control plane, which picks the least-loaded node from
  the session registry (NATS JetStream KV, D3) using the same counts sent to Routr.
- That node creates a room and adds a phone participant by sending the INVITE through Routr, which
  still chooses the carrier trunk. On answer the gateway opens the app's session (M2).
- Rejected: Routr picking the node for outbound calls, an unusual SIP flow that is harder to test.

**MN6. TLS and SRTP between the edge and the node are optional per deployment.**
- Off by default inside a private network; switchable on for zero-trust or private regions. The
  same code runs both ways and the conformance suite covers both.
- Carrier-facing TLS and SRTP terminate at the edge: Routr supports TLS and WSS transports, and
  RTPEngine translates SRTP to RTP.
- Rejected: always encrypted (CPU cost, no plain captures for debugging) and never encrypted (weak
  for networks we don't own).

**MN7. Reuse `sipgo` and `livekit/media-sdk` as libraries.**
- `sipgo` (BSD-2-Clause) for SIP; `media-sdk` (Apache-2.0) for the mixer, jitter buffer,
  resampling, codecs, SRTP, DTMF and tones. Both licenses are compatible with MIT.
- Our code is the room logic, `media-control`, forks and Routr registration. Because conformance
  tests check behavior, a library can be replaced later.
- Rejected: writing the media parts ourselves (months of work and bugs) and forking `livekit/sip`
  (we would inherit its coupling to LiveKit rooms).

**MN8. DTMF: RFC 4733, SIP INFO and in-band detection as a fallback.**
- RFC 4733 (RFC 2833) events first, SIP INFO when a peer uses it, and in-band tone detection only
  when neither is negotiated. Each path has its own conformance test.
- Rejected: RFC 4733 only (today's default) and RFC 4733 plus SIP INFO, which lose keypresses on
  audio-only paths.

**MN9. Drain on shutdown; a crash ends that node's calls.**
- Planned shutdown: report full to Routr, accept no new rooms, keep existing ones, exit when they
  end or a maximum wait passes.
- Crash: its calls drop; each affected call record is sealed with the failure noted, and each app
  receives `session.end` with `reason: "error"`.
- Rejected: migrating live calls on crash, which is very hard to make reliable and to test.

**MN10. SIP traces are captured at the Routr edge only.**
- The trace that matters for carrier troubleshooting is the carrier-facing one. The media node
  does not capture SIP.
- Rejected: capturing at both and merging (more moving parts), and at the node only (it never sees
  what the carrier actually sent).

**MN11. Limits: 4 hours per call, 10 participants per room.**
- Both are configurable per deployment; apps can lower the duration.
- Rejected: keeping 1 hour and 4 participants (too tight for supervisors and small conferences)
  and no limits (stuck calls run forever).

**MN12. Capacity bar: 200 G.711 calls per 2 vCPU.**
- 200 concurrent caller-plus-agent rooms on a 2 vCPU node with zero dropped frames and DTMF
  intact. Opus-heavy load is measured and reported separately.
- Rejected: matching the gateway's 100 (leaves capacity unused) and measuring first (no bar).

**MN13. Gateway audio travels as plain RTP; ports are set up inside `media-control`.**
- Agents never connect to the media node. The path is: agent, WebSocket session, gateway, RTP,
  room. The agent speaks only the session protocol; it never speaks SIP.
- The gateway's `participant.add` for its session participant offers a host, a port and a codec
  (for example PCM 16-bit at 16 kHz). The node answers with its own host and port. Audio then
  flows as ordinary RTP over UDP in both directions; SRTP is used when MN6 encryption is enabled.
- There is no SIP, no NATS and no WebSocket on this hop. Commands still travel over NATS
  request and reply (platform decision PL3); only the audio is RTP.
- Why: lowest latency, no head-of-line blocking on packet loss, and testable with standard RTP
  tools. It is the same idea as Asterisk's external media today.
- Rejected:
  - a WebSocket per call (TCP stalls audio on packet loss),
  - audio through NATS (every frame crosses the broker: an extra hop, broker load and jitter at
    50 messages per second per direction per call),
  - SIP from the gateway (heavy machinery and slower setup for an internal hop).

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| Real-time bugs (jitter, clock drift, packet loss) | Reused, battle-tested libraries; soak tests with impaired networks; replays of real carrier audio |
| Stale session counts at Routr | Short registration interval plus re-register on large changes; draining reports full |
| A room is capped by one node | 10 participants per room in v1; dial-in conferences designed separately |
| Dependence on LiveKit's media-sdk | Used through our own interfaces; conformance tests make it replaceable |
| Opus costs more CPU | Reported separately in load tests; capacity planning per codec mix |
| Operators lose Asterisk features they relied on | The retirement list is explicit; anything still needed must come back as a listener or a `media-control` command |

## Open Questions

1. **Hold details.** Hold as a `sendonly` re-INVITE on the caller's leg, or as mixing hold audio
   into the room while the leg stays `sendrecv`; and where hold audio comes from (gateway `play`,
   or a node-local file).
2. **Registration interval.** The exact value (proposed: 15 s) and the threshold for
   re-registering after a change in load.
3. **How Routr learns a node is draining.** A very high `X-Session-Count`, a dedicated header, or
   unregistering.
4. **`media-control` transport.** Resolved: commands travel over NATS request and reply (PL3) on
   `media.<nodeId>.commands`, replies are `{type: "ack" | "error", id}`, events are published on
   `media.<nodeId>.events.<roomRef>`; gateway audio travels as RTP (MN13).
5. **Dial-in conference affinity.** Deferred (MN4): redirect to the owning node, Routr affinity by
   room, or cascading.
6. **Opus capacity target.** A bar for Opus-heavy load once the first numbers exist.
7. **Edge capture format.** HEP to a capture service, or pcap written per call at Routr.
