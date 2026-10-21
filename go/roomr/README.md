# Roomr node (Go)

The Roomr node replaces Asterisk: SIP legs become **rooms** that mix audio for their
participants (mix-minus, 16 kHz linear). A controller (in Fonoster, the apiserver) drives it over
the `roomr.v1.Roomr` gRPC service; each call's app (in Fonoster, AppBridge behind a Kubernetes
Service) drives that call over its own control stream (`session.v1.Session.Connect`), with the
audio as RTP between the node and the app. NATS carries only heartbeats and events. The node
knows no other component by name: proxy, registrars, session endpoint and header names come from
its configuration or from requests. Spec: `openspec/changes/redesign-roomr`.

## Run

```sh
cd go/roomr
go build ./cmd/...
./roomr -config roomr.yaml
```

`-config` is the node's only flag (default `/config/roomr.yaml` when it exists); every setting is
a key in that file (see `ops/bundle/config/roomr.example.yaml` and design.md's "Minimal
roomr.yaml"). Unknown keys and any other flag stop the node. The node reads no `ROOMR_*`
variables: reference one in the file as `${VAR}` (or `${VAR:-default}`), or as `secret://env/NAME`
for passwords and TLS PEM settings.

| Key | Default | |
| --- | --- | --- |
| `nodeId`, `region` | hostname, none | `node_ref` and `region` in heartbeats and events |
| `nats.{url,user,password}` | `nats://127.0.0.1:4222` | core NATS, best effort (below) |
| `sip.{listen,advertise}` | `0.0.0.0:5060`, `127.0.0.1` | `advertise` may carry a port |
| `sip.outboundProxy` | none | default proxy when `CreateCall`'s `to.proxy` is empty; the transport lives in the URI (`sip:routr:5060;transport=tcp`) |
| `sip.callRefHeader` | none | e.g. `X-Call-Ref`: one call ref end to end |
| `sip.roomHeader` | none | e.g. `X-Room-Ref`: an INVITE joins that room, or creates it |
| `sip.registrations` | none (no REGISTER) | see Registrations |
| `tls.{listen,cert,key,ca}` | off | optional SIP over TLS, and TLS to the proxy and registrars |
| `rtp.{host,advertise,portMin,portMax}` | `0.0.0.0`, `127.0.0.1`, any port | one range for every leg, SIP and app |
| `control.grpc.{listen,advertise}` | `0.0.0.0:50061`, listen port on `sip.advertise` | Roomr and `grpc.health.v1.Health`; `advertise` is the heartbeat's `control_addr` |
| `control.grpc.tls.{cert,key,clientCa}` | off | TLS, mutual with `clientCa` |
| `sessionEndpoint` | required | `host:port` of each call's control stream |
| `sessionTls.{ca,cert,key}` | off | TLS on the control streams; `cert`/`key` for mutual TLS |
| `maxRooms`, `maxParticipants` | 200, 10 | `CreateRoom` can override `maxParticipants` |
| `maxDuration` | 4h | `CreateCall` and `Answer` can lower it per call |
| `mediaTimeout` | 15s | caller leg silent: `media_timeout`; app leg silent: `app_gone` |
| `answerTimeout`, `readyTimeout` | 10s, 10s | no `Answer` (inbound: 480) / no `Ready` (outbound: BYE, `app_gone`) |
| `emptyRoomTimeout` | 30s (negative: never) | `CreateRoom` can override it |
| `drainWait`, `heartbeatInterval`, `reregisterDelta` | 1h, 2s, 5 | |
| `codecs` | opus, G722, PCMU, PCMA | SIP offer order |
| `telemetry.otlpEndpoint` | off | OTLP metrics and traces only; logs go to stderr |

A `CreateCall` `call_ref` is remembered for 10 minutes after the call ends (a constant). The node
writes nothing to the session registry, has no room token, no source filtering, no debug HTTP
server and no URL screening: network isolation is the boundary (its SIP port reachable only from
the proxy, its control port only from the controller), and tenant hold-music URLs are checked
upstream.

Roomr is the SIP and media edge, not an app server: it does not play prompts, record or send DTMF
on a controller's behalf. An app plays its own audio on its RTP leg, records by adding a listener,
and sends DTMF on its call's control stream. The one audio the node fetches itself is hold music
(`Hold{music}`, warm-transfer `music`), because only the node can play to the caller alone.

## Calls and the control stream

**Inbound.** An INVITE gets `180 Ringing` at once (no early media); the caller joins a room (the
`sip.roomHeader` room, joined or created, else a new one with a 128-bit random ref). The node
opens a **new** gRPC connection to `sessionEndpoint` and sends `Start` (`call_ref`, `INBOUND`,
`from`, `to`, every INVITE header untouched, `room_ref`, the node's `media` endpoint, `node_ref`).
`Answer` (the app's `media`, optional `max_duration_s`) gives `200 OK`; `Reject` gives its SIP
status; an unreachable endpoint gives `503`, no answer within `answerTimeout` `480`; a `CANCEL`
gives `487` and `Ended caller_hangup`.

**Outbound.** `CreateCall` sends the INVITE (through `to.proxy`, else `sip.outboundProxy`, with
`to.headers` byte for byte and `to.auth` for a 401/407) and returns `Call{RINGING}` with the
room ref it will use. Busy, no answer or a rejection end the call (`call.ended` with `sip_status`
and `cause`) with no room and no stream: the room is created, or `room_ref` joined, only on
`200 OK`; until then a place is held toward `maxRooms`. Then the stream opens to `session` (else
`sessionEndpoint`), `Start` goes out with `OUTBOUND` and the `metadata`, and the app's `Ready`
(its `media`) completes the call (`call.answered`).

**The stream.** `Start` first; then `Dtmf` and `Event` (`ParticipantJoined`/`Left`,
`TransferResult`, `Ended` with `cause` and `sip_status`) from the node, and `Transfer` (cold,
warm, refer), `TransferComplete`, `Hold` (optional looped hold music)/`Resume`, `SendDtmf` (RFC
4733 on the caller's leg), `AddListener`/`RemoveListener` and `Hangup` from the app, handled in
order. Keepalive
pings every 10 s (the server must allow them); a stream that breaks or misses two pings hangs the
call up with `app_gone` and is never reconnected. After `Ended` the node half-closes the stream.
Audio never travels on it: the app leg is RTP L16/16000 (payload type 96, 20 ms) between the two
`MediaEndpoint`s. `Start.media.srtp_key` is always set; an app that answers with its own
`srtp_key` gets SRTP, one that leaves it empty gets plain RTP.

## Events and heartbeats on NATS

Core NATS only, best effort: the node starts and keeps calls, RPCs and streams running while NATS
is down, buffers nothing and drops events it cannot publish (no replay).

- `roomr.nodes.<node_ref>.heartbeat`: `node.heartbeat` every `heartbeatInterval` (`rooms`,
  `participants`, `max_rooms`, `codecs`, `version`, `region`, `control_addr`, `sip_addr`,
  `rtp_ports`), and `node.down` when draining starts.
- `roomr.nodes.<node_ref>.events`: `registration.state`.
- `roomr.events.<call_ref>`: `call.started`, `call.ringing`, `call.answered`, `call.ended`
  (`cause`, `sip_status`, `answered`), `participant.joined`/`left` for the call's legs (`kind`
  `phone` or `app`). Each carries
  `node_ref`, a per-call `seq` from 1, the call's `metadata` and `ts`.
- `roomr.events.room.<room_ref>`: `room.ended` (`cause`) and participant events of RTP
  participants, with a per-room `seq`.

## Draining

The node refuses nothing while a rollout drains it; it stops being chosen. It serves
`grpc.health.v1.Health` on the control port: SERVING normally. On SIGTERM it

1. turns the health status NOT_SERVING (the readiness probe fails),
2. unregisters every registration (REGISTER with Expires 0),
3. stops its heartbeat and publishes `node.down` on `roomr.nodes.<node_ref>.heartbeat`,
4. keeps live rooms, their streams and RPCs until they end or `drainWait` passes (then ends them
   with `node_error`, sent as `Ended` on each stream),
5. exits. A second signal stops waiting.

Only `maxRooms` refuses calls (INVITE `503`, `CreateCall` `RESOURCE_EXHAUSTED`); CPU and memory
never do. Set `terminationGracePeriodSeconds` above `drainWait` and a PodDisruptionBudget. The
`Roomr` server sets no `MaxConnectionAge`, so a controller's connection is never cut mid-call.

## Ports and network isolation

| Port | | Reachable from |
| --- | --- | --- |
| `sip.listen` (5060 UDP/TCP; `tls.listen` 5061) | SIP | the SIP proxy only |
| `control.grpc.listen` (50061 TCP) | `Roomr` and `grpc.health.v1.Health` | the controller only (and the kubelet's probe) |
| `rtp.portMin`-`rtp.portMax` (UDP) | every RTP leg, SIP and app | media sources; the only range to publish |

The node authenticates neither RPCs nor SIP sources, so the network does: the Helm chart
(`ops/rebuild/helm/fonoster-rebuild`) renders a NetworkPolicy when the node runs on the pod network
and documents a host firewall for `hostNetwork` (docs/operators/rebuild.md, "Network
isolation"); Compose publishes only the RTP range. Nothing coordinates RTP ports between nodes:
run one node per host, or give nodes that share a host non-overlapping ranges.

## Registrations

The node registers only where its configuration says (Roomr, `redesign-roomr`
"Registration is optional and configured"); with no `sip.registrations` it sends no REGISTER and
still takes INVITEs. Each entry:

```yaml
sip:
  registrations:
    - registrar: routr:5060            # host:port or a SIP URI; ;transport=tcp|tls picks the transport (default udp)
      aor: sip:roomr@default       # From/To and the Contact user (default sip:roomr@<registrar host>)
      expires: 30s                     # a duration or whole seconds; re-registers at half of it (default 30s)
      auth:                            # optional: answers a 401/407 digest challenge
        username: roomr
        password: secret://env/ROOMR_PASSWORD   # or "${VAR}"
      headers:                         # templates; {sessions} = active rooms
        X-Session-Count: "{sessions}"
```

- Every registration re-registers at once when the room count moves by `reregisterDelta`
  (default 5) or drops to 0. On SIGTERM it sends Expires 0. A challenge without `auth` fails the registration.
- `headers` follow the pass-through rule: SIP tokens, one line, and none of the headers the node
  sets itself (Via, From, To, Call-ID, CSeq, Contact, Max-Forwards, Route, Record-Route,
  Authorization, Proxy-Authorization, Expires, `Content-*` and compact forms). The same rule
  applies to `CreateCall`'s `to.headers`.
- `registration.state` (`registered`, `failed`, `expired`, `unregistered`) is published on
  `roomr.nodes.<node_ref>.events` when a registration's state (or a failure's SIP status) changes.
  A failed REGISTER is retried after 1 s, doubling up to the refresh interval.
- Routr is one deployment of this: the bundle registers the roomr Peer with
  `X-Session-Count: "{sessions}"` for Routr's `LEAST_SESSIONS`. A dial whose `from` names no
  host goes out with the first registration's AOR host in From.
- Unknown keys fail at start, so a file with the old `registration:` block or any removed key
  (`trustedSources`, `sessionRegistry`, `requireEncryption`, `debugAddr`, `outboundTransport`,
  `callDedupeWindow`, `allowedDestinations`, `ownerTimeout`, `onMissingRoom`, `tls.clientCa`, a
  top-level `outboundProxy`) is refused loudly.

## Codecs

SIP legs use `opus/48000/2`, `G722/8000`, `PCMU/8000` and `PCMA/8000`, in that order of
preference (Roomr, `redesign-roomr` "Supported codecs"):

- **Outbound INVITEs** (`CreateCall` and transfers) offer them in that order,
  Opus as dynamic payload type 111 with
  `a=fmtp:111 maxplaybackrate=16000;sprop-maxcapturerate=16000;useinbandfec=1` (RFC 7587); the
  callee's pick wins.
- **Inbound offers** are answered with the node's first choice among what the caller offered, so a
  caller offering PCMU and Opus (in any order) gets Opus; a G.711-only trunk gets PCMU (or PCMA if
  that is all it offers). No common codec: `488 Not Acceptable Here`.
- The room mixes at 16 kHz. Opus runs at 16 kHz inside libopus (wideband, mono, 24 kb/s, in-band
  FEC, complexity 5) on its 48 kHz RTP clock (960 ticks per 20 ms); a peer encoding at 48 kHz is
  decoded to 16 kHz by libopus, and peers hear wideband audio, not full-band.
- The list is configurable: `codecs: [G722, PCMU, PCMA]` in `roomr.yaml`. Leaving Opus out disables it. Unknown names fail at start-up.

Opus is cgo (libopus). The image (`Dockerfile`) builds libopus 1.5.2 from source (checksum
pinned, without the 1.5 neural extras: deep PLC, DRED and OSCE) and links it and libc statically
(`-tags netgo,osusergo`), so the binaries still run on `distroless/static`; the Go build is
cross-compiled for linux/amd64 and linux/arm64 on the build platform, not under QEMU. That costs
about 2-2.6 MB of image (amd64 28.0 to 30.6 MB, arm64 26.4 to 28.4 MB). Built with
`CGO_ENABLED=0` (or `-tags noopus`) the node has no Opus and offers G.722, PCMU, PCMA; the start-up
log line `sip codecs` says which (`"opus": true`). Locally, install libopus (`apt install
libopus-dev`, `brew install opus`).

Opus costs roughly 2.2x PCMU per call: 50 rooms (one SIP leg plus one L16 app leg each) took about 55-61% of a core with Opus, 25-29% with PCMU and 30-34% with G.722, measured
with `cmd/loadgen` on an arm64 dev container (Apple silicon, shared and busy; not production
hardware). Size SIP capacity for the Opus share you expect.

## The Roomr gRPC service (`roomr.v1.Roomr`)

`api/roomr/v1/roomr.proto`: `CreateCall`, `EndCall`, `CreateRoom`, `EndRoom`, `AddParticipant`
and `RemoveParticipant`, on `control.grpc.listen`.

| RPC | |
| --- | --- |
| `CreateCall` | see Calls; `call_ref` idempotent for 10 minutes (same params: the existing `Call`, no INVITE; other params: `ALREADY_EXISTS`); `sip.callRefHeader` in `to.headers` is the `call_ref` (both set and different: `INVALID_ARGUMENT`); a CR or LF in a header value or a header the node sets: `INVALID_ARGUMENT`; `ring_timeout_s` (60 s), `max_duration_s`, `session`, `metadata` |
| `EndCall` | CANCEL while ringing, BYE once answered, 480 to an unanswered inbound caller; cause `removed` |
| `CreateRoom` / `EndRoom` | optional ref (`ALREADY_EXISTS` when taken), `max_duration_s`, `empty_room_timeout_s`, `max_participants` / ends every call (`removed`) and participant |
| `AddParticipant` / `RemoveParticipant` | RTP participants and listen-only participants (`listen`); WebRTC: `UNIMPLEMENTED` |

Errors are gRPC codes with a `google.rpc.ErrorInfo` reason (domain `roomr.fonoster.com`):
`RESOURCE_EXHAUSTED` (`at_capacity`, `room_full`), `NOT_FOUND` (`room_not_found`,
`call_not_found`, `participant_not_found`), `ALREADY_EXISTS` (`room_exists`, `call_exists`),
`INVALID_ARGUMENT` (`bad_message`, `unsupported_codec`), `UNIMPLEMENTED` (`not_supported`). Regenerate the Go code with `api/generate.sh`.

## Test

- `go test ./...`: unit tests, plus end-to-end tests in `e2e/` when `CONFORMANCE_NATS_URL` is
  set: the rig runs a node with a fake session endpoint (answer, reject, stall, kill), a caller
  bot, a callee bot and a Roomr client.
- `cmd/loadgen`: the load harness; it serves the session endpoint itself (`-session`, the node's
  `sessionEndpoint`) and reads the node's heartbeat.
