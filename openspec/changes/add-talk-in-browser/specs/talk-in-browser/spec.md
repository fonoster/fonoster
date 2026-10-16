## ADDED Requirements

### Requirement: Test tokens target the media nodes

`Applications.CreateTestToken` SHALL return an RS256 JWT signed with Identity's private key, valid
for one hour, whose payload has `aorLink` and the response's `targetAor` equal to the media-node
Peer AOR (`routr.mediaNodePeer.aor`), `allowedMethods` equal to `["INVITE"]`, and `accessKeyId`
equal to the caller's workspace access key. The response's `signalingServer` SHALL be the
configured `signalingServer`, or, when unset, the `appUrl` origin with `http` replaced by `ws`
(`https` by `wss`) and the path `/sip`.

#### Scenario: Token for a workspace
- **WHEN** a workspace member calls `CreateTestToken` with access key `WO123`
- **THEN** the token verifies with Identity's public key, its `aorLink` is `sip:medianode@default`,
  its `allowedMethods` is `["INVITE"]` and its `accessKeyId` is `WO123`

#### Scenario: Signaling URL from appUrl
- **WHEN** `fonoster.yaml` has `appUrl: http://localhost:8449` and no `signalingServer`
- **THEN** the response's `signalingServer` is `ws://localhost:8449/sip`

### Requirement: SIP over WebSocket on the API port

The bundle SHALL accept SIP over WebSocket at `/sip` on the API port (`HTTP_PORT`, plain HTTP):
Envoy upgrades the request and proxies it to Routr's `ws` transport, which is not published on
its own port. Routr SHALL verify connect tokens with Identity's public key.

#### Scenario: Browser connects
- **WHEN** a client opens `ws://<host>:<HTTP_PORT>/sip` with subprotocol `sip`
- **THEN** the WebSocket opens and SIP requests sent on it reach Routr

#### Scenario: Rendered bundle config
- **WHEN** `fonoster-config init` renders the bundle
- **THEN** `routr-edgeport.yaml` lists a `ws` transport on 5062, `envoy.yaml` routes `/sip` to it,
  and `fonoster.yaml` has `signalingServer: ws://<HOST_IP>:<HTTP_PORT>/sip`

### Requirement: A browser call reaches the agent

The platform SHALL route an INVITE sent over the WebSocket to the token's `targetAor`, with
headers `X-Connect-Token` (a valid test token) and `X-App-Ref` (an agent of the token's
workspace), to a media node, bridge its WebRTC media (ICE, DTLS-SRTP) to plain RTP through
RTPEngine, and run the app named by `X-App-Ref`, like a call from a number.

#### Scenario: Call the saved agent
- **WHEN** the browser INVITEs `sip:medianode@default` with a valid token and `X-App-Ref` of the
  workspace's Autopilot agent
- **THEN** the call is answered, the hosted Autopilot opens a session for that agent, and the
  browser receives the agent's audio

#### Scenario: Invalid token
- **WHEN** the INVITE carries a token that doesn't verify or has expired
- **THEN** Routr answers 403 and no session starts

### Requirement: Test tokens stay in their workspace

The gateway SHALL answer a call whose headers include `X-Connect-Token` only when the token is an
RS256 JWT that verifies with `testCalls.publicKeyFile`, is not expired, lists `INVITE` in
`allowedMethods`, and has an `accessKeyId` equal to the app's workspace. Otherwise it SHALL reject
the call with SIP 403 and record `call.failed` with reason `test_call_denied`. Without
`testCalls.publicKeyFile` such calls SHALL be rejected.

#### Scenario: Another workspace's agent
- **WHEN** a call carries a valid token for workspace `WO-A` and `X-App-Ref` of an app in `WO-B`
- **THEN** the gateway rejects it with 403 and the app's session never opens

#### Scenario: Forged token
- **WHEN** a call carries `X-Connect-Token` signed with another key
- **THEN** the gateway rejects it with 403

#### Scenario: Calls without a token
- **WHEN** a call from a number carries no `X-Connect-Token`
- **THEN** the gateway routes it as before

### Requirement: Talk drawer calls from the browser

The agent's Talk drawer SHALL offer a Call button that places a browser call to the saved
version of the agent, then shows the call state (connecting, ringing, connected with a timer,
ended, failed), a Mute toggle and a Hang up button. Closing the drawer SHALL hang up. The list of
the agent's numbers SHALL stay below the call card.

#### Scenario: Call, mute and hang up
- **WHEN** the user clicks Call and the agent answers
- **THEN** the drawer shows "Connected" with a timer, Mute mutes the microphone (the button then
  reads Unmute), and Hang up ends the call and shows "Call ended" with Call again

#### Scenario: Microphone blocked
- **WHEN** the browser denies microphone access
- **THEN** the drawer says to allow microphone access and offers Call again

#### Scenario: Not a secure context
- **WHEN** the dashboard is opened over plain HTTP on an address other than localhost
- **THEN** the drawer says browser calls need HTTPS or localhost, shows no Call button, and still
  lists the agent's numbers

#### Scenario: Call rejected
- **WHEN** the server rejects the INVITE (for example 403)
- **THEN** the drawer shows "Call failed" with the status and offers Call again
