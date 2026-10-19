# @fonoster/appbridge

AppBridge (AppBridge) serves each call to its app over the Fonoster session protocol:
it claims calls from NATS, drives the Roomr nodes, runs speech and turn-taking, and dials the app's
WebSocket. It ships as the `fonoster/appbridge` image and is private to this monorepo (not
published to npm).

Its NATS identity is still `appbridge` (the NATS user, `nats-permissions/appbridge.conf`, subjects such
as `appbridge.incoming`, and the `appbridges.*` KV keys), as is its config file (`appbridge.yaml`); those
wire and config names are revisited with the roomr redesign.

See [docs/session-protocol.md](../../docs/session-protocol.md) and
[docs/operators/rebuild.md](../../docs/operators/rebuild.md).
