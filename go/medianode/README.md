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

## Test

- `go test ./...`: unit tests, plus end-to-end tests in `e2e/` when `CONFORMANCE_NATS_URL` is set
  (a SIP caller bot calls the node; the test plays the gateway).
- `mods/conformance/test/media-control-go.test.ts`: the media-control scenario files against this
  node, with the caller bot (`cmd/sipcaller`, an HTTP-driven SIP UA) as the caller.
- `mods/appbridge/test/gonode.test.ts`: the voice-session suite through gateway → this node → caller
  bot, over real SIP and RTP.
