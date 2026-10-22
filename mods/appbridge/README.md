# @fonoster/appbridge

AppBridge serves each call to its app over the Fonoster session protocol: Roomr nodes open one
gRPC control stream per call to its session endpoint (`Session.Connect`, port 50071 by default,
`session.listen` in `appbridge.yaml`), AppBridge answers with its RTP endpoint, runs speech and
turn-taking, and dials the app's WebSocket. Audio is RTP between the node and AppBridge. The same
port serves `grpc.health.v1.Health`: `SERVING` while it takes calls, `NOT_SERVING` while it drains
after SIGTERM (`session.drainWait`, 1 h by default). It ships as the `fonoster/appbridge` image and
is private to this monorepo (not published to npm).

Its NATS identity is `appbridge` (the NATS user and `nats-permissions/appbridge.conf`): call
records, webhooks, catalog use, call control between replicas (`appbridge.calls.<callRef>`) and
its `calls.<callRef>` session-registry entries. It publishes no heartbeat and keeps no membership
entry.

See [docs/session-protocol.md](../../docs/session-protocol.md) and
[docs/operators/rebuild.md](../../docs/operators/rebuild.md).
