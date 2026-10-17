## Why

`@fonoster/identity-client` shipped and the gateway uses it (`identity-client`, archived
2026-10-17), but it does not cover the whole Identity surface yet, and it has no single-principal
mode.

## What Changes

- Wrap `ExchangeVerificationCode` and `RevokeToken`.
- Add a configured-token mode: a client created with a token and `accessKeyId` uses them when a
  call passes none.
- Optionally generate typed stubs from the proto instead of loading it at run time with
  `@grpc/proto-loader`.

## Capabilities

### Modified Capabilities

- `identity-client`: the entire Identity surface; a configured-token mode.

## Impact

- `mods/identity-client` only. Its tests are tracked in `harden-conformance`.
