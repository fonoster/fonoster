## MODIFIED Requirements

### Requirement: SIP over WebSocket on the API port

The bundle SHALL accept SIP over WebSocket at `/sip` on the dashboard and API address: over HTTPS
(`wss://<host>/sip`) by default, and over plain HTTP (`ws://<host>:<HTTP_PORT>/sip`) only when HTTPS
is turned off. In both cases Envoy upgrades the request and proxies it to Routr's `ws` transport,
which is not published on its own port, and Routr routes each request by the transport the browser
names (its `wss` listening point for WSS, also not published). Routr SHALL verify connect tokens
with Identity's public key.

#### Scenario: Browser connects over HTTPS
- **WHEN** the dashboard is served over `https://` with the generated certificate, the owner has
  accepted the browser's certificate warning, and the browser calls the agent over
  `wss://<host>/sip`
- **THEN** Envoy terminates TLS and proxies to Routr's `ws` transport, the microphone is available,
  and the call connects and hangs up with no Routr error

#### Scenario: Browser connects over HTTPS with the owner's certificate
- **WHEN** the dashboard is served over `https://<domain>` with the owner's certificate
- **THEN** the call connects over `wss://<domain>/sip` with no warning

#### Scenario: Browser connects
- **WHEN** HTTPS is turned off and a client opens `ws://<host>:<HTTP_PORT>/sip` with subprotocol
  `sip`
- **THEN** the WebSocket opens and SIP requests sent on it reach Routr

#### Scenario: Rendered bundle config
- **WHEN** `fonoster-config init` renders the bundle
- **THEN** `routr-edgeport.yaml` lists a `ws` transport on 5062 and a `wss` transport on 5063,
  Envoy routes `/sip` to the `ws` one, and `fonoster.yaml` sets no `signalingServer`, so browsers
  get `wss://<host>/sip` from `appUrl` (`ws://<HOST_IP>:<HTTP_PORT>/sip` when HTTPS is off)
