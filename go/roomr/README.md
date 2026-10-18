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
| `node.heartbeat` every 2 s, drain on SIGTERM, `node.down` | done |
| Registrations from configuration (`sip.registrations`, none by default): digest auth, header templates with `{sessions}`, re-registers on load changes and drain, unregisters on exit, `registration.state` on NATS (see Registrations) | done; Routr's least-sessions (`X-Session-Count`) verified against Routr 2.15.1 (`docs/operators/routr-live-test.md`) |
| `participant.dial` and cold, warm and refer transfers through an outbound proxy (`-outbound-proxy`, Routr in production) | done |
| Debug endpoint (`-debug host:port`, `GET /rooms`) for tests and operators | done |
| `listener.attach` / `listener.detach`: one unmixed RTP stream per selected track | done |
| PCMU, PCMA, G.722 and Opus on SIP legs, offered Opus first (see Codecs) | done |
| SIP INFO and in-band DTMF, SRTP, jitter buffer | done |
| The `roomr.v1.Roomr` gRPC service, next to the NATS commands; off by default | first slice (see below) |

## Run

```sh
cd go/roomr
go build ./cmd/...
./roomr -node-id node-a -nats nats://127.0.0.1:4222 -sip 0.0.0.0:5060 \
  -sip-advertise 10.0.0.5 -rtp-advertise 10.0.0.5 -config roomr.yaml
```

Every flag has a key in the config file (`-config`, default `/config/roomr.yaml`; see
`ops/bundle/config/roomr.example.yaml`), and flags win over it. The node reads no
`ROOMR_*` variables: to take a value from the environment, reference it in the file as a
`${VAR}` placeholder (`nodeId: "${POD_NAME}"`), or as a `secret://env/NAME` reference for the
passwords and TLS PEM settings. A `ROOMR_*` variable the file does not reference is logged
by name at start as ignored.

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
      headers:                         # templates; {sessions} = active rooms, the room limit while draining or full
        X-Session-Count: "{sessions}"
```

- Every registration re-registers at once when the room count moves by `-reregister-delta`
  (default 5) or drops to 0, and when the node starts draining (`{sessions}` then renders as
  `maxRooms`). On exit it sends Expires 0. A challenge without `auth` fails the registration.
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
- The earlier `registration:` block and the `-registrar`, `-domain`, `-username`, `-password`,
  `-transport` and `-register-every` flags are gone; a file that still has `registration:` fails
  at start (unknown key).

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

or `-control-grpc 0.0.0.0:50061` with `-control-grpc-cert`, `-control-grpc-key` and
`-control-grpc-client-ca`. Keep the port private to the controller (the apiserver) unless TLS
with client certificates is on.

`sip.callRefHeader` (`-call-ref-header`, e.g. `X-Call-Ref`; none by default) names the header
that carries a call's `call_ref`: an inbound INVITE's well-formed value becomes the call's ref
(otherwise the node picks one), and `CreateCall` accepts it from `to.headers`.

| RPC | Today |
| --- | --- |
| `CreateCall` | INVITE to `to.uri` through `to.proxy` (a loose `Route`), `to.headers` added untouched (core SIP headers refused), digest `to.auth`; `from` is the From user or URI (empty: the first registration's identity); `room_ref` joins the room or creates it with that ref; `call_ref` is idempotent for 5 minutes after the call ends (the same `Call`, no second INVITE) and `ALREADY_EXISTS` when repeated with other parameters; the `sip.callRefHeader` in `to.headers` is the `call_ref` when `call_ref` is empty (both set and different: `INVALID_ARGUMENT`); `ring_timeout_s` (60 s), `max_duration_s`, `labels` echoed in this call's `call.progress` / `call.answered` / `participant.joined`. Busy, no answer or rejection publish `call.progress` with `sipStatus` and `cause` and end the room when nobody else is in it |
| `EndCall` | CANCEL while ringing, BYE once answered; inbound calls (by their `call_ref`) end like `hangup` |
| `CreateRoom` / `EndRoom` | `room.create` with an optional ref (`ALREADY_EXISTS` when taken) / `room.end` |
| `Join` / `Leave` | RTP participants (`participant.add`) and listen-only participants (`listener.attach`); WebRTC answers `UNIMPLEMENTED` |
| `Play` | a PCM16 WAV URL (fetched like hold music: public destinations only, unless `allowedDestinations`) mixed into a call, a participant or the whole room; `operation.done` with `completed`, `failed` or `stopped` |
| `SendDtmf` | RFC 4733 on the target SIP leg (`FAILED_PRECONDITION` without telephone-event) |
| `Record` | `UNIMPLEMENTED` (record through a listener) |

Errors are gRPC codes with a `google.rpc.ErrorInfo` reason (domain `roomr.fonoster.com`):
`UNAVAILABLE` (`draining`), `RESOURCE_EXHAUSTED` (`room_full`; `at_capacity` at the node's
`maxRooms`), `NOT_FOUND` (`room_not_found`, `call_not_found`, `participant_not_found`),
`ALREADY_EXISTS` (`room_exists`), `INVALID_ARGUMENT` (`bad_message`, `unsupported_codec`, ...),
`FAILED_PRECONDITION` (`call_not_answered`, `dtmf_not_negotiated`, `encryption_required`) and
`UNIMPLEMENTED` (`not_supported`). Regenerate the Go code with `api/generate.sh`.

## Test

- `go test ./...`: unit tests, plus end-to-end tests in `e2e/` when `CONFORMANCE_NATS_URL` is set
  (a SIP caller bot calls the node; the test plays the gateway).
- `mods/conformance/test/media-control-go.test.ts`: the media-control scenario files against this
  node, with the caller bot (`cmd/sipcaller`, an HTTP-driven SIP UA) as the caller.
- `mods/appbridge/test/gonode.test.ts`: the voice-session suite through gateway → this node → caller
  bot, over real SIP and RTP.
