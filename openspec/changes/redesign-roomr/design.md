## Context

Source: the design document "Roomr node: Target Design" (2026-10-17,
https://claude.ai/code/artifact/2e54576e-d7d4-42af-ae84-5c249b6eb88c) and the decisions agreed
with the owner that day. Where the document still shows an open alternative, the agreed decision
is recorded here and the alternative is listed under "Alternatives rejected".

What exists today (`go/roomr`, `mods/apiserver/src/outbound`, `mods/appbridge`): the node
registers to Routr with `X-Session-Count`, reads `X-App-Ref`/`X-Call-Ref`/`X-Call-Direction` from
the INVITE, offers each call on `appbridge.incoming` and waits 500 ms (twice) for a claim, serves
commands on `media.<nodeId>.commands`, publishes events on `media.<nodeId>.events.<roomRef>` and a
heartbeat every 2 s. AppBridge's `RtpLink` already exchanges L16/16000 RTP with the node, with
ports negotiated inside `participant.add`. The apiserver's `createNodeDirectory` picks the
least-loaded non-draining node from heartbeats and `placeOutboundCall` sends `room.create`,
`appbridge.outbound` and `participant.dial` with `X-DOD-Number`. Most of the audio path survives
unchanged; what changes is signaling, control and configuration.

Product name: **Roomr** (see proposal.md, "Naming"). This document says "the node".

## Goals / Non-Goals

Goals: a node that can be run and tested with nothing but a SIP peer, a gRPC session endpoint and
NATS; no race on the inbound path; one ordered control channel per call; capacity-aware placement
with the node as the final judge; rooms reachable by header for human join-in; Opus-first wideband
audio. Roomr is internal-only and as light as possible: network isolation is the security
boundary, so the design adds no token, no mTLS requirement, no registry writes and no debug
server.

Non-goals (agreed): video, rooms spanning nodes, 48 kHz mixing, seeding the proxy's session
affinity for room-header joins, migrating live calls off a dead node, reconnecting a call to
another app pod. Also not in the node: speech recognition, synthesis and turn detection (they stay
above it, in AppBridge), and SIP capture. Deferred to follow-up changes: WebRTC participants
(browsers terminating on the node) and the two-party passthrough mode; browser calls keep
RTPEngine meanwhile.

## Architecture

```
                 SIP (UDP/TCP/TLS)               Roomr (gRPC)
  SIP proxy / registrar  <────────────>  NODE  <─────────────────  Controller
  (optional, configured)                  │ │                        (in Fonoster: apiserver)
                                          │ │  NATS: heartbeat + events (never audio, never offers)
                                          │ │
                                            │ per call: gRPC control stream (new connection)
                                            ▼
                                  Session endpoint (K8s Service)
                                            │ routed to one app pod
                                            ▼
                                    App pod  <══ RTP L16/16000, pod to pod ══>  NODE
```

The node has three edges and all of them are generic: SIP to whatever proxy and registrars its
configuration names; Roomr for one controller; and, per call, a control stream to the session
endpoint plus RTP straight to the app pod that answered. NATS carries only
capacity reports and events. In Fonoster the proxy is Routr, the controller is the apiserver and
the session endpoint is AppBridge's Kubernetes Service; the node knows none of them by name.

### Inbound call

1. INVITE arrives (from the proxy or directly). The node answers `180 Ringing` (no early media),
   creates a room (or resolves the room header, below) and adds the caller as a SIP participant.
2. The node opens a **new** gRPC connection to the session endpoint and sends `Start`
   (`call_ref`, `INBOUND`, `from`, `to`, every INVITE header as a map, `room_ref`, the node's
   `MediaEndpoint`, metadata).
3. The app replies `Answer` (its `MediaEndpoint`) or `Reject` (a SIP status). On `Answer` the
   node sends `200 OK` and RTP flows both ways.
4. If the endpoint is unreachable the node rejects with `503`; if no `Answer`/`Reject` arrives
   within the answer timeout it rejects with `480`.

There is no offer, no claim and no race between app replicas: the Service picks a pod per
connection, and one connection per call spreads calls across pods.

### Outbound call

1. The controller scores nodes from heartbeats and calls `CreateCall(call_ref, to{uri, proxy,
   headers, auth}, from, room_ref?, session?, ring_timeout_s, metadata)`. The caller dictates the
   app reference through `metadata` (for example `app_ref`) and the call ref through the call-ref
   header or `call_ref`.
2. A node at its limit answers `RESOURCE_EXHAUSTED`; the controller tries the next node, up to 3,
   then fails the API call synchronously with a capacity error.
3. The node sends the INVITE through `to.proxy` (its URI carries the transport, for example
   `sip:host:port;transport=tcp`) with `to.headers` untouched, returns `Call{RINGING}`
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
  Start start = 1;        // call_ref, direction, from, to, headers, metadata, room_ref, node MediaEndpoint
  Dtmf dtmf = 2;          // digit, source
  Event event = 3;        // participant joined/left, transfer result, ended (cause, sip_status)
} }

message AppMessage { oneof msg {
  Answer answer = 1;      // inbound: app MediaEndpoint, optional max_duration_s
  Ready ready = 2;        // outbound: app MediaEndpoint
  Reject reject = 3;      // inbound: SIP status
  // 4, 5, 13 reserved (were Play, Stop, Record)
  Transfer transfer = 6;  TransferComplete transfer_complete = 7;
  Hold hold = 8;  Resume resume = 9;   // Hold{music}: the node loops hold audio to the caller alone
  SendDtmf send_dtmf = 10;             // RFC 4733 on the caller's leg
  AddListener add_listener = 11;  RemoveListener remove_listener = 12;
  Hangup hangup = 14;
} }
```

Rules: `Start` is the first message; one connection per call; gRPC keepalive every 10 s and the
stream is considered dead after 2 missed pings, at which point the node hangs the call up with
cause `app_gone` and never reconnects (agreed); TLS or mTLS on the connection is configuration;
commands on one stream are ordered, so no command ids are needed on this path. The document's
sketch of `AppMessage` lists `Answer`, `Ready`, `Reject`, `Play`, `Stop`, `Transfer` and `Hangup`;
`Hold`/`Resume`, `TransferComplete`, `SendDtmf` and listeners are carried over from the current
`media-control` requirements because AppBridge uses them today (hold while transferring, recording
and AMD listeners). `Play`, `Stop` and `Record` are dropped (see Decisions): the app plays its own
audio on its RTP leg and records through a listener. What stays on the stream is what only the
node can do, because it needs the caller's leg or the mixer: DTMF to the caller, hold (the caller
cut off from the app, with hold music the node fetches and loops), transfers and listeners.

### Roomr

```protobuf
package roomr.v1;
service Roomr {
  rpc CreateCall(CreateCallRequest) returns (Call);   // dial out; room created or room_ref joined
  rpc EndCall(EndCallRequest) returns (Empty);        // any call, inbound or outbound
  rpc CreateRoom(CreateRoomRequest) returns (Room);   // rooms that do not start from a call
  rpc EndRoom(EndRoomRequest) returns (Empty);
  rpc AddParticipant(AddParticipantRequest) returns (Participant);  // RTP endpoint or listen-only (WebRTC offers are deferred)
  rpc RemoveParticipant(RemoveParticipantRequest) returns (Empty);
}
message SipTarget { string uri = 1; string proxy = 2; map<string,string> headers = 3; SipAuth auth = 4; }
message CreateCallRequest { string call_ref = 1; SipTarget to = 2; string from = 3; string room_ref = 4;
  string session = 5; uint32 ring_timeout_s = 6; map<string,string> metadata = 7; uint32 max_duration_s = 8; }
message CreateRoomRequest { string room_ref = 1; uint32 empty_room_timeout_s = 2; uint32 max_participants = 3; }
message AddParticipantRequest { string room_ref = 1; RtpEndpoint rtp = 2;
  Listen listen = 4; /* optional: listen-only, per-track RTP destinations */ }
message Call { string call_ref = 1; string room_ref = 2; enum State { RINGING = 0; ANSWERED = 1; ENDED = 2; } State state = 3; }
```

A `Call` is a SIP leg with a lifecycle; a `Participant` is anything in a room (a call, an RTP
stream, a listener). Every call belongs to a room. RPCs are named from the caller's side
(`AddParticipant`, `RemoveParticipant`); the events stay `participant.joined` and
`participant.left`. Roomr is the SIP and media edge, not an app server: there are no `Play`,
`Record`, `Stop` or `SendDtmf` RPCs and no operations. There is no `AnswerCall`:
inbound calls are answered by the app on its stream, so the controller cannot race the app.
Typed errors: gRPC status codes (`RESOURCE_EXHAUSTED`, `UNAVAILABLE`, `NOT_FOUND`,
`ALREADY_EXISTS`, `INVALID_ARGUMENT`) plus a `cause` on endings say whether a retry helps.

### Events and capacity on NATS

Heartbeat every `heartbeatInterval` (2 s) on `roomr.nodes.<node_ref>.heartbeat`: `node_ref`,
`control_addr`, `sip_addr`, `rtp_ports`, `rooms`, `participants`, `max_rooms`, `codecs`,
`version`, `region`. `node.down` (same subject, `type: "node.down"`) when draining starts. Roomr
uses core NATS only: it writes nothing to the session registry (the apiserver keeps its own
`placements.<callRef>` entries and learns nodes from heartbeats). Events on
`roomr.events.<call_ref>` (call-scoped) and `roomr.events.room.<room_ref>` (room-scoped):
`call.started`, `call.ringing`, `call.answered`, `call.ended` (SIP status + cause),
`participant.joined`, `participant.left`, `room.ended`; `registration.state`
on the node subject. Each event carries `node_ref`, a per-call monotonic `seq` and the call's
`metadata` (opaque to the node, passed through untouched), so any controller replica can follow a
call it did not place.

Selection (controller side): eligible = heartbeat younger than 6 s,
`rooms < max_rooms`, in the call's region; score = `1 - rooms / max_rooms`, highest wins; two
replicas may pick the same node, the node refuses at its limit and the controller moves on, up to
3 nodes. No shared counter.

### Room header

```yaml
sip:
  roomHeader: X-Room-Ref        # any header name
```

Room exists on this node: the caller joins it and `Start` names the room. Room missing: the node
creates it with that ref. There is no token and no `onMissingRoom`: a room header always means
join-or-create, and room refs the node generates carry 128 random bits so they are not guessable.
The node never redirects; getting a call to the node that already holds the room is the job of
whatever sits in front of it (in Fonoster, Routr's session affinity; seeding that affinity is out
of scope now).

### Draining

Roomr serves `grpc.health.v1.Health` on the control port: `SERVING` normally. On SIGTERM it sets
`NOT_SERVING`, sends REGISTER with `Expires: 0`, stops heartbeating and publishes `node.down` on
`roomr.nodes.<node_ref>.heartbeat`. It keeps live rooms, their streams and RPCs until they end or
`drainWait` (default 1 h), ends what remains with `node_error` and exits. It does not refuse calls
while draining and has no `draining` field; the `max_rooms` refusal stays. The layers that place
calls stop sending: the apiserver skips nodes without fresh heartbeats, Routr stops after
`Expires: 0`, and the Kubernetes readiness probe is the gRPC health check. Helm sets a long
`terminationGracePeriodSeconds` and a PodDisruptionBudget; no gRPC `MaxConnectionAge`. The load
generator reads heartbeats instead of a debug endpoint.

### Network isolation

Roomr does not authenticate `Roomr` RPCs or check the source of SIP requests. Its control port is
reachable only from the apiserver and its SIP port only from the trusted SIP proxy: a NetworkPolicy
when Roomr runs on the pod network, a documented host firewall when `hostNetwork` is true (the
Helm default stays `hostNetwork`; revisiting it is the owner's call). Compose publishes only the
RTP range. `to.auth` secrets are never logged or echoed. SIP over TLS, SDES-SRTP and gRPC TLS are
available and off by default. Tenant hold-music URLs (`Hold`, warm-transfer `music`) are
validated upstream by the apiserver and AppBridge, so the node fetches them as given.

### Ports

| Leg | Ports | Coordination |
| --- | --- | --- |
| App legs and SIP legs (RTP) | one configured range on `rtp.host`, announced on the control stream; `rtp.advertise` for legs that leave the cluster | none inside the cluster; one node per host, or non-overlapping ranges, or an SBC in front, outside |

Today the Compose bundle publishes 11000–11999/udp for the node and 10000–10999/udp for
RTPEngine; the Helm chart runs the node as a StatefulSet with host networking on 30000–30199 and
has no NetworkPolicy. The chart needs a NetworkPolicy that allows node-to-appbridge RTP and a
Service for AppBridge's control stream. Compose keeps publishing only the RTP range.

### Media model and codecs

Mixer, not SFU: phone legs carry one stream and the voice AI wants one clean stream per call.
Mix-minus for everyone; the app leg also gets the caller's own audio for speech-to-text through
the mix-minus (the app hears everyone but itself). Internal format 16 kHz linear (agreed: not
48 kHz for now); node-to-app RTP stays L16/16000. SIP offer order `opus/48000/2`, `G722/8000`,
`PCMU/8000`, `PCMA/8000`. Opus needs libopus (cgo) in the image; it costs about 2.7x G.711 per call (laptop figure).

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
| Session endpoint | AppBridge's Kubernetes Service; AppBridge serves `Session.Connect` |
| Pass-through headers (inbound `Start.headers`) | `X-App-Ref`, `X-Call-Ref`, `X-Call-Direction`, `X-Connect-Token` read by AppBridge |
| Pass-through headers (`CreateCall.to.headers`) | `X-DOD-Number` and whatever Routr routes on |
| App reference on outbound calls | `CreateCall.metadata`, for example `app_ref` |
| Room header | proposed `X-Room-Ref` |
| Browser path | unchanged: SIP.js over WSS through Routr's EdgePort and RTPEngine (WebRTC on the node is deferred) |

## Risks / Trade-offs

- The control stream is new code on the critical path of every call; it runs beside the NATS
  offer behind a flag until the two measurements pass.
- UDP must be allowed pod to pod; a default-deny NetworkPolicy breaks audio silently. The chart
  ships the rule.
- A half-open stream would hold a call; keepalive plus the RTP media timeout bound it.
- Private regions: control or RTP crossing a WAN to a central app is slow; the session endpoint
  is per region and the app runs in the cell.
- Two open changes touch control-plane "Call creation picks the least-loaded Roomr node"; both
  carry the "node at its limit skipped" scenario so archive order does not matter.

## Decisions

- **Roomr is the SIP and media edge, not an app server** (owner, 2026-10-21). `Play`, `Record`
  and `Stop` are removed from the Roomr service and the control stream, and with them operations
  and `operation.done`; `SendDtmf` is removed from the Roomr service. Recording stays a listener
  (AppBridge adds one and writes the record), which resolves the former open question on where
  `Record` writes. The stream keeps `SendDtmf` (the caller's leg is on the node), `Hold{music}` /
  `Resume` (caller-only audio needs the mixer; the node fetches and loops the hold music),
  `Transfer` / `TransferComplete` and listeners.
- **Names from the caller's side** (owner, 2026-10-21). `Join` / `Leave` become `AddParticipant` /
  `RemoveParticipant`; `AttachListener` / `DetachListener` become `AddListener` /
  `RemoveListener`. Field numbers are kept and removed ones reserved, so the renames are
  wire-compatible. The events keep their names (`participant.joined`, `participant.left`).

## Open Questions

- The exact `Listen` shape on `AddParticipant` (per-track RTP destinations) versus a separate RPC;
  the document does not cover listeners. Carried over as an `AddParticipant` option here.

## Minimal roomr.yaml

The full configuration after the lightness decisions. Roomr takes one flag, `-config <path>`;
everything else is in this file, where `${VAR}` and `secret://` references work. Keys marked
(optional) may be omitted; the others are required. Values shown are the defaults where one exists.

```yaml
nodeId: roomr-0                       # node_ref in heartbeats and events
region: us-east                       # (optional) region reported in the heartbeat
nats:
  url: nats://nats:4222
  user: roomr                         # (optional)
  password: ${NATS_PASSWORD}          # (optional)
sip:
  listen: 0.0.0.0:5060
  advertise: 10.0.0.7:5060            # (optional) address put in Contact/Via when different
  outboundProxy: sip:routr:5060;transport=tcp   # (optional) transport lives in the URI
  callRefHeader: X-Call-Ref           # (optional) one call ref end to end
  roomHeader: X-Room-Ref              # (optional) join-or-create by header
  registrations:                      # (optional) none means no REGISTER
    - registrar: sip:routr:5060
      aor: sip:roomr@default
      auth: { username: roomr, password: ${SIP_PASSWORD} }   # (optional)
      expires: 60
      headers: { X-Session-Count: "{sessions}" }                  # (optional)
tls:                                  # (optional, off by default) SIP over TLS
  listen: 0.0.0.0:5061
  cert: /etc/roomr/tls.crt
  key: /etc/roomr/tls.key
rtp:
  host: 0.0.0.0                       # address the range binds to
  advertise: 203.0.113.10             # (optional) address announced for legs outside the cluster
  portMin: 30000
  portMax: 30199
control:
  grpc:
    listen: 0.0.0.0:50061             # Roomr and grpc.health.v1.Health
    advertise: roomr-0.roomr:50061    # control_addr in the heartbeat
    tls: { cert: ..., key: ..., clientCa: ... }   # (optional, off by default)
sessionEndpoint: appbridge.fonoster:50071   # where the per-call control stream goes
maxRooms: 200
maxParticipants: 10                   # (optional) per room; CreateRoom can override
maxDuration: 4h                       # (optional)
mediaTimeout: 15s                     # (optional) one key for caller and app legs
readyTimeout: 10s                     # (optional) Ready after answer on outbound calls
emptyRoomTimeout: 30s                 # (optional) CreateRoom can override
drainWait: 1h                         # (optional) longest wait after SIGTERM
heartbeatInterval: 2s                 # (optional)
reregisterDelta: 5                    # (optional) room-count change that triggers a REGISTER
codecs: [opus, g722, pcmu, pcma]      # (optional) offer order
telemetry:
  otlpEndpoint: http://otel:4318      # (optional) metrics and traces only; logs go to stderr
```

The dedupe window for `CreateCall` is a constant (10 minutes), not a key.
