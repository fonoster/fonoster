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
| REGISTER to Routr with `X-Session-Count` (re-registers on load changes and drain, unregisters on exit) | done, verified against Routr 2.15.1 (`docs/operators/routr-live-test.md`) |
| `participant.dial` and cold, warm and refer transfers through an outbound proxy (`-outbound-proxy`, Routr in production) | done |
| Debug endpoint (`-debug host:port`, `GET /rooms`) for tests and operators | done |
| `listener.attach` / `listener.detach`: one unmixed RTP stream per selected track | done |
| PCMA/G.722/Opus, SIP INFO and in-band DTMF, SRTP, jitter buffer | next slices |
| MediaControl over gRPC (Roomr), next to the NATS commands; off by default | first slice (see below) |

## Run

```sh
cd go/medianode
go build ./cmd/...
./medianode -node-id node-a -nats nats://127.0.0.1:4222 -sip 0.0.0.0:5060 \
  -sip-advertise 10.0.0.5 -rtp-advertise 10.0.0.5 -registrar routr:5060
```

Every flag has a key in the config file (`-config`, default `/config/medianode.yaml`; see
`ops/bundle/config/medianode.example.yaml`), and flags win over it. The node reads no
`MEDIANODE_*` variables: to take a value from the environment, reference it in the file as a
`${VAR}` placeholder (`nodeId: "${POD_NAME}"`), or as a `secret://env/NAME` reference for the
passwords and TLS PEM settings. A `MEDIANODE_*` variable the file does not reference is logged
by name at start as ignored.

## MediaControl over gRPC (Roomr)

Roomr is the redesigned media node (OpenSpec change `redesign-media-node`). Its first piece is
the `media.v1.MediaControl` gRPC service (`api/media/v1/media_control.proto`): `CreateCall`,
`EndCall`, `CreateRoom`, `EndRoom`, `Join`, `Leave`, `Play`, `Record` and `SendDtmf`. It runs
**next to** the NATS commands: both work, every RPC calls the same room operation as the NATS
command for the same action, and events stay on NATS (`media.<nodeId>.events.<roomRef>`).

It is off unless a listen address is set:

```yaml
# medianode.yaml
control:
  grpc:
    listen: 0.0.0.0:50061
    tls:                                # optional; without it the service is plaintext
      cert: secret://file/run/secrets/medianode.crt   # file path or secret:// reference
      key: secret://env/MEDIANODE_CONTROL_KEY
      clientCa: /run/secrets/controllers-ca.pem      # optional: mutual TLS, client certs required
```

or `-control-grpc 0.0.0.0:50061` with `-control-grpc-cert`, `-control-grpc-key` and
`-control-grpc-client-ca`. Keep the port private to the controller (the apiserver) unless TLS
with client certificates is on.

| RPC | Today |
| --- | --- |
| `CreateCall` | INVITE to `to.uri` through `to.proxy` (a loose `Route`), `to.headers` added untouched (core SIP headers refused), digest `to.auth`; `from` is the From user or URI; `room_ref` joins the room or creates it with that ref; idempotent `call_ref`; `ring_timeout_s` (60 s), `max_duration_s`, `labels` echoed in this call's `call.progress` / `call.answered` / `participant.joined`. Busy, no answer or rejection publish `call.progress` with `sipStatus` and `cause` and end the room the call created |
| `EndCall` | CANCEL while ringing, BYE once answered; inbound calls (by `X-Call-Ref`) end like `hangup` |
| `CreateRoom` / `EndRoom` | `room.create` with an optional ref (`ALREADY_EXISTS` when taken) / `room.end` |
| `Join` / `Leave` | RTP participants (`participant.add`) and listen-only participants (`listener.attach`); WebRTC answers `UNIMPLEMENTED` |
| `Play` | a PCM16 WAV URL (fetched like hold music: public destinations only, unless `allowedDestinations`) mixed into a call, a participant or the whole room; `operation.done` with `completed`, `failed` or `stopped` |
| `SendDtmf` | RFC 4733 on the target SIP leg (`FAILED_PRECONDITION` without telephone-event) |
| `Record` | `UNIMPLEMENTED` (record through a listener) |

Errors are gRPC codes with a `google.rpc.ErrorInfo` reason (domain `media.fonoster.com`):
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
