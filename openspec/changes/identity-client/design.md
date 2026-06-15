# Design notes

## Why a separate package (and why that's consistent with Gap A)

The guiding rule across both changes is *dependency hygiene*, applied to each artifact:

- **Standalone service** shares the library's heavy deps (Prisma, encryption, the handlers), so it
  folds into `mods/identity` as a subpath/bin — a new package would add nothing.
- **Client** must pull *none* of that. A consumer importing a client should not install Prisma, the
  field-encryption stack, or any server runtime. That isolation is only achievable as a separate,
  minimal package. So `mods/identity-client` is its own package by design, not inconsistency.

## Relationship to `@fonoster/sdk`

`@fonoster/sdk` stays as-is for end-user apps: it is stateful (one `accessKeyId` + token refresher),
points at a single Fonoster `apiserver`, and bundles all product clients. `@fonoster/identity-client`
is the complement: identity-only, stateless, endpoint-configurable, and built for **server-to-server
token forwarding**. The SDK could later delegate its identity calls to this client, but that
refactor is out of scope.

## Auth model: per-request forwarding

The key capability QCobro needs is to act *on behalf of the calling end user*. Rather than holding a
principal, each method accepts `{ token, accessKeyId }` and sets them as gRPC metadata for that call.
A server can therefore reuse one `Client` instance to make calls for many different callers. A
configured-token convenience (set once, reused) is provided for simple single-principal scripts.

## Proto is owned upstream

The Identity proto lives in `mods/identity`. The client *generates* from it at build time; it is
never vendored by `identity-client` or by external consumers. This closes the drift that forced
QCobro to copy the proto in the first place.

## Reference implementation

QCobro's `mods/apiserver/src/identity/client.ts` is a working example of exactly this thin,
token-forwarding wrapper (it forwards the caller token + `accessKeyId` as metadata). It is the
proof of concept; this change lands a maintained, generated version upstream.
