## ADDED Requirements

### Requirement: Lightweight, endpoint-configurable client

Fonoster SHALL publish an Identity client package that targets a configurable Identity gRPC endpoint
and depends only on the gRPC runtime — it SHALL NOT pull Prisma, the Identity server, or any
telephony runtime.

#### Scenario: Client targets an arbitrary endpoint

- **WHEN** the client is constructed with an endpoint and credentials
- **THEN** it issues Identity gRPC calls against that endpoint
- **AND** the same code works whether the endpoint is a local container or a remote deployment

#### Scenario: Installing the client stays lightweight

- **WHEN** a consumer installs the Identity client package
- **THEN** the install does not bring in Prisma, the Identity server, or telephony dependencies

### Requirement: Full Identity surface coverage from a single proto source

The client SHALL expose typed wrappers for the entire `fonoster.identity.v1beta2.Identity` surface
(users, workspaces including rename, members and invitations, API keys, credential/refresh/OAuth2/
API-key exchanges, verification, password reset, and `GetPublicKey`). The client SHALL be generated
from the canonical proto owned by `mods/identity` and SHALL NOT vendor a copy.

#### Scenario: Wrappers cover the Identity methods

- **WHEN** the client is inspected
- **THEN** it provides typed methods for each Identity gRPC method

#### Scenario: Stubs are generated from the canonical proto

- **WHEN** the client package is built
- **THEN** its stubs are generated from `mods/identity`'s proto
- **AND** no proto file is vendored into the client or its consumers

### Requirement: Per-request token forwarding

The client SHALL support supplying the caller's access token and active `accessKeyId` per call,
forwarded as gRPC metadata, so a server can act on behalf of different callers using one client
instance. A configured-token convenience MAY be provided for single-principal use.

#### Scenario: A server forwards different callers' tokens

- **WHEN** a server issues two calls through one client instance with different `{ token, accessKeyId }`
- **THEN** each call carries its own token and `accessKeyId` as gRPC metadata
- **AND** no re-instantiation of the client is required between callers
