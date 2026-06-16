## 1. Proto and codegen

- [ ] 1.1 Treat `mods/identity`'s Identity proto as the single source; expose it as a build input for the client package
- [ ] 1.2 Set up gRPC/TS codegen producing client stubs into `mods/identity-client`

## 2. Lightweight client package

- [ ] 2.1 Create `mods/identity-client` (`@fonoster/identity-client`) depending only on `@grpc/grpc-js` (+ proto runtime) — no Prisma, no server, no telephony deps
- [ ] 2.2 Add a thin `Client({ endpoint, credentials })` over the generated stubs
- [ ] 2.3 Typed, stateless promise wrappers for the full surface: users, workspaces (incl. update), members/invites, api keys, exchanges (credentials/refresh/oauth2/api-key), verification, password reset, `getPublicKey`
- [ ] 2.4 Per-request auth: each call accepts the caller's access token and active `accessKeyId`, forwarded as gRPC metadata; provide a configured-token convenience for single-principal use

## 3. Verification

- [ ] 3.1 End-to-end: the client drives a standalone Identity service through sign-up → login → create/rename workspace → invite, using per-request token forwarding
- [ ] 3.2 Installing `@fonoster/identity-client` pulls neither Prisma nor any server/telephony runtime
- [ ] 3.3 The generated stubs match the canonical proto (codegen is reproducible in CI)
