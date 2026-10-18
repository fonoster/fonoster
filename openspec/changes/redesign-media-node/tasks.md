> Ordered as the design document's "What changes" table (steps 1–10). Sizes from the document:
> S = days, M = 1 to 2 weeks, L = more. Nothing here is implemented by this change.

## 1. Pass-through headers (S)

- [ ] 1.1 Replace the node's built-in header names (`X-DOD-Number`, `X-App-Ref`, `X-Call-Ref`, `X-Call-Direction`) with a `headers` map on outbound dials and a full header map on inbound reports
- [ ] 1.2 Move `X-DOD-Number` into the apiserver's pass-through headers in `placeOutboundCall`
- [ ] 1.3 Test: an INVITE with an arbitrary `X-` header reaches the app in `Start.headers` unchanged; a `CreateCall` header appears on the outbound INVITE byte for byte

## 2. Registration as configuration (S)

- [x] 2.1 `sip.registrations[]` in the node config: `registrar`, `aor`, `auth`, `expires`, `headers` templates with `{sessions}`; zero entries disables REGISTER
- [x] 2.2 Digest authentication on REGISTER; re-register on the interval, on a load change past the threshold and on drain (reporting the limit as `{sessions}`)
- [x] 2.3 `registration.state` event on NATS
- [x] 2.4 Test with the fake registrar: header templates rendered, no REGISTER without configuration, "full" reported on drain

## 3. Capacity in the heartbeat (S)

- [x] 3.1 Add `max_rooms`, `cpu_idle`, `version`, `region`, `control_addr`, `sip_addr`, `rtp_ports`, `participants` and `codecs` to the heartbeat
- [x] 3.2 Refuse at the limit: `503` for inbound INVITEs, `RESOURCE_EXHAUSTED` for `CreateCall`; `UNAVAILABLE` while draining
- [ ] 3.3 Controller: score `1 - rooms / max_rooms` over eligible nodes (fresh, not draining, below limit, in region); retry up to 3 nodes; synchronous capacity error (`createNodeDirectory`, `placeOutboundCall`)
- [ ] 3.4 Test: a node at its limit is skipped; two controllers picking the same node resolve by refusal and retry; every node refusing fails the API call at once
- [ ] 3.5 Controller: fail over only on `RESOURCE_EXHAUSTED`/`UNAVAILABLE`; on a timeout or lost connection retry the same node with the same `call_ref`; `cpu_idle` ignored for eligibility and score
- [ ] 3.6 Apiserver: write `call_ref` → `node_ref` to the registry before `CreateCall`; sweep entries whose node is down or answers `NOT_FOUND`, closing the record `FAILED`
- [ ] 3.7 Node: no CPU- or memory-based refusal; `max_rooms` is the only admission limit
- [ ] 3.8 Test: a timed-out `CreateCall` is retried on the same node and the callee gets one INVITE; a replica killed between the registry write and the RPC is swept; a CPU-saturated node below `max_rooms` accepts
- [ ] 3.9 Test: heartbeat content (`rooms`, `max_rooms`, `version`, `region`, `draining`, dialable `control_addr`); a killed node is skipped by every controller within 6 s

## 4. Events keyed by call (S)

- [x] 4.1 Publish events on `roomr.events.<call_ref>` and `roomr.events.room.<room_ref>` with `node_ref`, per-call `seq` and `labels`
- [x] 4.2 `call.started`, `call.ringing`, `call.answered`, `call.ended` (SIP status + cause), `operation.done`, `room.ended`, `participant.joined`, `participant.left`
- [x] 4.3 Test: a second controller replica follows a call it did not place; `seq` is contiguous per call; labels from `CreateCall` are echoed
- [ ] 4.4 Per-room `seq` on `roomr.events.room.<room_ref>`
- [ ] 4.5 Node: publish on core NATS best effort; while NATS is down keep calls, RPCs and streams running and drop unpublishable events (no blocking, no buffering)
- [ ] 4.6 Apiserver: rely on the existing sweeps to close records and registry entries whose events were lost; no replay
- [ ] 4.7 Test (NATS fault injection): a call survives a 60 s outage; `call.ended` during the outage is not replayed and a sweep closes the record; per-room `seq` is contiguous; receivers ignore an unknown event type and unknown fields

## 5. Control stream (M)

- [ ] 5.1 `Session.Connect` proto: `MediaEndpoint`, `Start`, `Answer`, `Ready`, `Reject`, `Play`, `Stop`, `Transfer`, `TransferComplete`, `Hold`, `Resume`, `SendDtmf`, `AttachListener`, `DetachListener`, `Record`, `Hangup`, `Dtmf`, `Event`
- [ ] 5.2 Node client: new connection per call, `Start` first, keepalive 10 s / 2 missed, hang up with cause `app_gone` on break, `503` when unreachable and `480` on answer timeout, TLS/mTLS from config
- [ ] 5.3 Gateway server: accept streams, answer on verified app connect (`Answer` with the `RtpLink` endpoint), `Ready` for outbound, map stream events to `session.end` reasons
- [ ] 5.4 Run the stream beside the NATS offer behind a flag; measurement 1 (50 calls/s burst across 10 gateway pods: setup time and spread) and measurement 2 (one gateway pod at 500 and 1,000 calls: CPU and RTP jitter)
- [ ] 5.5 Test: inbound answered on `Answer` only; `Reject` yields the given SIP status; stream break sends BYE; no audio bytes on the stream
- [ ] 5.6 Gateway-side keepalive on the stream (end the session after 2 missed pings)
- [ ] 5.7 Node: ready timeout (default 10 s) and unreachable session endpoint on an answered outbound call → BYE, `cause: "app_gone"`; `CANCEL` before `Answer` → `487`, `Ended` `caller_hangup`, stream closed
- [ ] 5.8 Node: app media timeout (default 30 s) → BYE, `cause: "app_gone"`
- [ ] 5.9 Gateway: the `cause` → `session.end` `reason` table, unknown cause → `error`
- [ ] 5.10 Test: gateway ends the session when the node is killed; Ready never arrives; endpoint unreachable on answer; caller cancels before `Answer`; app stops sending RTP
- [ ] 5.11 Test: `media_timeout` with a short limit; `encryption_required` refusal and SRTP app leg; `max_duration_s` from `CreateCall` and from `Answer`
- [ ] 5.12 Test: `SendDtmf`, `Hold`/`Resume`, cold, warm (completed and unanswered) and refer transfers sent on the stream
- [ ] 5.13 Test (voice-session): every cause in the table maps to its `session.end` reason; an unknown cause maps to `error`

## 6. Gateway behind a Service (S)

- [ ] 6.1 Helm: gateway Service for the control stream; NetworkPolicy allowing node-to-gateway RTP and the control port; Compose equivalent
- [ ] 6.2 Retire `gateway.incoming` and `gateway.outbound` and the claim logic in `Call.ts`
- [ ] 6.3 Test: 100 calls through the Service land on more than one gateway pod; audio flows under the shipped NetworkPolicy
- [ ] 6.4 Helm: admit Roomr's control port only from the apiserver and its SIP port only from the SIP proxy (NetworkPolicy, or documented host firewall under host networking); Compose: do not publish the control port, document the SIP port rule
- [ ] 6.5 Test: a pod other than the apiserver cannot reach Roomr's control port under the shipped policies

## 7. Roomr over gRPC (M)

- [ ] 7.1 `roomr.v1.Roomr` server on the node: `CreateCall`, `EndCall`, `CreateRoom`, `EndRoom`, `Join`, `Leave`, `Play`, `Record`, `SendDtmf`; typed gRPC status codes
- [ ] 7.2 `CreateCall`: idempotent `call_ref`, dial through `to.proxy` with `to.headers` and `to.auth`, `room_ref` join-or-create, `session` override, `ring_timeout_s`, `max_duration_s`, labels
- [x] 7.3 `Join` with `listen` for listen-only per-track RTP destinations (recording, AMD); `Leave`
- [ ] 7.4 Apiserver: `placeOutboundCall` calls `CreateCall` at the node's `control_addr`
- [ ] 7.5 Retire the `media.<nodeId>.commands` subjects and the NATS command handlers
- [ ] 7.6 Test: busy/no-answer/rejected calls create no room and no stream; `EndCall` ends inbound and outbound calls; `EndRoom` ends every call in the room
- [ ] 7.7 `CreateCall` dedupe window (default 10 min, ended calls included); different parameters → `ALREADY_EXISTS`; `401`/`407` answered with `to.auth`, never logged or echoed; `EndCall` while `RINGING` sends `CANCEL`
- [ ] 7.8 `call_ref_header` config: a well-formed inbound header becomes the `call_ref`, else generated; `CreateCall` `to.headers` carries it; differing `call_ref` → `INVALID_ARGUMENT`
- [ ] 7.9 Rooms with no participant and no `CreateCall` in progress for 30 s end with `cause: "node_error"`
- [ ] 7.10 Test: repeat after end returns `Call{ENDED}`; same ref with different `to` → `ALREADY_EXISTS`; `407` digest challenge answered with no password in logs, events or responses; cancel while ringing
- [ ] 7.11 Test: inbound ref from the header, generated ref, outbound ref from `to.headers`, conflicting refs
- [ ] 7.12 Test: `CreateRoom` with a taken ref → `ALREADY_EXISTS`; `Leave` removes with `cause: "removed"`; `Play`/`Stop`/`Record` return operations and report `operation.done` (`stopped` on `Stop`); `SendDtmf` RPC sends RFC 4733 in order; unknown field ignored
- [ ] 7.13 Test: empty `CreateRoom` room and emptied room end after 30 s (short limit) with `node_error`

## 8. Opus first (S)

- [ ] 8.1 Build the image with libopus (cgo); offer `opus/48000/2`, `G722/8000`, `PCMU/8000`, `PCMA/8000` in that order on SIP legs
- [ ] 8.2 Test: an Opus-capable caller negotiates Opus and hears wideband audio; a PCMU-only trunk still negotiates PCMU; the load harness reports an Opus run separately
- [ ] 8.3 Test: a GSM-only offer gets `488 Not Acceptable Here`

## 9. Passthrough (M)

- [ ] 9.1 Forward packets without decoding for rooms with exactly two participants on the same codec; switch to mixing when a third joins and back when it leaves
- [ ] 9.2 Test: two PCMU legs exchange their exact payloads; adding a third participant mixes; DTMF detection still works in passthrough

## 10. WebRTC participants (L)

- [ ] 10.1 ICE on one UDP port per node (demux by ICE username), DTLS-SRTP, Opus then PCMU; `Join` with a WebRTC offer returns the SDP answer
- [ ] 10.2 Accept DTLS-SRTP on SIP legs for SIP.js clients through the proxy
- [ ] 10.3 Proposed API endpoint `POST /v1/rooms/{room}/webrtc` (SDP offer + token) calling `Join`
- [ ] 10.4 Retire RTPEngine from the browser path; update `talk-in-browser` and the bundle
- [ ] 10.5 Test: a browser joins a room where a SIP caller is present and both hear each other; two WebRTC peers on one node share the UDP port
- [ ] 10.6 Test (talk-in-browser, headless pion peer): a browser call with a valid token reaches the agent with ICE paired on the node's WebRTC port and no RTPEngine; an invalid token gets `403`

## 11. Room header and token

- [ ] 11.1 `sip.roomHeader` config: `name`, `onMissingRoom`, `auth` (`jwt`: `header`, `publicKey`, `audience`)
- [ ] 11.2 Join-or-create on the header; `404` on `reject`; `403` on a bad, expired or missing token; `Start` names the room
- [ ] 11.3 Test: a second caller with the header lands in the first caller's room and the mix-minus checker confirms both hear each other; a forged token gets `403`
- [ ] 11.4 Strip the token header from `Start.headers` and never log the token; generate room refs with at least 128 random bits
- [ ] 11.5 Test: the token is absent from `Start.headers` and logs; 1,000 generated room refs are distinct and random

## 12. Ports and packaging

- [ ] 12.1 Node config: RTP range for app legs, public RTP range and advertised address for external legs, the WebRTC UDP port
- [ ] 12.2 Helm: document one node per host or non-overlapping ranges; publish the WebRTC port; Compose: publish the WebRTC port
- [ ] 12.3 Test: two nodes on one host with non-overlapping ranges both carry calls

## 13. Conformance

- [ ] 13.1 Fake session endpoint (gRPC `Session` server) and fake controller (Roomr client) in `mods/conformance`
- [ ] 13.2 Rewrite the `kind: media-control` scenario files for Roomr and the control stream; run them against the fake node and the Go node
- [ ] 13.3 Mix-minus checker extended to RTP and WebRTC participants and to passthrough rooms
- [x] 13.4 Fake registrar records header templates per REGISTER
- [ ] 13.5 Re-run the 200-room load bar on 2 vCPU with the control stream in place; Opus run reported separately
- [ ] 13.6 gRPC `FakeRoomr` replacing the NATS role of `FakeMediaNode`
- [ ] 13.7 Fake session endpoint modes: answer, reject, stall (no `Answer`/`Ready`), kill
- [ ] 13.8 Fake controller driving several fake nodes
- [ ] 13.9 Fake registrar reachable from YAML scenarios
- [ ] 13.10 Fake SIP trunk/proxy recording Request-URI and headers, answering `200`, `486`, `407` or nothing on cue
- [ ] 13.11 Headless WebRTC peer (pion) wired to the mix-minus checker
- [ ] 13.12 NATS fault injection (drop the connection, drop messages)
- [ ] 13.13 Config overrides for short timeouts and limits (answer, ready, media, app media, ownerless room, drain wait, max duration)
- [ ] 13.14 Retire the NATS-only scenarios `one-replica-claims`, `no-gateway-answers`, `command-id-echoed`, `unknown-command-refused`, `ack-carries-results`
- [ ] 13.15 Test: a call without `Record` writes no audio file

## 14. Docs and cleanup

- [ ] 14.1 Update `go/roomr/README.md`, `openspec/rebuild.md` (media node line) and the operator docs for the new config keys and ports
- [ ] 14.2 Remove the NATS offer path and flag once measurements pass; release note for the retired subjects

## 15. Drain and rollouts

- [ ] 15.1 Roomr: on SIGTERM fail readiness, heartbeat `draining: true`, render `{sessions}` as full; serve live rooms until they end or `drain.max_wait` (default 1 h), then end them with `node_error` and exit
- [ ] 15.2 Gateway: on SIGTERM fail readiness; keep streams and app sockets until they end or the maximum wait; no `MaxConnectionAge` on the `Session` server
- [ ] 15.3 Helm: `terminationGracePeriodSeconds` at least the drain maximum wait, readiness probes and a PodDisruptionBudget for the gateway and Roomr; no `MaxConnectionAge` on the `Roomr` server
- [ ] 15.4 Test: readiness fails on SIGTERM while rooms keep running; exit after the last room; short `drain.max_wait` ends rooms with `node_error`; gateway maximum wait; rendered chart drain settings
- [ ] 15.5 Test: rolling out the gateway and Roomr with live calls drops none and new calls land on the new pods
