## MODIFIED Requirements

### Requirement: Identity surface coverage from a single proto source

The client SHALL expose typed wrappers for the entire `fonoster.identity.v1beta2.Identity` surface
(users, workspaces including rename, members and invitations, API keys, credential/refresh/OAuth2/
API-key/verification-code exchanges, verification, password reset, token revocation, and
`GetPublicKey`). The client SHALL load the canonical Identity proto from
`@fonoster/common` (`mods/common/src/protos/identity.proto`), copied in at build time and loaded at
run time with `@grpc/proto-loader`, and SHALL NOT commit a vendored copy.

#### Scenario: Wrappers cover the Identity methods

- **WHEN** the client is inspected
- **THEN** it provides typed methods for each Identity gRPC method, including `ExchangeVerificationCode` and `RevokeToken`

#### Scenario: The proto comes from the canonical source

- **WHEN** the client package is built
- **THEN** its proto is copied from `@fonoster/common`'s `identity.proto`
- **AND** no proto file is committed into the client or its consumers

### Requirement: Per-request token forwarding

The client SHALL support supplying the caller's access token and active `accessKeyId` per call,
forwarded as gRPC metadata, so a server can act on behalf of different callers using one client
instance. The client SHALL also offer a configured-token mode for single-principal use.

#### Scenario: A server forwards different callers' tokens

- **WHEN** a server issues two calls through one client instance with different `{ token, accessKeyId }`
- **THEN** each call carries its own token and `accessKeyId` as gRPC metadata
- **AND** no re-instantiation of the client is required between callers

#### Scenario: Single principal with a configured token

- **WHEN** the client is created with a token and `accessKeyId` and a call passes none
- **THEN** the call carries the configured token and `accessKeyId` as gRPC metadata
