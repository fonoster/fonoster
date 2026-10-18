## Context

Source: the design document "Media Node: Target Design" (2026-10-17,
https://claude.ai/code/artifact/2e54576e-d7d4-42af-ae84-5c249b6eb88c) and the decisions agreed
with the owner that day. Where the document still shows an open alternative, the agreed decision
is recorded here and the alternative is listed under "Alternatives rejected".

What exists today (`go/roomr`, `mods/apiserver/src/outbound`, `mods/appbridge`): the node
registers to Routr with `X-Session-Count`, reads `X-App-Ref`/`X-Call-Ref`/`X-Call-Direction` from
the INVITE, offers each call on `gateway.incoming` and waits 500 ms (twice) for a claim, serves
commands on `media.<nodeId>.commands`, publishes events on `media.<nodeId>.events.<roomRef>` and a
heartbeat every 2 s. The gateway's `RtpLink` already exchanges L16/16000 RTP with the node, with
ports negotiated inside `participant.add`. The apiserver's `createNodeDirectory` picks the
least-loaded non-draining node from heartbeats and `placeOutboundCall` sends `room.create`,
`gateway.outbound` and `participant.dial` with `X-DOD-Number`. Most of the audio path survives
unchanged; what changes is signaling, control and configuration.

Product name: **Roomr** (see proposal.md, "Naming"). This document says "the node".

## Goals / Non-Goals

Goals: a node that can be run and tested with nothing but a SIP peer, a gRPC session endpoint and
NATS; no race on the inbound path; one ordered control channel per call; capacity-aware placement
with the node as the final judge; rooms reachable by header for human join-in and browser clients;
Opus-first wideband audio; a passthrough fast path.

Non-goals (agreed): video, rooms spanning nodes, 48 kHz mixing, seeding the proxy's session
affinity for room-header joins, migrating live calls off a dead node, reconnecting a call to
another app pod.

## Architecture

```
                 SIP (UDP/TCP/TLS/WSS)           Roomr (gRPC)
  SIP proxy / registrar  <────────────>  NODE  <─────────────────  Controller
  (optional, configured)                  │ │                        (in Fonoster: apiserver)
                                          │ │  NATS: heartbeat + events (never audio, never offers)
  Browsers  <── ICE / DTLS-SRTP / Opus ───┘ │
                                            │ per call: gRPC control stream (new connection)
                                            ▼
                                  Session endpoint (K8s Service)
                                            │ routed to one app pod
                                            ▼
                                    App pod  <══ RTP L16/16000, pod to pod ══>  NODE
```

The node has four edges and all of them are generic: SIP to whatever proxy and registrars its
configuration names; WebRTC to browsers; Roomr for one controller; and, per call, a control
stream to the session endpoint plus RTP straight to the app pod that answered. NATS carries only
capacity reports and events. In Fonoster the proxy is Routr, the controller is the apiserver and
the session endpoint is the gateway's Kubernetes Service; the node knows none of them by name.

### Inbound call

1. INVITE arrives (from the proxy or directly). The node answers `180 Ringing` (no early media),
   creates a room (or resolves the room header, below) and adds the caller as a SIP participant.
2. The node opens a **new** gRPC connection to the session endpoint and sends `Start`
   (`call_ref`, `INBOUND`, `from`, `to`, every INVITE header as a map, `room_ref`, the node's
   `MediaEndpoint`, labels).
3. The app replies `Answer` (its `MediaEndpoint`) or `Reject` (a SIP status). On `Answer` the
   node sends `200 OK` and RTP flows both ways.
4. If the endpoint is unreachable the node rejects with `503`; if no `Answer`/`Reject` arrives
   within the answer timeout it rejects with `480`.

There is no offer, no claim and no race between app replicas: the Service picks a pod per
connection, and one connection per call spreads calls across pods.

### Outbound call

1. The controller scores nodes from heartbeats and calls `CreateCall(call_ref, to{uri, proxy,
   headers, auth}, from, room_ref?, session?, ring_timeout_s, labels)`.
2. A node at its limit answers `RESOURCE_EXHAUSTED` (draining: `UNAVAILABLE`); the controller tries
   the next node, up to 3, then fails the API call synchronously with a capacity error.
3. The node sends the INVITE through `to.proxy` with `to.headers` untouched, returns `Call{RINGING}`
   and publishes `call.ringing`. Busy, no answer or rejection end here: no room, no stream,
   `call.ended` with the SIP status and a cause.
4. On `200 OK` the node creates the room (or joins `room_ref`), opens the control stream to
   `session` (default: the configured endpoint), sends `Start(OUTBOUND, node MediaEndpoint)`, waits
   for `Ready(app MediaEndpoint)` and publishes `call.answered`.

### The control stream

```protobuf
service Session { rpc Connect(stream NodeMessage) returns (stream AppMessage); }

message MediaEndpoint { string ip = 1; uint32 port = 2; string codec = 3; /* L16/16000 */ string srtp_key = 4; }

message NodeMessage { oneof msg {
  Start start = 1;        // call_ref, direction, from, to, headers, labels, room_ref, node MediaEndpoint
  Dtmf dtmf = 2;          // digit, source
  Event event = 3;        // participant joined/left, operation done, transfer result, ended (cause, sip_status)
} }

message AppMessage { oneof msg {
  Answer answer = 1;      // inbound: app MediaEndpoint, optional max_duration_s
  Ready ready = 2;        // outbound: app MediaEndpoint
  Reject reject = 3;      // inbound: SIP status
  Play play = 4;  Stop stop = 5;
  Transfer transfer = 6;  TransferComplete transfer_complete = 7;
  Hold hold = 8;  Resume resume = 9;
  SendDtmf send_dtmf = 10;
  AttachListener attach_listener = 11;  DetachListener detach_listener = 12;
  Record record = 13;
  Hangup hangup = 14;
} }
```

Rules: `Start` is the first message; one connection per call; gRPC keepalive every 10 s and the
stream is considered dead after 2 missed pings, at which point the node hangs the call up with
cause `app_gone` and never reconnects (agreed); TLS or mTLS on the connection is configuration;
commands on one stream are ordered, so no command ids are needed on this path. The document's
sketch of `AppMessage` lists only `Answer`, `Ready`, `Reject`, `Play`, `Stop`, `Transfer` and
`Hangup`; `Hold`/`Resume`, `TransferComplete`, `SendDtmf`, listeners and `Record` are carried over
from the current `media-control` requirements because the gateway uses them today (hold while
transferring, recording and AMD listeners). This is an addition to the sketch, not a change to
any agreed decision.

### Roomr

```protobuf
package roomr.v1;
service Roomr {
  rpc CreateCall(CreateCallRequest) returns (Call);   // dial out; room created or room_ref joined
  rpc EndCall(EndCallRequest) returns (Empty);        // any call, inbound or outbound
  rpc CreateRoom(CreateRoomRequest) returns (Room);   // rooms that do not start from a call
  rpc EndRoom(EndRoomRequest) returns (Empty);
  rpc Join(JoinRequest) returns (Participant);        // RTP endpoint or WebRTC offer (answer returned)
  rpc Leave(LeaveRequest) returns (Empty);
  rpc Play(PlayRequest) returns (Operation);
  rpc Record(RecordRequest) returns (Operation);
  rpc SendDtmf(SendDtmfRequest) returns (Empty);
}
message SipTarget { string uri = 1; string proxy = 2; map<string,string> headers = 3; SipAuth auth = 4; }
message CreateCallRequest { string call_ref = 1; SipTarget to = 2; string from = 3; string room_ref = 4;
  string session = 5; uint32 ring_timeout_s = 6; map<string,string> labels = 7; uint32 max_duration_s = 8; }
message JoinRequest { string room_ref = 1; oneof endpoint { RtpEndpoint rtp = 2; WebRtcOffer webrtc = 3; }
  Listen listen = 4; /* optional: listen-only, per-track RTP destinations */ }
message Call { string call_ref = 1; string room_ref = 2; enum State { RINGING = 0; ANSWERED = 1; ENDED = 2; } State state = 3; }
```

A `Call` is a SIP leg with a lifecycle; a `Participant` is anything in a room (a call, an RTP
stream, a WebRTC peer, a listener). Every call belongs to a room. There is no `AnswerCall`:
inbound calls are answered by the app on its stream, so the controller cannot race the app.
Typed errors: gRPC status codes (`RESOURCE_EXHAUSTED`, `UNAVAILABLE`, `NOT_FOUND`,
`ALREADY_EXISTS`, `INVALID_ARGUMENT`) plus a `cause` on endings say whether a retry helps.

### Events and capacity on NATS

Heartbeat every 2 s on `roomr.nodes.<node_ref>.heartbeat`: `node_ref`, `control_addr`,
`sip_addr`, `rtp_ports`, `rooms`, `participants`, `max_rooms`, `cpu_idle` (0–1), `codecs`,
`draining`, `version`, `region`. `node.down` on clean exit. Events on
`roomr.events.<call_ref>` (call-scoped) and `roomr.events.room.<room_ref>` (room-scoped):
`call.started`, `call.ringing`, `call.answered`, `call.ended` (SIP status + cause),
`participant.joined`, `participant.left`, `operation.done`, `room.ended`; `registration.state`
on the node subject. Each event carries `node_ref`, a per-call monotonic `seq` and the call's
`labels`, so any controller replica can follow a call it did not place.

Selection (controller side): eligible = heartbeat younger than 6 s, not draining,
`rooms < max_rooms`, in the call's region; score = `1 - rooms / max_rooms`, highest wins; two
replicas may pick the same node, the node refuses at its limit and the controller moves on, up to
3 nodes. No shared counter.

### Room header and token

```yaml
sip:
  roomHeader:
    name: X-Room-Ref            # any header name
    onMissingRoom: create       # create (default) | reject (404)
    auth:                       # optional
      type: jwt                 # jwt | none
      header: X-Room-Token
      publicKey: secret://file/etc/media/room-jwt.pub
      audience: media
```

Room exists on this node: the caller joins it and `Start` names the room. Room missing: create it
with that ref (default) or `404`. Bad, expired or missing token when auth is on: `403`. The node
never redirects; getting a call to the node that already holds the room is the job of whatever
sits in front of it (in Fonoster, Routr's session affinity; seeding that affinity is out of scope
now). Whoever issues tokens (in Fonoster, the apiserver) holds the private key; the node only
verifies signature, expiry, audience and that the `room_ref` claim matches the header.

### Ports

| Leg | Ports | Coordination |
| --- | --- | --- |
| Node to app (RTP) | each pod's own range on its pod IP, exchanged on the control stream | none |
| Trunks and SIP phones (RTP) | configured public range on the advertised address | one node per host, or non-overlapping ranges, or an SBC in front |
| Browsers (WebRTC) | one UDP port per node; calls told apart by ICE username | one public port per node |

Today the Compose bundle publishes 11000–11999/udp for the node and 10000–10999/udp for
RTPEngine; the Helm chart runs the node as a StatefulSet with host networking on 30000–30199 and
has no NetworkPolicy. The chart needs a NetworkPolicy that allows node-to-gateway RTP and a
Service for the gateway's control stream.

### Media model and codecs

Mixer, not SFU: phone legs carry one stream and the voice AI wants one clean stream per call.
Mix-minus for everyone; the app leg also gets the caller's own audio for speech-to-text through
the mix-minus (the app hears everyone but itself). Passthrough: a room with exactly two
participants on the same codec forwards packets without decoding; a third participant switches it
to mixing. Internal format 16 kHz linear (agreed: not 48 kHz for now); node-to-app RTP stays
L16/16000. SIP offer order `opus/48000/2`, `G722/8000`, `PCMU/8000`, `PCMA/8000`; WebRTC Opus then
PCMU. Opus needs libopus (cgo) in the image; it costs about 2.7x G.711 per call (laptop figure).

### Scalability

Verdict from the document: no worse than today. The audio path is unchanged; the new load is one
control connection per call and a few messages a minute. Two measurements settle it and are
tasks: (1) a burst of 50 new calls a second across 10 app pods, measuring stream setup time and
how evenly the Service spreads them; (2) one app pod at 500 and 1,000 calls with the new control
path, confirming CPU and RTP jitter match today's numbers.

## Alternatives rejected

- **SFU**: forwards each stream separately, so every phone leg would still need a mixer; pays off
  only for large WebRTC and video rooms, which this product does not run.
- **Audio over the gRPC stream**: simpler networking, but TCP stalls on loss and a Node.js app
  would parse about 100,000 messages a second per 1,000 calls.
- **302 redirects to the node that holds the room**: needs the proxy to follow 3xx and puts
  routing logic in the node; the node stays a leaf and the proxy's affinity does the job.
- **A single `AddParticipant` that dials when given a SIP URI**: hides the call's lifecycle
  (ringing, busy, timeout) behind a join, gives inbound calls no matching verb, and makes room
  creation a side effect of joining.
- **`AnswerCall` on Roomr**: would let the controller and the app race to answer; the app
  on its stream is the only one who can answer or reject.
- **Reconnecting a call to another app pod when its pod dies**: left open in the document's
  scalability table, decided as "hang up" (simpler, and the app's state is gone anyway).
- **NATS offer and claim for inbound calls** (today): a 500 ms race on every call and a queue
  group the node has to know about; a Service and one connection per call do the same with no
  node-side knowledge.

## Fonoster mapping

Kept out of the node's own capabilities on purpose:

| Generic in the node | Fonoster |
| --- | --- |
| SIP proxy / registrar | Routr; `sip.registrations[].headers` carries `X-Session-Count: "{sessions}"` for `least-sessions` |
| Controller (Roomr client) | apiserver (`mods/apiserver/src/outbound`) |
| Session endpoint | the gateway's Kubernetes Service; the gateway serves `Session.Connect` |
| Pass-through headers (inbound `Start.headers`) | `X-App-Ref`, `X-Call-Ref`, `X-Call-Direction`, `X-Connect-Token` read by the gateway |
| Pass-through headers (`CreateCall.to.headers`) | `X-DOD-Number` and whatever Routr routes on |
| Token issuer for room joins | apiserver (Identity's private key) |
| Room header | proposed `X-Room-Ref`, token in `X-Room-Token` |
| Browser path | SIP.js over WSS through Routr's EdgePort, or (proposed, not specified here) `POST /v1/rooms/{room}/webrtc` on the API calling `Join` |

## Risks / Trade-offs

- The control stream is new code on the critical path of every call; it runs beside the NATS
  offer behind a flag until the two measurements pass.
- UDP must be allowed pod to pod; a default-deny NetworkPolicy breaks audio silently. The chart
  ships the rule.
- A half-open stream would hold a call; keepalive plus the RTP media timeout bound it.
- Private regions: control or RTP crossing a WAN to a central app is slow; the session endpoint
  is per region and the app runs in the cell.
- Two open changes touch control-plane "Call creation picks the least-loaded media node"; both
  carry the "node at its limit skipped" scenario so archive order does not matter.

## Open Questions

- The exact `Listen` shape on `Join` (per-track RTP destinations) versus a separate RPC; the
  document does not cover listeners. Carried over as a `Join` option here.
- Whether `Record` writes to object storage directly or to a URL the controller signs; the
  document only says the node exposes `Record` as an operation.
- The `POST /v1/rooms/{room}/webrtc` API endpoint is marked proposed in the document; it is a task
  here but not a requirement of any capability yet.
