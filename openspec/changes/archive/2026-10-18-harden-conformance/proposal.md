## Why

The platform, conformance, regions and identity changes shipped and were archived on 2026-10-17,
but several of their test suites were only partly built. Without them the release has no proof of
stateless replicas, replica loss, the bus, telemetry, both deployment targets, regions, or a real
call end to end. This change collects that test work for phase 2 (safety net).

## What Changes

- Platform suites: control plane (cross-replica control, replica loss, least-loaded placement, no
  capacity), bus (registry survival, no audio on NATS), observability (OTLP from every service,
  `fonoster.call_ref` on every call signal), deployment (nightly e2e on Compose and Helm, release
  gate, `.env` ignored, `secret://`), regions (TLS leaf link, data stays in the cell, outage).
- Conformance: measure caller audio to STT in T1, run T2 on ten replicas, add the nightly
  end-to-end caller bot, and give nightly suites dedicated runners.
- Scenarios for private-region enrollment, revocation, relay and status.
- Standalone Identity: start, allow-list and fresh-database tests.
- `@fonoster/identity-client`: end-to-end, dependency-weight and proto-source tests.

## Capabilities

### Modified Capabilities

- `conformance`: adds the end-to-end caller bot and runs it nightly.

## Impact

- `mods/conformance`, `mods/gateway/test`, `mods/apiserver/test`, `mods/identity`,
  `mods/identity-client`, `.github/workflows`.
