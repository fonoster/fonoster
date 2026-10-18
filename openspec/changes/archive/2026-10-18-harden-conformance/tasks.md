## 1. Platform suites (from add-platform 1.1–1.5)

- [x] 1.1 Control plane: stateless replicas, cross-replica call control, replica loss, least-loaded placement, no-capacity error (`mods/apiserver/test/outbound/controlPlane.test.ts`; cross-replica control is TrackCall, since the management API has no hangup; the at-limit case landed with fix-config-and-placement-gaps: `no capacity: with every node draining, gone or at its limit`)
- [x] 1.2 Bus: registry survival and no audio on NATS (queue-group single claim and NATS permissions are already covered) (registry: `controlPlane.test.ts`; no audio: `mods/gateway/test/gonode.test.ts`)
- [x] 1.3 Observability: OTLP from every service, `fonoster.call_ref` on every call signal, default profile end to end (gateway and media node on one real call: `mods/gateway/test/observability.test.ts`; apiserver: `mods/apiserver/test/core/telemetryInterceptor.test.ts`, with apiserver OTLP logs and call-ref spans still pending tests (gaps in the apiserver, not in this suite); the Compose default profile is not testable because the bundle has no observability profile, see the spec mismatch in the PR; Helm's profile is checked by `deployment.test.ts`)
- [x] 1.4 Deployment: nightly e2e on Compose and Helm, release gate, `.env` ignored, `secret://` resolution (`mods/conformance/test/deploymentRules.test.ts`: release gate, nothing published on merge, nightly Compose install and Helm lint/render, .env ignored outside development (the development case landed with fix-config-and-placement-gaps: `ignores a .env in development too`), secret:// env/file/k8s through the gateway loader; `mods/conformance/test/medianode-secrets.test.ts`: the started Go node; chart configs with mounted Secrets stay in `deployment.test.ts`)
- [x] 1.5 Regions: cell registration with token, outbound-only leaf link with TLS, data and keys stay in the cell, control-plane outage behavior (`mods/conformance/test/regions.test.ts`: the real control plane, a real region hub and a real cell over a TLS leaf link. "Only index fields cross" is covered by `crosses exactly the call index metadata for a sealed call and nothing of its content`, after the regions spec listed the index metadata)

## 2. Conformance (from add-conformance-framework)

- [x] 2.1 T1: measure caller audio to STT (speak-to-first-audio and clear are measured)
  (scenario `caller-audio-to-stt` + measurement `stt.caller_audio_lag_ms`: first audible caller packet
  sent by the fake node → first audible frame at the fake STT; nightly in the T1 suite at 200 runs;
  locally p50 0 ms, p95 1 ms over 30 runs)
- 2.2 T2: ten replicas at 1,000 calls. Moved to `openspec/rc-checklist.md` ("Load and runners"),
  owner-deferred: it needs a dedicated runner (2.4). What shipped: `scale.ts --replicas N` and a
  nightly 2 × 200 profile, report only.
- [x] 2.3 Nightly end-to-end call through Routr to an Autopilot app with a sealed call record
  (`ops/rebuild/stack e2e` + `ops/rebuild/e2e.cjs`, job "end-to-end call (nightly)" in
  stack-smoke.yaml: greeting heard, one turn (caller speaks, agent replies), hang-up, record indexed
  as completed and its JWS verified against the region's records key)
- 2.4 Dedicated runners for the nightly end-to-end and load suites. Moved to
  `openspec/rc-checklist.md` ("Load and runners"), owner-deferred until there is budget. What
  shipped: the `load-full` job in conformance.yaml, off until the repository variable `LOAD_RUNNER`
  names a runner.

## 3. Private regions (from add-private-regions 1.3)

- [x] 3.1 Conformance scenarios for enrollment, revocation, relay and status (`scenarios/regions`, contract `regions`, role `region-cell`, run by `mods/conformance/test/regionsScenarios.test.ts`. "Offline after missed heartbeats" is not a scenario: it needs 2 minutes of silence)

## 4. Standalone Identity (from identity-standalone-service 6.1–6.3)

- [x] 4.1 The service starts, serves `fonoster.identity.v1beta2` on the configured port and reports healthy
- [x] 4.2 Allow-listed methods work without a token; other methods require a valid access token
- [x] 4.3 A fresh database is provisioned by the entrypoint, and sign-up → login → create-workspace succeeds

## 5. Identity client (from identity-client 3.1–3.3)

- [x] 5.1 End-to-end: the client drives a standalone Identity service through sign-up → login → create/rename workspace → invite with per-request tokens
- [x] 5.2 Installing `@fonoster/identity-client` pulls neither Prisma nor any server or telephony runtime
- [x] 5.3 The client's proto matches `mods/common`'s canonical `identity.proto` in CI
