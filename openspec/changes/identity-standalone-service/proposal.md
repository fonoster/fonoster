## Why

`@fonoster/identity` is a library (`buildIdentityService`) with no runnable form of its own.
The only thing that runs it is `mods/apiserver`, which couples Identity to the telephony
stack (Asterisk/ARI, NATS, InfluxDB). External products that want to reuse Fonoster Identity
(e.g. QCobro) are forced to hand-wire their own gRPC server around `buildIdentityService`,
vendor the proto, and vendor a copy of the Prisma schema to provision the database — duplicating
work and drifting from upstream.

Shipping Identity as a first-class **standalone service** lets any product run Identity on its
own (or point at a hosted one) with nothing but configuration.

## What Changes

- **Make `mods/identity` runnable.** Add a server entrypoint to the existing `@fonoster/identity`
  package — exposed via a `./server` subpath export and a `serve` bin — that wraps
  `buildIdentityService` into a gRPC server with the same cross-cutting concerns the apiserver
  applies to Identity today: the access-token auth interceptor, the public-method allow-list
  (sign-up, login, exchanges, public key, verification, reset), the accept-invite HTTP bridge,
  optional default-user seeding, and a gRPC health service. The package's main export stays a
  pure library, so existing importers (e.g. `apiserver`) are unaffected. No new package is created.
- **Externalized configuration.** All `IdentityConfig` values (database URL, encryption key,
  RS256 key pair, issuer/audience, token expirations, OAuth2 settings, contact-verification / 2FA
  flags, SMTP) are supplied via environment/file, with fail-fast validation.
- **Owned database provisioning.** The service ships the Prisma schema + migrations and a
  migrate/db-provision entrypoint, so consumers never vendor the schema.
- **A published container image and compose example**, so "point a product at this endpoint and
  it just works" holds for both local/testing and hosted deployments.

## Capabilities

### New Capabilities

- `identity-service`: Running Fonoster Identity as a standalone gRPC service — its server
  bootstrap, auth/allow-list, accept-invite bridge, health, configuration, database provisioning,
  and container packaging.

## Impact

- **Code:** extend `mods/identity` with a runnable server entrypoint (a `./server` subpath export
  + a `serve` bin) so the package stays importable as a pure library; add its Dockerfile and a
  database-provisioning script (the canonical schema already lives in this package). Extract the
  identity allow-list and accept-invite bridge from `mods/apiserver` into a shared/reusable
  location (`mods/identity` or `mods/common`) so the monolith and the standalone runner use one
  source. No new package.
- **Release:** CI to build and publish the image (e.g. `ghcr.io/fonoster/identity`).
- **Docs:** how to run and configure the service.
- **Compatibility:** `mods/apiserver` continues to work unchanged (it may optionally consume the
  extracted helpers). The standalone service exposes the same `fonoster.identity.v1beta2` surface.
- **Out of scope:** a client/SDK package (separate change), multi-product identity (separate
  change), and any change to Identity domain logic.
