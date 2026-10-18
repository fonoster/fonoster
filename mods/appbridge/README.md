# @fonoster/appbridge

AppBridge (the VoiceSessionGateway) serves each call to its app over the Fonoster session protocol:
it claims calls from NATS, drives the media nodes, runs speech and turn-taking, and dials the app's
WebSocket. It ships as the `fonoster/appbridge` image and is private to this monorepo (not
published to npm).

Its NATS identity is still `gateway` (the NATS user, `nats-permissions/gateway.conf`, subjects such
as `gateway.incoming`, and the `gateways.*` KV keys), as is its config file (`gateway.yaml`); those
wire and config names are revisited with the media-node redesign.

See [docs/session-protocol.md](../../docs/session-protocol.md) and
[docs/operators/rebuild.md](../../docs/operators/rebuild.md).
