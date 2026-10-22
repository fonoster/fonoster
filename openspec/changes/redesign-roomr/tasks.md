> Ordered as the design document's "What changes" table (steps 1–10). Sizes from the document:
> S = days, M = 1 to 2 weeks, L = more. Nothing here is implemented by this change.
> WebRTC participants and passthrough mode are deferred to follow-up changes (see proposal.md).

## 1. Pass-through headers (S)

- [x] 1.1 Replace the node's built-in header names (`X-DOD-Number`, `X-App-Ref`, `X-Call-Ref`, `X-Call-Direction`) with a `headers` map on outbound dials and a full header map on inbound reports
- [x] 1.2 Move `X-DOD-Number` into the apiserver's pass-through headers in `placeOutboundCall`
- [x] 1.3 Test: an INVITE with an arbitrary `X-` header reaches the app in `Start.headers` unchanged; a `CreateCall` header appears on the outbound INVITE byte for byte; a header value with CR or LF is rejected

## 2. Registration as configuration (S)

- [x] 2.1 `sip.registrations[]` in the node config: `registrar`, `aor`, `auth`, `expires`, `headers` templates with `{sessions}`; zero entries disables REGISTER
- [x] 2.2 Digest authentication on REGISTER; re-register on the interval and on a load change past `reregisterDelta`
- [x] 2.3 `registration.state` event on NATS
- [x] 2.4 Test with the fake registrar: header templates rendered, no REGISTER without configuration, digest challenge answered (the "full on drain" assertion goes with task 13.1)

## 3. Capacity in the heartbeat (S)

- [x] 3.1 Add `max_rooms`, `version`, `region`, `control_addr`, `sip_addr`, `rtp_ports`, `participants` and `codecs` to the heartbeat
- [x] 3.2 Drain signal via gRPC health; remove refusal code: delete the refuse-while-draining paths (`503` for INVITEs, `UNAVAILABLE` for `CreateCall`); keep the `max_rooms` refusal (`503` inbound, `RESOURCE_EXHAUSTED` for `CreateCall`)
- [x] 3.3 Controller: score `1 - rooms / max_rooms` over eligible nodes (fresh heartbeat, below limit, in region); retry up to 3 nodes; synchronous capacity error (`createNodeDirectory`, `placeOutboundCall`)
- [x] 3.4 Test: a node at its limit is skipped; two controllers picking the same node resolve by refusal and retry; every node refusing fails the API call at once
- [x] 3.5 Controller: fail over only on `RESOURCE_EXHAUSTED`/`UNAVAILABLE`; on a timeout or lost connection retry the same node with the same `call_ref`
- [x] 3.6 Apiserver: write `placements.<callRef>` (`call_ref` → `node_ref`) to the registry before `CreateCall`; sweep entries whose node is down or answers `NOT_FOUND`, closing the record `FAILED`
- [x] 3.7 Node: no CPU- or memory-based refusal; `max_rooms` is the only admission limit
- [ ] 3.8 Test: a timed-out `CreateCall` is retried on the same node and the callee gets one INVITE; a replica killed between the registry write and the RPC is swept; a CPU-saturated node below `max_rooms` accepts
- [x] 3.9 Test: heartbeat content (`rooms`, `max_rooms`, `version`, `region`, dialable `control_addr`); a killed node is skipped by every controller within 6 s
- [x] 3.10 Remove `cpu_idle`: `cpu.go`, `cpu_unix.go`, `cpu_other.go`, the heartbeat field and its scenario
- [x] 3.11 Configurable `heartbeatInterval` (default 2 s)

## 4. Events keyed by call (S)

- [x] 4.1 Publish events on `roomr.events.<call_ref>` and `roomr.events.room.<room_ref>` with `node_ref` and per-call `seq`
- [x] 4.2 `call.started`, `call.ringing`, `call.answered`, `call.ended` (SIP status + cause), `room.ended`, `participant.joined`, `participant.left`
- [x] 4.3 Test: a second controller replica follows a call it did not place; `seq` is contiguous per call
- [x] 4.4 Per-room `seq` on `roomr.events.room.<room_ref>`
- [x] 4.5 Node: publish on core NATS best effort; while NATS is down keep calls, RPCs and streams running and drop unpublishable events (no blocking, no buffering)
- [x] 4.6 Apiserver: rely on the existing sweeps to close records and registry entries whose events were lost; no replay
- [ ] 4.7 Test (NATS fault injection): a call survives a 60 s outage; `call.ended` during the outage is not replayed and a sweep closes the record; per-room `seq` is contiguous
- [x] 4.8 Rename `labels` to `metadata` everywhere (proto field, events, `Start`, spec text, TS clients, tests); the node passes it through untouched; callers dictate the app reference through `metadata` (for example `app_ref`) and AppBridge reads it for outbound calls
- [x] 4.9 Test: `metadata` from `CreateCall` is echoed in every event and in `Start`
- [x] 4.10 Remove Roomr's session-registry KV writes (`sessionRegistry`, `nodes.*`, `rooms.*` entries); Roomr uses core NATS only

## 5. Control stream (M)

- [x] 5.1 `Session.Connect` proto: `MediaEndpoint`, `Start`, `Answer`, `Ready`, `Reject`, `Transfer`, `TransferComplete`, `Hold`, `Resume`, `SendDtmf`, `AddListener`, `RemoveListener`, `Hangup`, `Dtmf`, `Event` (no `Play`, `Stop` or `Record`: their field numbers are reserved)
- [x] 5.2 Node client: new connection per call, `Start` first, keepalive 10 s / 2 missed, hang up with cause `app_gone` on break, `503` when unreachable and `480` on answer timeout, optional TLS/mTLS from config
- [x] 5.3 AppBridge server: accept streams, answer on verified app connect (`Answer` with the `RtpLink` endpoint), `Ready` for outbound, map stream events to `session.end` reasons
- [ ] 5.4 Run the stream beside the NATS offer behind a flag; measurement 1 (50 calls/s burst across 10 appbridge pods: setup time and spread) and measurement 2 (one AppBridge pod at 500 and 1,000 calls: CPU and RTP jitter)
- [x] 5.5 Test: inbound answered on `Answer` only, with `180 Ringing` within 200 ms; `Reject` yields the given SIP status; stream break sends BYE; no audio bytes on the stream
- [x] 5.6 AppBridge-side keepalive on the stream (end the session after 2 missed pings)
- [x] 5.7 Node: `readyTimeout` (default 10 s) and unreachable session endpoint on an answered outbound call → BYE, `cause: "app_gone"`; `CANCEL` before `Answer` → `487`, `Ended` `caller_hangup`, stream closed
- [x] 5.8 Node: one `mediaTimeout` (default 15 s) for the caller and app legs → BYE, `cause: "media_timeout"` or `"app_gone"`
- [x] 5.9 AppBridge: the `cause` → `session.end` `reason` table, unknown cause → `error`
- [x] 5.10 Test: appbridge ends the session when the node is killed; Ready never arrives; endpoint unreachable on answer; caller cancels before `Answer`; app stops sending RTP
- [x] 5.11 Test: `media_timeout` with a short limit; SRTP app leg when both endpoints carry `srtp_key`; `max_duration_s` from `CreateCall` and from `Answer`
- [x] 5.12 Test: `SendDtmf`, `Hold`/`Resume`, cold, warm (completed and unanswered) and refer transfers sent on the stream
- [x] 5.13 Test (voice-session): every cause in the table maps to its `session.end` reason; an unknown cause maps to `error`
- [x] 5.14 Remove the `ownerTimeout` / appbridge-heartbeat watch (`orphans.go`) together with the NATS control path, not before

## 6. AppBridge behind a Service (S)

- [x] 6.1 Helm: appbridge Service for the control stream; NetworkPolicy allowing node-to-appbridge RTP and the control port; Compose equivalent
- [x] 6.2 Retire `appbridge.incoming` and `appbridge.outbound` and the claim logic in `Call.ts`
- [ ] 6.3 Test: 100 calls through the Service land on more than one AppBridge pod; audio flows under the shipped NetworkPolicy
- [x] 6.4 Helm: admit Roomr's control port only from the apiserver and its SIP port only from the SIP proxy (NetworkPolicy when Roomr runs on the pod network; a documented host firewall when `hostNetwork` is true); Compose: publish only the RTP range, not the SIP or control ports
- [ ] 6.5 Test: a pod other than the apiserver cannot reach Roomr's control port under the shipped policies (pod network)

## 7. Roomr over gRPC (M)

- [x] 7.1 `roomr.v1.Roomr` server on the node: `CreateCall`, `EndCall`, `CreateRoom`, `EndRoom`, `AddParticipant`, `RemoveParticipant` (no `Play`, `Record`, `Stop` or `SendDtmf` RPCs, no operations); typed gRPC status codes
- [x] 7.2 `CreateCall`: idempotent `call_ref`, dial through `to.proxy` (transport in the URI) with `to.headers` and `to.auth`, `room_ref` join-or-create, `session` override, `ring_timeout_s`, `max_duration_s`, `metadata`
- [x] 7.3 `AddParticipant` with `listen` for listen-only per-track RTP destinations (recording, AMD); `RemoveParticipant`
- [x] 7.4 Apiserver: `placeOutboundCall` calls `CreateCall` at the node's `control_addr`
- [x] 7.5 Retire the `media.<nodeId>.commands` subjects and the NATS command handlers
- [x] 7.6 Test: busy/no-answer/rejected calls create no room and no stream; `EndCall` ends inbound and outbound calls; `EndRoom` ends every call in the room
- [x] 7.7 `CreateCall` dedupe window as a constant 10 min (ended calls included; drop the `callDedupeWindow` key); different parameters → `ALREADY_EXISTS`; `401`/`407` answered with `to.auth`, never logged or echoed; `EndCall` while `RINGING` sends `CANCEL`
- [x] 7.8 `callRefHeader` config: a well-formed inbound header becomes the `call_ref`, else generated; `CreateCall` `to.headers` carries it; differing `call_ref` → `INVALID_ARGUMENT`
- [x] 7.9 `emptyRoomTimeout` (default 30 s): rooms with no participant and no `CreateCall` in progress end with `cause: "node_error"`
- [x] 7.10 Test: repeat after end returns `Call{ENDED}`; same ref with different `to` → `ALREADY_EXISTS`; `407` digest challenge answered with no password in logs, events or responses; cancel while ringing
- [x] 7.11 Test: inbound ref from the header, generated ref, outbound ref from `to.headers`, conflicting refs
- [x] 7.12 Test: `CreateRoom` with a taken ref → `ALREADY_EXISTS`; `RemoveParticipant` removes with `cause: "removed"`
- [ ] 7.13 Test: empty `CreateRoom` room and emptied room end after 30 s (short limit) with `node_error`
- [x] 7.14 `CreateRoom` accepts `empty_room_timeout_s` and `max_participants` overriding the node defaults; `maxParticipants` stays configurable on the node
- [x] 7.15 Test: per-room `empty_room_timeout_s` and `max_participants` are honored (`room_full` at the limit); the node-wide defaults apply otherwise

## 8. Opus first (S)

- [x] 8.1 Build the image with libopus (cgo); offer `opus/48000/2`, `G722/8000`, `PCMU/8000`, `PCMA/8000` in that order on SIP legs
- [x] 8.2 Test: an Opus-capable caller negotiates Opus and hears wideband audio; a PCMU-only trunk still negotiates PCMU; the load harness reports an Opus run separately
- [x] 8.3 Test: a GSM-only offer gets `488 Not Acceptable Here`

## 9. Room header

- [x] 9.1 `sip.roomHeader` config (the header name only); remove `onMissingRoom`: a room header always means join-or-create
- [x] 9.2 Join-or-create on the header; `Start` names the room; the node never redirects; generate room refs with at least 128 random bits
- [x] 9.3 Test: a second caller with the header lands in the first caller's room and the mix-minus checker confirms both hear each other; 1,000 generated room refs are distinct and random

## 10. Ports and packaging

- [x] 10.1 One RTP range for every leg: `rtp.host`, `rtp.advertise`, `rtp.portMin`/`rtp.portMax`; drop the separate public and app-leg ranges; fold `outboundTransport` into the `outboundProxy` URI; keep `rtp.host` and `control.grpc.advertise`
- [x] 10.2 Helm: document one node per host or non-overlapping ranges
- [x] 10.3 Test: two nodes on one host with non-overlapping ranges both carry calls; two nodes on different pod IPs share a range

## 11. Conformance

- [x] 11.1 Fake session endpoint (gRPC `Session` server) and fake controller (Roomr client) in `mods/conformance`
- [x] 11.2 Rewrite the `kind: media-control` scenario files for Roomr and the control stream; run them against the fake node and the Go node
- [x] 11.3 Mix-minus checker extended to RTP participants
- [x] 11.4 Fake registrar records header templates per REGISTER
- [ ] 11.5 Re-run the 200-room load bar on 2 vCPU with the control stream in place; Opus run reported separately; the load generator reads heartbeats
- [x] 11.6 gRPC `FakeRoomr` replacing the NATS role of `FakeNatsRoomr`
- [x] 11.7 Fake session endpoint modes: answer, reject, stall (no `Answer`/`Ready`), kill
- [x] 11.8 Fake controller driving several fake nodes
- [x] 11.9 Fake registrar reachable from YAML scenarios
- [x] 11.10 Fake SIP trunk/proxy recording Request-URI and headers, answering `200`, `486`, `407` or nothing on cue
- [x] 11.11 NATS fault injection (drop the connection, drop messages)
- [x] 11.12 Config overrides for short timeouts and limits (answer, `readyTimeout`, `mediaTimeout`, `emptyRoomTimeout`, `drainWait`, max duration)
- [x] 11.13 Retire the NATS-only scenarios `one-replica-claims`, `no-appbridge-answers`, `command-id-echoed`, `unknown-command-refused`, `ack-carries-results`
- [x] 11.14 Test: the node writes no audio file, with or without a recording listener
- [x] 11.15 Test: SIP over TLS with SDES-SRTP answers with SRTP; with no `tls` configured calls are plain

## 12. Docs and cleanup

- [x] 12.1 Update `go/roomr/README.md`, `openspec/rebuild.md` (Roomr node line) and the operator docs for the new config keys and ports (the minimal `roomr.yaml` in design.md)
- [x] 12.2 Remove the NATS offer path and flag once measurements pass; release note for the retired subjects

## 13. Drain and rollouts

- [x] 13.1 Roomr: serve `grpc.health.v1.Health` on the control port (`SERVING`); on SIGTERM set `NOT_SERVING`, send REGISTER `Expires: 0`, stop heartbeats, publish `node.down` (`type: "node.down"`) on `roomr.nodes.<node_ref>.heartbeat`; keep live rooms until they end or `drainWait` (default 1 h), then end them with `node_error` and exit; remove the `draining` heartbeat field and the `{sessions}`-as-limit rendering
- [x] 13.2 Remove the debug HTTP server (`debugAddr`, `/ready`, `/stats`)
- [x] 13.3 AppBridge: on SIGTERM fail readiness; keep streams and app sockets until they end or the maximum wait; no `MaxConnectionAge` on the `Session` server
- [x] 13.4 Helm: `terminationGracePeriodSeconds` at least the drain maximum wait, gRPC readiness probe for Roomr, readiness probe for AppBridge and a PodDisruptionBudget for each; no `MaxConnectionAge` on the `Roomr` server
- [x] 13.5 Test: on SIGTERM the gRPC health check reports `NOT_SERVING`, REGISTER `Expires: 0` is seen, `node.down` is published, heartbeats stop and rooms keep running; exit after the last room; short `drainWait` ends rooms with `node_error`; appbridge maximum wait; rendered chart drain settings
- [ ] 13.6 Test: rolling out AppBridge and Roomr with live calls drops none and new calls land on the new pods

## 14. Remove what Roomr does not need

- [x] 14.1 Remove the room token (JWT auth, token header strip and its `403` paths) from Roomr config and code
- [x] 14.2 Remove edge mTLS (`clientCa` on the SIP edge) and `requireEncryption`; keep optional SIP TLS (`tls.listen`/`cert`/`key`, TLS to the outbound proxy), optional SDES-SRTP and optional gRPC TLS, all off by default
- [x] 14.3 Remove `netguard` and `allowedDestinations` from Roomr; validate tenant hold-music URLs (`Hold`, warm-transfer `music`) upstream in the apiserver/AppBridge with the existing apiserver `allowedDestinations` check
- [x] 14.4 Config file only: remove the duplicate flags (about 37), keep `-config <path>`; move Helm's args into the file; `${VAR}` and `secret://` keep working
- [x] 14.5 Test (service-config): the node starts with `-config` alone and reads every other setting from the file
- [x] 14.6 Remove `trustedSources`, `allowAnySource` and the Helm render-fail check
- [x] 14.7 Remove the OTLP logs bridge (logs go to stderr); keep OTLP metrics and traces

## 15. Health and membership

- [x] 15.1 AppBridge: `mediaTimeout` in `appbridge.yaml` (default 15 s); end the call when the node's RTP stops for that long, seal the record with `media_timeout`
- [x] 15.2 AppBridge: serve `grpc.health.v1.Health` on the `Session` port (`SERVING`; `NOT_SERVING` on SIGTERM); Helm and Compose readiness probes use it
- [x] 15.3 Remove `appbridge.heartbeat` (AppBridge publisher, Roomr and region-agent subscribers, NATS permissions) and the `appbridges` registry lease; keep `calls.<callRef>` for call ownership
- [x] 15.4 Control plane: send `call.ended` with `endReason` `appbridge-lost` from the node's `call.ended` with `cause` `app_gone`, once per `callRef`, never after AppBridge's own; remove the lease-expiry path in `lostCalls`
- [x] 15.5 Region agent: report AppBridge readiness from its health check through the Service, and active calls as the sum of `rooms` in the nodes' heartbeats
- [x] 15.6 Test: a running replica reports `SERVING` and no `appbridge.heartbeat` or `appbridges.*` entry exists; SIGTERM reports `NOT_SERVING`
- [x] 15.7 Test: AppBridge killed mid-call yields exactly one `call.ended` (`appbridge-lost`) per call across two control-plane replicas
- [x] 15.8 Test: the node's RTP stopped with the stream open ends the session with `reason: "error"` and the record says `media_timeout`; NATS paused longer than `mediaTimeout` ends no call
- [x] 15.9 Test: a cell with no ready AppBridge shows `degraded` naming AppBridge; active calls equal the nodes' room count
