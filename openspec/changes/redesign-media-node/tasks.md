> Ordered as the design document's "What changes" table (steps 1–10). Sizes from the document:
> S = days, M = 1 to 2 weeks, L = more. Nothing here is implemented by this change.

## 1. Pass-through headers (S)

- [ ] 1.1 Replace the node's built-in header names (`X-DOD-Number`, `X-App-Ref`, `X-Call-Ref`, `X-Call-Direction`) with a `headers` map on outbound dials and a full header map on inbound reports
- [ ] 1.2 Move `X-DOD-Number` into the apiserver's pass-through headers in `placeOutboundCall`
- [ ] 1.3 Test: an INVITE with an arbitrary `X-` header reaches the app in `Start.headers` unchanged; a `CreateCall` header appears on the outbound INVITE byte for byte

## 2. Registration as configuration (S)

- [ ] 2.1 `sip.registrations[]` in the node config: `registrar`, `aor`, `auth`, `expires`, `headers` templates with `{sessions}`; zero entries disables REGISTER
- [ ] 2.2 Digest authentication on REGISTER; re-register on the interval, on a load change past the threshold and on drain (reporting the limit as `{sessions}`)
- [ ] 2.3 `registration.state` event on NATS
- [ ] 2.4 Test with the fake registrar: header templates rendered, no REGISTER without configuration, "full" reported on drain

## 3. Capacity in the heartbeat (S)

- [ ] 3.1 Add `max_rooms`, `cpu_idle`, `version`, `region`, `control_addr`, `sip_addr`, `rtp_ports`, `participants` and `codecs` to the heartbeat
- [x] 3.2 Refuse at the limit: `503` for inbound INVITEs, `RESOURCE_EXHAUSTED` for `CreateCall`; `UNAVAILABLE` while draining
- [ ] 3.3 Controller: score `1 - rooms / max_rooms` over eligible nodes (fresh, not draining, below limit, in region); retry up to 3 nodes; synchronous capacity error (`createNodeDirectory`, `placeOutboundCall`)
- [ ] 3.4 Test: a node at its limit is skipped; two controllers picking the same node resolve by refusal and retry; every node refusing fails the API call at once

## 4. Events keyed by call (S)

- [ ] 4.1 Publish events on `media.events.<call_ref>` and `media.events.room.<room_ref>` with `node_ref`, per-call `seq` and `labels`
- [ ] 4.2 `call.started`, `call.ringing`, `call.answered`, `call.ended` (SIP status + cause), `operation.done`, `room.ended`, `participant.joined`, `participant.left`
- [ ] 4.3 Test: a second controller replica follows a call it did not place; `seq` is contiguous per call; labels from `CreateCall` are echoed

## 5. Control stream (M)

- [ ] 5.1 `Session.Connect` proto: `MediaEndpoint`, `Start`, `Answer`, `Ready`, `Reject`, `Play`, `Stop`, `Transfer`, `TransferComplete`, `Hold`, `Resume`, `SendDtmf`, `AttachListener`, `DetachListener`, `Record`, `Hangup`, `Dtmf`, `Event`
- [ ] 5.2 Node client: new connection per call, `Start` first, keepalive 10 s / 2 missed, hang up with cause `app_gone` on break, `503` when unreachable and `480` on answer timeout, TLS/mTLS from config
- [ ] 5.3 Gateway server: accept streams, answer on verified app connect (`Answer` with the `RtpLink` endpoint), `Ready` for outbound, map stream events to `session.end` reasons
- [ ] 5.4 Run the stream beside the NATS offer behind a flag; measurement 1 (50 calls/s burst across 10 gateway pods: setup time and spread) and measurement 2 (one gateway pod at 500 and 1,000 calls: CPU and RTP jitter)
- [ ] 5.5 Test: inbound answered on `Answer` only; `Reject` yields the given SIP status; stream break sends BYE; no audio bytes on the stream

## 6. Gateway behind a Service (S)

- [ ] 6.1 Helm: gateway Service for the control stream; NetworkPolicy allowing node-to-gateway RTP and the control port; Compose equivalent
- [ ] 6.2 Retire `gateway.incoming` and `gateway.outbound` and the claim logic in `Call.ts`
- [ ] 6.3 Test: 100 calls through the Service land on more than one gateway pod; audio flows under the shipped NetworkPolicy

## 7. MediaControl over gRPC (M)

- [ ] 7.1 `media.v1.MediaControl` server on the node: `CreateCall`, `EndCall`, `CreateRoom`, `EndRoom`, `Join`, `Leave`, `Play`, `Record`, `SendDtmf`; typed gRPC status codes
- [ ] 7.2 `CreateCall`: idempotent `call_ref`, dial through `to.proxy` with `to.headers` and `to.auth`, `room_ref` join-or-create, `session` override, `ring_timeout_s`, `max_duration_s`, labels
- [x] 7.3 `Join` with `listen` for listen-only per-track RTP destinations (recording, AMD); `Leave`
- [ ] 7.4 Apiserver: `placeOutboundCall` calls `CreateCall` at the node's `control_addr`
- [ ] 7.5 Retire the `media.<nodeId>.commands` subjects and the NATS command handlers
- [ ] 7.6 Test: busy/no-answer/rejected calls create no room and no stream; `EndCall` ends inbound and outbound calls; `EndRoom` ends every call in the room

## 8. Opus first (S)

- [ ] 8.1 Build the image with libopus (cgo); offer `opus/48000/2`, `G722/8000`, `PCMU/8000`, `PCMA/8000` in that order on SIP legs
- [ ] 8.2 Test: an Opus-capable caller negotiates Opus and hears wideband audio; a PCMU-only trunk still negotiates PCMU; the load harness reports an Opus run separately

## 9. Passthrough (M)

- [ ] 9.1 Forward packets without decoding for rooms with exactly two participants on the same codec; switch to mixing when a third joins and back when it leaves
- [ ] 9.2 Test: two PCMU legs exchange their exact payloads; adding a third participant mixes; DTMF detection still works in passthrough

## 10. WebRTC participants (L)

- [ ] 10.1 ICE on one UDP port per node (demux by ICE username), DTLS-SRTP, Opus then PCMU; `Join` with a WebRTC offer returns the SDP answer
- [ ] 10.2 Accept DTLS-SRTP on SIP legs for SIP.js clients through the proxy
- [ ] 10.3 Proposed API endpoint `POST /v1/rooms/{room}/webrtc` (SDP offer + token) calling `Join`
- [ ] 10.4 Retire RTPEngine from the browser path; update `talk-in-browser` and the bundle
- [ ] 10.5 Test: a browser joins a room where a SIP caller is present and both hear each other; two WebRTC peers on one node share the UDP port

## 11. Room header and token

- [ ] 11.1 `sip.roomHeader` config: `name`, `onMissingRoom`, `auth` (`jwt`: `header`, `publicKey`, `audience`)
- [ ] 11.2 Join-or-create on the header; `404` on `reject`; `403` on a bad, expired or missing token; `Start` names the room
- [ ] 11.3 Test: a second caller with the header lands in the first caller's room and the mix-minus checker confirms both hear each other; a forged token gets `403`

## 12. Ports and packaging

- [ ] 12.1 Node config: RTP range for app legs, public RTP range and advertised address for external legs, the WebRTC UDP port
- [ ] 12.2 Helm: document one node per host or non-overlapping ranges; publish the WebRTC port; Compose: publish the WebRTC port
- [ ] 12.3 Test: two nodes on one host with non-overlapping ranges both carry calls

## 13. Conformance

- [ ] 13.1 Fake session endpoint (gRPC `Session` server) and fake controller (MediaControl client) in `mods/conformance`
- [ ] 13.2 Rewrite the `kind: media-control` scenario files for MediaControl and the control stream; run them against the fake node and the Go node
- [ ] 13.3 Mix-minus checker extended to RTP and WebRTC participants and to passthrough rooms
- [ ] 13.4 Fake registrar records header templates per REGISTER
- [ ] 13.5 Re-run the 200-room load bar on 2 vCPU with the control stream in place; Opus run reported separately

## 14. Docs and cleanup

- [ ] 14.1 Update `go/medianode/README.md`, `openspec/rebuild.md` (media node line) and the operator docs for the new config keys and ports
- [ ] 14.2 Remove the NATS offer path and flag once measurements pass; release note for the retired subjects
