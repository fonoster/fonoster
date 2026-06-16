# Project: Fonoster

Fonoster is an open-source, programmable telephony platform (MIT). It is a TypeScript
monorepo (`mods/*`) whose services are composed into a single gRPC `apiserver`
alongside voice/telephony infrastructure (Asterisk/ARI, NATS, InfluxDB).

## Relevant modules

- `mods/identity` — `@fonoster/identity`: a **library** exporting `buildIdentityService(config)`
  (gRPC service definition + handlers), the canonical Prisma `schema.prisma`, and helpers
  (`upsertDefaultUser`). Entities: User, Workspace, WorkspaceMember, ApiKey, VerificationCode.
  RS256 JWTs (id/access/refresh) with a single issuer/audience per instance.
- `mods/apiserver` — composes identity + voice services into one gRPC server with an auth
  interceptor, a public-method allow-list, an accept-invite HTTP bridge, and default seeding.
  Coupled to telephony infra (NATS/InfluxDB/Asterisk).
- `mods/sdk` — `@fonoster/sdk`: client SDK with `Users`/`Workspaces`/`ApiKeys` wrappers over
  generated gRPC stubs, targeting a single Fonoster `apiserver` endpoint; stateful single-principal
  (accessKeyId + token refresher).
- `mods/common` — `createServiceDefinition`, auth interceptor, proto loading.

## Context for these changes

External products (e.g. QCobro, an AI-voice collections app) want to **reuse Fonoster
Identity** without running the telephony monolith. Today they must hand-wire their own
gRPC server around `buildIdentityService`, vendor the proto + generate a client, and vendor
the Prisma schema. These OpenSpec changes aim to make Identity consumable as (a) a standalone
service, (b) a client package, and (c) a multi-product identity store.

## Conventions

- TypeScript, ESM, gRPC (`@grpc/grpc-js`), Prisma (PostgreSQL), MIT-licensed headers.
- Spec deltas follow OpenSpec format: `## ADDED/MODIFIED Requirements`, `### Requirement: …`,
  `#### Scenario: …` with WHEN/THEN/AND.
