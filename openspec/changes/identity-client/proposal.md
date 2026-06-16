## Why

Even with a standalone Identity service (see `identity-standalone-service`), a product still has to
*talk* to it. Today the only options are both poor:

- **Vendor the proto and generate your own stubs** — what QCobro does. Duplicated, drifts from upstream.
- **Use `@fonoster/sdk`** — but it bundles *every* telephony client (Agents/Calls/Trunks/Domains/…),
  assumes a single Fonoster `apiserver` endpoint, and is a **stateful single-principal** client
  (holds one `accessKeyId` + a token refresher) designed for an end-user app — not for a **server
  forwarding each caller's token**.

Neither lets an external product "just install a client and point it at an Identity endpoint."

## What Changes

- **A lightweight `@fonoster/identity-client` package**: generated gRPC stubs from the canonical
  Identity proto plus thin, **stateless, endpoint-configurable** promise wrappers over the full
  `fonoster.identity.v1beta2` surface. It depends only on `@grpc/grpc-js` (+ the proto runtime) —
  **no Prisma, no server, no telephony**.
- **Per-request auth forwarding**: methods accept the caller's access token and active `accessKeyId`
  and send them as gRPC metadata per call (the server-to-server pattern QCobro needs), alongside a
  simple configured-token convenience mode for single-principal use.
- **Single source for the proto**: the client generates from `mods/identity`'s proto at build time —
  no vendoring anywhere.
- **`@fonoster/sdk` is unchanged** and remains the choice for end-user apps; it MAY later be
  refactored to consume this client, but that is out of scope here.

## Capabilities

### New Capabilities

- `identity-client`: A lightweight, dependency-isolated, endpoint-configurable client for the
  Identity gRPC surface, supporting per-request token/accessKeyId forwarding for server-to-server use.

## Impact

- **A new package IS warranted here — and it's the opposite call from `identity-standalone-service`.**
  There, the runner naturally shares the library's dependencies, so it folds into `mods/identity`.
  Here, the whole point is a client that pulls **none** of the library/server/Prisma weight, so it
  must be its own lightweight package (`mods/identity-client`). Dependency isolation is the reason.
- **Proto ownership** stays in `mods/identity`; the client generates from it (one source).
- **Consumers (QCobro):** delete the vendored proto + generated client; depend on
  `@fonoster/identity-client`; point `endpoint` at any Identity service (local container or remote).
- **Out of scope:** refactoring `@fonoster/sdk`; multi-product identity.
