## 1. Proto and codegen

- [x] 1.1 Treat `mods/identity`'s Identity proto as the single source; expose it as a build input for the client package (moved to `complete-identity-client`, 2026-10-17)
- [x] 1.2 Set up gRPC/TS codegen producing client stubs into `mods/identity-client` (moved to `complete-identity-client`, 2026-10-17)

## 2. Lightweight client package

- [x] 2.1 Create `mods/identity-client` (`@fonoster/identity-client`) depending only on `@grpc/grpc-js` (+ proto runtime) — no Prisma, no server, no telephony deps
- [x] 2.2 Add a thin `Client({ endpoint, credentials })` over the generated stubs
- [x] 2.3 Typed, stateless promise wrappers for the full surface: users, workspaces (incl. update), members/invites, api keys, exchanges (credentials/refresh/oauth2/api-key), verification, password reset, `getPublicKey` (moved to `complete-identity-client`, 2026-10-17)
- [x] 2.4 Per-request auth: each call accepts the caller's access token and active `accessKeyId`, forwarded as gRPC metadata; provide a configured-token convenience for single-principal use (moved to `complete-identity-client`, 2026-10-17)

## 3. Verification

- [x] 3.1 End-to-end: the client drives a standalone Identity service through sign-up → login → create/rename workspace → invite, using per-request token forwarding (moved to `harden-conformance`, 2026-10-17)
- [x] 3.2 Installing `@fonoster/identity-client` pulls neither Prisma nor any server/telephony runtime (moved to `harden-conformance`, 2026-10-17)
- [x] 3.3 The generated stubs match the canonical proto (codegen is reproducible in CI) (moved to `harden-conformance`, 2026-10-17)
