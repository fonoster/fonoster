## 1. Platform suites (from add-platform 1.1–1.5)

- [ ] 1.1 Control plane: stateless replicas, cross-replica call control, replica loss, least-loaded placement, no-capacity error
- [ ] 1.2 Bus: registry survival and no audio on NATS (queue-group single claim and NATS permissions are already covered)
- [ ] 1.3 Observability: OTLP from every service, `fonoster.call_ref` on every call signal, default profile end to end
- [ ] 1.4 Deployment: nightly e2e on Compose and Helm, release gate, `.env` ignored, `secret://` resolution
- [ ] 1.5 Regions: cell registration with token, outbound-only leaf link with TLS, data and keys stay in the cell, control-plane outage behavior

## 2. Conformance (from add-conformance-framework)

- [ ] 2.1 T1: measure caller audio to STT (speak-to-first-audio and clear are measured)
- [ ] 2.2 T2: ten replicas at 1,000 calls (one process is measured)
- [ ] 2.3 Nightly end-to-end call through Routr to an Autopilot app with a sealed call record
- [ ] 2.4 Dedicated runners for the nightly end-to-end and load suites

## 3. Private regions (from add-private-regions 1.3)

- [ ] 3.1 Conformance scenarios for enrollment, revocation, relay and status (behavior is unit-tested)

## 4. Standalone Identity (from identity-standalone-service 6.1–6.3)

- [x] 4.1 The service starts, serves `fonoster.identity.v1beta2` on the configured port and reports healthy
- [x] 4.2 Allow-listed methods work without a token; other methods require a valid access token
- [x] 4.3 A fresh database is provisioned by the entrypoint, and sign-up → login → create-workspace succeeds

## 5. Identity client (from identity-client 3.1–3.3)

- [x] 5.1 End-to-end: the client drives a standalone Identity service through sign-up → login → create/rename workspace → invite with per-request tokens
- [x] 5.2 Installing `@fonoster/identity-client` pulls neither Prisma nor any server or telephony runtime
- [x] 5.3 The client's proto matches `mods/common`'s canonical `identity.proto` in CI
