# Live call through Routr (test rig)

This test runs one real call through Routr into the new stack:

```
caller bot ──INVITE sip:+17853178070@trunk.rig.local──▶ Routr ──▶ Go Roomr node ──media-control──▶ appbridge ──WebSocket──▶ app
```

It checks the parts that only a real Routr can show:

- The Roomr node registers as Peer `roomr` (`sip:roomr@rig.local`, least-sessions), and
  Routr stores its `X-Session-Count`: 0 when idle, 1 during the call, 0 again after it.
- Routr finds the Trunk by the Request-URI host (`trunk.rig.local`), the Number by the dialed
  number, and sends the call to the Peer whose AOR is the Number's `aorLink`.
- The Number's `x-app-ref` extra header reaches the node, so the app gets `session.start` with
  `appRef: app-rig`.
- Audio goes both ways (caller to app and app to caller), and the caller's BYE crosses Routr and
  ends the session.
- A node stopped with SIGTERM removes its route from Routr.

The test is `mods/appbridge/test/routr.live.test.ts`. It is skipped unless `ROUTR_LIVE=1`.

## Run it

You need Docker, Go 1.25, and a NATS server for the node's heartbeats and events. Use your own
NATS, not a shared one: another run's nodes on the same NATS would mix their heartbeats and events
with this run's.

```sh
mods/appbridge/test/routr/rig.sh up        # Postgres + Routr 2.15.4; about a minute the first time
CONFORMANCE_NATS_URL=nats://127.0.0.1:4235 mods/appbridge/test/routr/rig.sh test
mods/appbridge/test/routr/rig.sh down      # removes the containers and the database
```

`rig.sh logs` follows Routr's logs. The test can run many times against one rig: it creates or
updates its Routr resources by name each time.

## What the rig is

`mods/appbridge/test/routr/compose.yaml` starts two containers:

| Container | What | Host ports |
| --- | --- | --- |
| `rb-cutover-routr-postgres` | Postgres 16 with a `routr` database | none |
| `rb-cutover-routr` | `fonoster/routr-one:2.15.4`, `START_INTERNAL_DB=false` | 15560 SIP (UDP, TCP), 15551 API, 15552 location |

Notes:

- **Migrations.** With an external database, the image's start command runs
  `npx prisma@6.12.0 migrate deploy` against `DATABASE_URL` (Routr's 3 migrations). That is the
  same path the platform Compose file uses. The internal-database mode stalls at start, so the rig
  does not use it.
- **SIP port 15560.** The rig mounts its own EdgePort config (`edgeport.yaml`, through
  `CONFIG_PATH`) so Routr listens on 15560 inside the container too. Routr writes that port in Via
  and Record-Route, and the host reaches it through the port mapping. `EXTERNAL_ADDRS=127.0.0.1`
  makes Routr write `127.0.0.1` there.
- **Port 15552** exposes Routr's internal location service. The test reads the node's route from
  it to check `X-Session-Count`. Production setups should not expose it.

## Docker for Mac networking

Routr runs in Docker. The node, the caller bot and AppBridge run on the host.

- **Routr to the host.** Routr reaches the host as `host.docker.internal` (IPv4 `192.168.65.254`;
  `rig.sh test` looks it up). The node and the bot put that address in Via and Contact
  (`sip.advertise`).
- **Routr stores the address a REGISTER came from**, not the Contact (`received`/`rport`). On
  Docker for Mac that is a NAT address. So the node sends every request from its listening UDP
  port and adds `rport`. Routr's INVITEs then come back through the same NAT mapping. The node now
  always does this (CO-B2), because it is also correct behind cloud NAT.
- **RTP does not go through Routr** (no RTPEngine in the rig). The bot and the node exchange RTP
  on `127.0.0.1` directly.

## Resources the test creates (with @routr/sdk)

| Resource | Values |
| --- | --- |
| Credentials | `roomr credentials`: username `roomr` |
| Peer | `Roomr nodes`: aor `sip:roomr@rig.local`, `LEAST_SESSIONS`, `maxContacts: -1` |
| Trunk | `trunk trunk.rig.local`: inboundUri `trunk.rig.local`, no ACL or inbound credentials |
| Number | `tel:+17853178070`: aorLink `sip:roomr@rig.local`, trunkRef as above, extra header `x-app-ref: app-rig` |

The code is in `mods/appbridge/test/routr/provision.ts`. It also works as a reference for setting up
a real roomr Peer.

## Things that tripped the first run

- Routr's update calls need the full object (`name` for Numbers; `name` and `username` for
  Credentials). A partial update fails with "Expected a string but received a undefined".
- A killed node's route stays in Routr until it expires (the registration's `expires`; 30 s by
  default). Least-sessions can pick that dead route. The test waits until its node's route is the
  only one. A node stopped with SIGTERM now unregisters on exit (the test's last check), so only
  crashes leave dead routes.
- The node re-registers right away only when its load changes by 5 or more rooms, or drops to 0.
  Smaller changes wait for the timer. The test registers with `expires: 4s` (a refresh every 2 s).
