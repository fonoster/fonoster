# Fonoster media node (Go)

The media node replaces Asterisk: SIP legs from Routr become **rooms** that mix audio for their
participants (mix-minus), driven by the VoiceSessionGateway over **media-control** on NATS. Specs:
`openspec/changes/archive/2026-10-17-add-media-node` (media-node and media-control), decisions in its `build-log.md`.

## What this version does

| Area | State |
| --- | --- |
| Inbound INVITE, `X-App-Ref` / `X-Call-Ref` / `X-Call-Direction`, `call.incoming` claimed by one gateway (500 ms, one retry, then 503) | done |
| `ring` (180), `answer` (200 + SDP), `hangup` with `sipStatus`, `room.end`, caller BYE / CANCEL | done |
| PCMU on SIP legs, L16/16000 for the gateway's session participant, mix-minus every 20 ms | done |
| RFC 4733 keypresses in and out (`dtmf`, `dtmf.send`) | done |
| `hold` / `resume` by mixing, hold music from a PCM16 WAV URL | done |
| `participant.left` / `room.ended` reasons, media timeout (30 s), maximum duration (4 h) | done |
| `node.heartbeat` every `heartbeatInterval` (2 s); on SIGTERM: health NOT_SERVING, unregister, `node.down`, live rooms finish (see Draining) | done |
| Registrations from configuration (`sip.registrations`, none by default): digest auth, header templates with `{sessions}`, re-registers on load changes, unregisters on SIGTERM, `registration.state` on NATS (see Registrations) | done; Routr's least-sessions (`X-Session-Count`) verified against Routr 2.15.1 (`docs/operators/routr-live-test.md`) |
| `participant.dial` and cold, warm and refer transfers through an outbound proxy (`outboundProxy`, Routr in production) | done |
| `listener.attach` / `listener.detach`: one unmixed RTP stream per selected track | done |
| PCMU, PCMA, G.722 and Opus on SIP legs, offered Opus first (see Codecs) | done |
| SIP INFO and in-band DTMF, SRTP, jitter buffer | done |
| The `roomr.v1.Roomr` gRPC service, next to the NATS commands; off by default | first slice (see below) |

## Run

```sh
cd go/roomr
go build ./cmd/...
./roomr -config roomr.yaml
```

`-config` is the node's only flag (default `/config/roomr.yaml` when it exists); every setting is a
key in that file (see `ops/bundle/config/roomr.example.yaml`). Any other flag stops the node with
a usage error. The node reads no `ROOMR_*` variables: to take a value from the environment,
reference it in the file as a `${VAR}` placeholder (`nodeId: "${POD_NAME}"`), or as a
`secret://env/NAME` reference for the passwords and TLS PEM settings.

| Key | Default | |
| --- | --- | --- |
| `nodeId`, `nats.{url,user,password}` | hostname, `nats://127.0.0.1:4222` | |
| `sip.{listen,advertise,callRefHeader,registrations}` | `0.0.0.0:5060`, `127.0.0.1` | |
| `rtp.{host,advertise,portMin,portMax}` | `0.0.0.0`, `127.0.0.1`, any port | one range serves every leg |
| `outboundProxy` | none (no dial or transfers) | `host:port` or `sip:host:port;transport=tcp` (udp, tcp or tls) |
| `maxRooms`, `maxParticipants` | 200, 10 | `CreateRoom` can override `maxParticipants` per room |
| `emptyRoomTimeout` | 30s (negative: never) | `CreateRoom` can override it per room |
| `mediaTimeout` | 30s | one timeout for the caller and app legs |
| `maxDuration`, `heartbeatInterval`, `reregisterDelta`, `drainWait` | 4h, 2s, 5, 10m | |
| `tls.{listen,cert,key,ca}` | off | optional SIP over TLS, and TLS to the outbound proxy and registrars |
| `control.grpc.{listen,advertise,tls.{cert,key,clientCa}}` | off | Roomr; TLS and mutual TLS optional |
| `codecs`, `region`, `telemetry.otlpEndpoint` | opus, G722, PCMU, PCMA | OTLP traces and metrics only; logs go to stderr |

A call's `call_ref` is remembered for 10 minutes after it ends (a constant). Session-registry
writes, trusted-source filtering, required encryption, the debug HTTP endpoint and Play/hold URL
screening are gone from the node: it uses core NATS only (heartbeat and events), network
isolation is the boundary, and the appbridge screens hold music URLs before they reach it.

## Draining

The node refuses nothing while a rollout drains it; it stops being chosen. It serves the standard
`grpc.health.v1.Health` service on the control port: SERVING normally. On SIGTERM it

1. turns the health status NOT_SERVING (the Kubernetes readiness probe fails),
2. unregisters every registration (REGISTER with Expires 0),
3. stops its heartbeat and publishes `node.down` on `roomr.nodes.<node_ref>.heartbeat`
   (`{"type": "node.down"}`),
4. keeps live rooms until they end or `drainWait` passes (then ends them with `node_error`),
5. exits. A second signal stops waiting.

The room limit (`maxRooms`) still refuses new rooms (`RESOURCE_EXHAUSTED` / SIP 503). Set the
pod's `terminationGracePeriodSeconds` (or Compose's `stop_grace_period`) above `drainWait`, and
a PodDisruptionBudget so a rollout never drains every node at once (the Helm chart does both).
The apiserver stops placing calls on a node at `node.down` or when its heartbeat goes stale;
`node.down` alone never fails a call that is still running.

## Registrations

The node registers only where its configuration says (Roomr, `redesign-media-node`
"Registration is optional and configured"); with no `sip.registrations` it sends no REGISTER and
still takes INVITEs. Each entry:

```yaml
sip:
  registrations:
    - registrar: routr:5060            # host:port or a SIP URI; ;transport=tcp|tls picks the transport (default udp)
      aor: sip:medianode@default       # From/To and the Contact user (default sip:medianode@<registrar host>)
      expires: 30s                     # Expires; the node re-registers at half of it (default 30s)
      auth:                            # optional: answers a 401/407 digest challenge
        username: medianode
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
- Routr is one deployment of this: the bundle registers the media-node Peer with
  `X-Session-Count: "{sessions}"` for Routr's `LEAST_SESSIONS`. `participant.dial` and transfers
  (the NATS path) dial out as the Peer of the first registration (its AOR and `auth`).
- Unknown keys fail at start, so a file with the old `registration:` block or any removed key
  (`trustedSources`, `sessionRegistry`, `requireEncryption`, `debugAddr`, `outboundTransport`,
  `callDedupeWindow`, `allowedDestinations`, `tls.clientCa`) is refused loudly.

## Codecs

SIP legs use `opus/48000/2`, `G722/8000`, `PCMU/8000` and `PCMA/8000`, in that order of
preference (Roomr, `redesign-media-node` "Supported codecs"):

- **Outbound INVITEs** (`participant.dial`, transfers, `CreateCall`) offer them in that order,
  Opus as dynamic payload type 111 with
  `a=fmtp:111 maxplaybackrate=16000;sprop-maxcapturerate=16000;useinbandfec=1` (RFC 7587); the
  callee's pick wins.
- **Inbound offers** are answered with the node's first choice among what the caller offered, so a
  caller offering PCMU and Opus (in any order) gets Opus; a G.711-only trunk gets PCMU (or PCMA if
  that is all it offers). No common codec: `488 Not Acceptable Here`.
- The room mixes at 16 kHz. Opus runs at 16 kHz inside libopus (wideband, mono, 24 kb/s, in-band
  FEC, complexity 5) on its 48 kHz RTP clock (960 ticks per 20 ms); a peer encoding at 48 kHz is
  decoded to 16 kHz by libopus, and peers hear wideband audio, not full-band.
- The list is configurable: `codecs: [G722, PCMU, PCMA]` in `roomr.yaml`, or
  `-codecs PCMU,PCMA`. Leaving Opus out disables it. Unknown names fail at start-up.

Opus is cgo (libopus). The image (`Dockerfile`) builds libopus 1.5.2 from source (checksum
pinned, without the 1.5 neural extras: deep PLC, DRED and OSCE) and links it and libc statically
(`-tags netgo,osusergo`), so the binaries still run on `distroless/static`; the Go build is
cross-compiled for linux/amd64 and linux/arm64 on the build platform, not under QEMU. That costs
about 2-2.6 MB of image (amd64 28.0 to 30.6 MB, arm64 26.4 to 28.4 MB). Built with
`CGO_ENABLED=0` (or `-tags noopus`) the node has no Opus and offers G.722, PCMU, PCMA; the start-up
log line `sip codecs` says which (`"opus": true`). Locally, install libopus (`apt install
libopus-dev`, `brew install opus`).

Opus costs roughly 2.2x PCMU per call: 50 rooms (one SIP leg plus one L16 session participant
each) took about 55-61% of a core with Opus, 25-29% with PCMU and 30-34% with G.722, measured
with `cmd/loadgen` on an arm64 dev container (Apple silicon, shared and busy; not production
hardware). Size SIP capacity for the Opus share you expect.

## The Roomr gRPC service (`roomr.v1.Roomr`)

Roomr is the redesigned media node (OpenSpec change `redesign-media-node`). Its first piece is
the `roomr.v1.Roomr` gRPC service (`api/roomr/v1/roomr.proto`): `CreateCall`,
`EndCall`, `CreateRoom`, `EndRoom`, `Join`, `Leave`, `Play`, `Record` and `SendDtmf`. It runs
**next to** the NATS commands: both work, every RPC calls the same room operation as the NATS
command for the same action, and events stay on NATS (`media.<nodeId>.events.<roomRef>`). The
apiserver places API-originated calls with `CreateRoom` and `CreateCall` here; the gateway's own
commands stay on NATS until the control stream replaces them.

It is off unless a listen address is set:

```yaml
# roomr.yaml
control:
  grpc:
    listen: 0.0.0.0:50061
    tls:                                # optional; without it the service is plaintext
      cert: secret://file/run/secrets/roomr.crt   # file path or secret:// reference
      key: secret://env/ROOMR_CONTROL_KEY
      clientCa: /run/secrets/controllers-ca.pem      # optional: mutual TLS, client certs required
```

Keep the port private to the controller (the apiserver) with a NetworkPolicy (pod network) or a
host firewall (`hostNetwork`), unless TLS with client certificates is on. The same port serves
`grpc.health.v1.Health` (see Draining).

`sip.callRefHeader` (e.g. `X-Call-Ref`; none by default) names the header
that carries a call's `call_ref`: an inbound INVITE's well-formed value becomes the call's ref
(otherwise the node picks one), and `CreateCall` accepts it from `to.headers`.

| RPC | Today |
| --- | --- |
| `CreateCall` | INVITE to `to.uri` through `to.proxy` (a loose `Route`), `to.headers` added untouched (core SIP headers refused), digest `to.auth`; `from` is the From user or URI (empty: the first registration's identity); `room_ref` joins the room or creates it with that ref; `call_ref` is idempotent for 10 minutes after the call ends (the same `Call`, no second INVITE) and `ALREADY_EXISTS` when repeated with other parameters; the `sip.callRefHeader` in `to.headers` is the `call_ref` when `call_ref` is empty (both set and different: `INVALID_ARGUMENT`); `ring_timeout_s` (60 s), `max_duration_s`, `metadata` passed through untouched in this call's `call.progress` / `call.answered` / `participant.joined`. Busy, no answer or rejection publish `call.progress` with `sipStatus` and `cause` and end the room when nobody else is in it |
| `EndCall` | CANCEL while ringing, BYE once answered; inbound calls (by their `call_ref`) end like `hangup` |
| `CreateRoom` / `EndRoom` | `room.create` with an optional ref (`ALREADY_EXISTS` when taken), `max_duration_s`, `empty_timeout_s` and `max_participants` overrides for the room / `room.end` |
| `Join` / `Leave` | RTP participants (`participant.add`) and listen-only participants (`listener.attach`); WebRTC answers `UNIMPLEMENTED` |
| `Play` | a PCM16 WAV URL (fetched like hold music: 10 s, 20 MB; the caller screens the URL) mixed into a call, a participant or the whole room; `operation.done` with `completed`, `failed` or `stopped` |
| `SendDtmf` | RFC 4733 on the target SIP leg (`FAILED_PRECONDITION` without telephone-event) |
| `Record` | `UNIMPLEMENTED` (record through a listener) |

Errors are gRPC codes with a `google.rpc.ErrorInfo` reason (domain `roomr.fonoster.com`):
`RESOURCE_EXHAUSTED` (`room_full`; `at_capacity` at the node's
`maxRooms`), `NOT_FOUND` (`room_not_found`, `call_not_found`, `participant_not_found`),
`ALREADY_EXISTS` (`room_exists`), `INVALID_ARGUMENT` (`bad_message`, `unsupported_codec`, ...),
`FAILED_PRECONDITION` (`call_not_answered`, `dtmf_not_negotiated`) and
`UNIMPLEMENTED` (`not_supported`). Regenerate the Go code with `api/generate.sh`.

## Test

- `go test ./...`: unit tests, plus end-to-end tests in `e2e/` when `CONFORMANCE_NATS_URL` is set
  (a SIP caller bot calls the node; the test plays the gateway).
- `mods/conformance/test/media-control-go.test.ts`: the media-control scenario files against this
  node, with the caller bot (`cmd/sipcaller`, an HTTP-driven SIP UA) as the caller.
- `mods/appbridge/test/gonode.test.ts`: the voice-session suite through gateway → this node → caller
  bot, over real SIP and RTP.
