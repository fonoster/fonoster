## Why

A fresh self-hosted install can create an agent but can't hear it: the agent's "Talk to agent"
drawer only lists phone numbers, and a number needs a trunk and a carrier (or a softphone set up
by hand). The owner decided (2026-10-15) that the drawer gets a **Call** button: the browser calls
the agent's saved version over WebRTC, with mic and speaker, Mute and Hang up. No number, trunk or
softphone needed.

The pieces mostly exist: the API server already issues short-lived test tokens
(`Applications.createTestToken`, an RS256 JWT for a Routr "ephemeral agent"), Routr's connect
processor accepts them, and Routr's RTP relay already bridges WebRTC to plain RTP through
RTPEngine. What's missing is the wiring on the new voice path: the token targets the old Asterisk
peer, Routr has no WebSocket listener or verifier key in the bundle, nothing proxies SIP over
WebSocket, and the dashboard dropped its browser call.

## What Changes

- **Token targets the media nodes**: `CreateTestToken` signs a token whose `aorLink` / `targetAor`
  is the media-node Peer (`routr.mediaNodePeer.aor`, `sip:medianode@default`). The browser names
  the agent with `X-App-Ref`. The signaling URL defaults to `ws(s)://<appUrl host>/sip`.
- **SIP over WebSocket through Envoy**: Routr's EdgePort gets a `ws` transport (container port
  5062, not published); Envoy routes `/sip` on the API port (8449) to it as a WebSocket upgrade.
  One port for dashboard, API and signaling.
- **Routr verifies test tokens** with Identity's public key (`CONNECT_VERIFIER_PUBLIC_KEY_PATH`,
  the key `fonoster-config init` already generates).
- **The gateway checks test calls**: a call that carries `X-Connect-Token` is answered only when
  the token verifies with the same public key and was issued for the app's workspace. Otherwise
  it is rejected (403), so a token can't reach another workspace's agent.
- **Media**: unchanged components. Routr's RTP relay asks RTPEngine for ICE + DTLS-SRTP toward
  the browser and plain RTP (`RTP/AVP`) toward the media node.
- **Dashboard**: the Talk drawer gets a "Talk in the browser" card with Call, Mute and Hang up,
  call state and timer, clear errors for a blocked microphone, a rejected call and a non-secure
  page. The "Call this number" list stays below it.
- **Config**: `fonoster.example.yaml` sets `signalingServer`, `gateway.example.yaml` sets
  `testCalls.publicKeyFile`, the bundle compose mounts the public key into Routr. Re-running
  `fonoster-config init` and recreating `routr`, `envoy`, `apiserver`, `gateway` and `dashboard`
  is enough on an existing install.

Out of scope: calling phones from the browser, chat, TLS (`wss`) for the bundle.

## Capabilities

### New Capabilities
- `talk-in-browser`: call an agent from the dashboard over WebRTC, without numbers or trunks.

### Modified Capabilities
<!-- none: the voice-session and media-node contracts are unchanged; the gateway check is new
     behaviour of this capability. -->

## Impact

- `mods/apiserver` (token payload, signaling default), `mods/gateway` (test-call check, config
  key), `mods/dashboard` (Talk drawer, `use-browser-call`), `ops/bundle` (compose, Envoy, Routr
  EdgePort, examples), `config/envoy.yaml` (kept identical to the bundle's), `ops/rebuild` (stack
  overrides), docs (`docs/try-the-new-platform.md`).
- No proto change: `CreateTestToken` keeps its `Empty` request; the workspace comes from the
  caller's access key.
