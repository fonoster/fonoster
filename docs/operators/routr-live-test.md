# Live calls through Routr (test rig)

One Go e2e test runs real calls through a real Routr into two Roomr nodes:

```
caller bot ──INVITE (TCP)──▶ Routr edgeport ──▶ the lighter of two Roomr nodes ──control stream──▶ fake app
```

It checks what only a real Routr can show:

- Both nodes register as one Peer (`sip:roomr@sip.local`, least-sessions) and send their room
  count in `X-Session-Count`, rendered from the registration's `{sessions}` template.
- Routr finds the Trunk by the Request-URI host, the Number by the dialed number, and sends the
  call to the Peer whose AOR is the Number's `aorLink`.
- Routr picks the node that reported fewer sessions, in both directions: node A carries three rooms
  and the call goes to B; then B carries five and the call goes to A. Audio flows through the call.

The test is `TestROM034_LiveRoutrLeastSessions` in `go/roomr/e2e/routr_live_test.go`, case
ROM-034 of the QA catalog (`mods/conformance/catalog/areas/roomr.md`). It fails, never skips,
without a Routr: CI starts one in the `go` job of pr-checks and in the QA workflow's Roomr job.

## Run it

You need Docker, Go and a NATS server with JetStream for the nodes' heartbeats and events.

```sh
cd go/roomr
docker compose -f e2e/testdata/routr/compose.yaml up -d --wait
ROUTR_EDGEPORT=127.0.0.1:15360 ROUTR_NODE_HOST=host.docker.internal \
  CONFORMANCE_NATS_URL=nats://127.0.0.1:4222 go test ./e2e -run LiveRoutr -count=1 -v
docker compose -f e2e/testdata/routr/compose.yaml down
```

Leave a few seconds between runs so the contacts of the last run expire (the test registers with
`expires: 4s`).

## What the rig is

`go/roomr/e2e/testdata/routr/compose.yaml` runs Routr 2.15.4 (the bundle's version) as separate
services with YAML resources and no database: edgeport (SIP on 15360, TCP and UDP), dispatcher,
location, connect and simpledata. The resources are in `testdata/routr/resources`:

| Resource | Values |
| --- | --- |
| Credentials | username `roomr` |
| Peer | `Roomr nodes`: aor `sip:roomr@sip.local`, least-sessions |
| Trunk | inbound URI `trunk01.acme.com` |
| Number | `tel:+15550001000`: aorLink `sip:roomr@sip.local`, extra header `X-App-Ref: app-live` |

## Networking

Routr runs in Docker; the nodes and the caller bot run in the test process on the host.

- **Routr to the host.** Routr reaches the host as `host.docker.internal` (the compose file maps
  it to the host gateway, so this works on Linux too). The nodes put that name in Contact
  (`ROUTR_NODE_HOST`).
- **Signaling uses TCP.** Docker Desktop's UDP NAT rewrites sources unpredictably.
- **Routr stores the address a REGISTER came from**, not the Contact (`received`/`rport`), so the
  node sends every request from its listening port and adds `rport`, which is also correct behind
  cloud NAT.
- **RTP does not go through Routr** (no RTPEngine in the rig): the bot and the node exchange RTP on
  127.0.0.1 directly.
- The node re-registers right away when its room count changes by `reregisterDelta` (1 in the
  test) or drops to 0; otherwise at half the expiry.
