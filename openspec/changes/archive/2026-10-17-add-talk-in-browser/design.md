## Context

How a phone call reaches an agent today (docs/try-the-new-platform.md, add-media-node,
add-voice-session-gateway):

```
softphone/carrier ──SIP──▶ Routr ──INVITE + X-App-Ref──▶ media node ──call.incoming (NATS)──▶ gateway ──WS──▶ app
          RTP ──▶ RTPEngine ──▶ media node
```

Routr finds the Number, routes to the media-node Peer (`sip:medianode@default`, least-sessions)
and adds the Number's `X-App-Ref`. The media node forwards every `X-*` header to the gateway in
`call.incoming`; the gateway picks the app by `X-App-Ref`.

What Routr 2.15.1 (routr-one) already does, read from the image:
- **Connect tokens** (`@routr/connect` router): an INVITE with `X-Connect-Token` is verified with
  `CONNECT_VERIFIER_PUBLIC_KEY_PATH` (jsonwebtoken, any algorithm the key allows). The caller
  becomes an anonymous agent; the callee is the Peer whose `aor` equals the token's `aorLink`
  (`AGENT_TO_PEER`, location lookup with the Peer's balancing). The token must list `INVITE` in
  `allowedMethods`. No digest challenge.
- **RTP relay** (`@routr/rtprelay`, on when `RTPENGINE_HOST` is set): `WEB_TO_PHONE` asks
  RTPEngine for `RTP/AVP`, `ICE: remove`, `DTLS: off`, rtcp-mux demux toward the phone side, and
  the reverse (`UDP/TLS/RTP/SAVPF`, ICE force, DTLS passive) toward the browser.
- **EdgePort** supports `ws` and `wss` transports (the image's default lists 5062/5063).

The API server already has `CreateTestToken` (commit 1a3a0981a): RS256 with Identity's private
key, `{ ref, domain, displayName, signalingServer, targetAor, username, accessKeyId, aorLink,
privacy, allowedMethods: [INVITE] }`, 1 h. Its `targetAor` is the legacy `sip:voice@default`.

## Goals / Non-Goals

**Goals:** a fresh bundle install can talk to an agent from the dashboard right after creating
it; no new service, no new dependency, one public port; a token can only reach its workspace's
agents.

**Non-Goals:** phone/outbound calls from the browser; TLS for the bundle; TURN (LAN/localhost
only); a per-agent token (proto change).

## Decisions

### D1. Targeting: token → media-node Peer, `X-App-Ref` → agent

The token's `aorLink` and `targetAor` are `routr.mediaNodePeer.aor` (default
`sip:medianode@default`). The browser INVITEs `targetAor` with `X-App-Ref: <appRef>` and
`X-Connect-Token: <jwt>`. Routr routes to a media node like any Peer call; the media node and the
gateway need no new routing: the gateway already picks the app by `X-App-Ref`.

Alternatives: a per-app AOR (one Routr Peer or Number per agent: more Routr state to keep in sync
for nothing the header doesn't give us); an `appRef` claim in the token (needs a request message,
i.e. a proto + SDK change; the workspace check in D4 is enough isolation).

### D2. Signaling: Routr `ws` on 5062, behind Envoy at `/sip`

- EdgePort example adds `- protocol: ws, port: 5062`. The port is not published.
- Envoy (`ops/bundle/config/envoy.yaml`, kept byte-identical to `config/envoy.yaml`): a route
  `prefix: /sip` → cluster `routr-ws` (`routr:5062`), `upgrade_configs: websocket`, rewritten to
  `/`, no timeout. It sits before the gRPC and dashboard catch-alls.
- `signalingServer` in `fonoster.yaml`: the example writes `ws://${HOST_IP}:${HTTP_PORT}/sip`.
  When unset, the API server derives it from `appUrl` (`http→ws`, `https→wss`, plus `/sip`)
  instead of the legacy `wss://<domain>:5062`.
- SIP.js keeps the WebSocket alive with CRLF pings every 15 s, under Envoy's 5 min stream idle
  timeout.
- Routr's WebSocket handshake matches `Host` and `Sec-WebSocket-Protocol` case-sensitively, so
  Envoy uses the `preserve_case` header formatter (build log TB-B2).
- The dashboard's CSP allows `ws:` as well as `wss:` (TB-B7).

Plain `ws` is fine for localhost and LAN: the bundle serves plain HTTP today, and a page served
over `http://` may open `ws://`. Behind TLS, `wss://<host>/sip` works through the same route.

### D3. Secure context limitation

Browsers expose `getUserMedia` only in a secure context: HTTPS, or `http://localhost` /
`127.0.0.1`. The bundle's `PUBLIC_URL` is `http://<HOST_IP>:8449`, which is **not** a secure
context. So, on the bundle without TLS, browser calls work when the dashboard is opened at
`http://localhost:8449` on the machine running it; from another machine they need TLS in front
(the "Secure it" docs). The drawer detects this (`window.isSecureContext`) and says so instead of
showing a Call button that would fail.

### D4. The gateway verifies test calls

The media node trusts `X-App-Ref` from Routr, and Routr forwards the browser's headers as sent.
Without a check, a token from workspace A could name an app of workspace B. So:

- `gateway.yaml` gets `testCalls: { publicKeyFile }` (the example: `/etc/fonoster/keys/public.pem`,
  already mounted with the keys folder).
- A `call.incoming` whose headers carry `X-Connect-Token` is accepted only when the token is an
  RS256 JWT that verifies with that key, is not expired, and its `accessKeyId` equals the app's
  workspace (apps from the YAML store, which have no workspace, only need the signature).
  Otherwise the gateway rejects with 403 and records `call.failed` reason `test_call_denied`.
- Without `testCalls` configured, such calls are rejected (fail closed).
- Verification is Node `crypto` (`createVerify("RSA-SHA256")`), no new dependency.

### D5. Keys: reuse Identity's RS256 pair

The token is signed with Identity's private key (`identity.keys.privateKeyPath`); Routr and the
gateway verify with `keys/public.pem`, which `fonoster-config init` (and `ops/rebuild/stack`)
already generate. Compose mounts `${CONFIG_DIR}/keys/public.pem` into Routr at
`/etc/routr/keys/public.pem` and sets `CONNECT_VERIFIER_PUBLIC_KEY_PATH`. No new secret.

Identity's access tokens are signed with the same key. Routr rejects them as connect tokens
(no `allowedMethods`), and the gateway requires `allowedMethods` to include `INVITE` too.

### D6. Media: RTPEngine bridges WebRTC to RTP

No change in the media node. RTPEngine runs with `--dtls-passive` (TB-B9), and the bundle passes
its settings under the names the image reads (`RTPENGINE_PORT_MIN/MAX`, `RTPENGINE_PUBLIC_IP`,
TB-B8). RTPEngine advertises `PUBLIC_IP` (= `HOST_IP`) in both
SDPs, so the browser's ICE reaches `HOST_IP:<RTPENGINE range>/udp`, already published. The media
node chooses its codec from the browser's offer (PCMU/PCMA/G722/Opus pass through RTPEngine
unchanged). No TURN: browser and server must reach each other directly (localhost or LAN).

### D7. Dashboard

`use-browser-call.ts` (sip.js `Web.SimpleUser`, restored from before 328f43097 and extended):
states `idle → connecting → ringing → connected → ended | failed`; `mute()`/`unmute()` through
`SimpleUser.mute/unmute`; errors: microphone blocked (`NotAllowedError`), no microphone
(`NotFoundError`), call rejected (status code), lost connection; hang up when the drawer closes.
The drawer shows a "Talk in the browser" card (Call / Mute / Hang up, timer) above "Call this
number". Copy stays plain and short.

## Risks / Trade-offs

- [JAIN-SIP behind a proxy] Routr writes `EXTERNAL_ADDRS:5062;transport=ws` in Record-Route,
  which the browser can't reach directly. SIP.js sends every in-dialog request on its one
  WebSocket, so this is harmless; the live check covers BYE in both directions.
- [Header spoofing] D4 closes cross-workspace use of tokens. A registered softphone agent could
  still INVITE the media-node Peer with any `X-App-Ref` (pre-existing, out of scope; noted for the
  owner).
- [No TURN] Browsers behind NAT away from the server can't get media. Accepted for localhost/LAN.

## Migration Plan

Existing install: take the new bundle files, run `fonoster-config init` again (renders the new
keys in `fonoster.yaml`, `gateway.yaml`, `routr-edgeport.yaml`, copies `envoy.yaml`), then
`docker compose up -d` (recreates routr, envoy, apiserver, gateway, dashboard with the new images).
