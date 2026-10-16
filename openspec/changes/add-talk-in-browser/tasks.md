## 1. API server

- [ ] 1.1 `CreateTestToken` targets `routr.mediaNodePeer.aor`; `signalingServer` defaults to the `appUrl` origin as `ws(s)://…/sip`; unit test for the token payload and the default

## 2. Gateway

- [ ] 2.1 `testCalls.publicKeyFile` in the gateway config (schema + type)
- [ ] 2.2 Verify `X-Connect-Token` on `call.incoming` (RS256 with Node crypto, expiry, INVITE, workspace); reject 403 with `test_call_denied`; tests for valid, other workspace, forged, missing config, no token

## 3. Bundle and dev stack

- [ ] 3.1 Routr EdgePort example: `ws` transport on 5062; compose mounts `keys/public.pem` and sets `CONNECT_VERIFIER_PUBLIC_KEY_PATH`
- [ ] 3.2 Envoy `/sip` WebSocket route to `routr:5062` (bundle and `config/envoy.yaml` identical)
- [ ] 3.3 `fonoster.example.yaml` `signalingServer`, `gateway.example.yaml` `testCalls`; fonoster-config test for the rendered keys; bundle conformance test green
- [ ] 3.4 Dev stack (`ops/rebuild`) renders the same (no extra port needed)

## 4. Dashboard

- [ ] 4.1 `use-browser-call` hook (sip.js SimpleUser): connect, call with `X-App-Ref` + `X-Connect-Token`, states, mute, hang up, errors, teardown on unmount
- [ ] 4.2 Talk drawer: "Talk in the browser" card (Call / Mute / Hang up, timer, secure-context notice) above "Call this number"
- [ ] 4.3 Vitest for the drawer states with sip.js mocked; `tsc --noEmit` clean

## 5. Verification and docs

- [ ] 5.1 Live check on the dev stack (own project name and ports): a browser (or sip.js) call reaches the hosted Autopilot
- [ ] 5.2 `docs/try-the-new-platform.md`: talking from the browser, the localhost/secure-context limitation
- [ ] 5.3 Full suite, dashboard vitest + tsc, lint/format touched files
