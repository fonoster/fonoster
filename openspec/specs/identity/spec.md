# identity Specification

## Purpose

Fonoster Identity is the cornerstone for user management, authentication, and authorization across
Fonoster products. It manages users and workspaces, issues and verifies RS256 JWTs (id/access/refresh),
and enforces role-based access control over the `fonoster.identity.v1beta2.Identity` gRPC surface.

This spec was seeded from `mods/identity/README.md` to capture the current, established behavior.

## Requirements

### Requirement: Users, workspaces, and resource ownership

Identity SHALL manage `User` and `Workspace` entities. A user MAY belong to multiple workspaces.
Every resource SHALL have an owner — a user or a workspace — identified by an `accessKeyId`. The
prefix of an `accessKeyId` SHALL indicate the owner type: `US` for a user and `WO` for a workspace.
A resource created within a workspace SHALL be tagged with that workspace's `accessKeyId`.

#### Scenario: Creator owns the workspace

- **WHEN** a user creates a workspace
- **THEN** the workspace is owned by that user
- **AND** the user can belong to other workspaces as well

#### Scenario: accessKeyId prefix identifies the owner type

- **WHEN** an `accessKeyId` is inspected
- **THEN** a `US` prefix denotes a user owner and a `WO` prefix denotes a workspace owner

### Requirement: Role-based access control

Identity SHALL enforce role-based access control. A role SHALL be described by a set of allowed
actions, where each action is the path of an individual gRPC method
(e.g. `/fonoster.identity.v1beta2.Identity/GetUser`). Predefined roles (e.g. owner, admin, member)
SHALL be available, and custom roles MAY be defined. Access SHALL follow the principle of least
privilege.

#### Scenario: A role permits only its listed methods

- **WHEN** a caller bearing a role invokes a gRPC method listed in that role's access set
- **THEN** the call is permitted

#### Scenario: A method outside the role is denied

- **WHEN** a caller invokes a gRPC method not listed in their role's access set
- **THEN** the call is rejected as not authorized

### Requirement: Id, access, and refresh tokens

Upon successful authentication Identity SHALL issue three JSON Web Tokens: an **id** token (identity
claims about the user), a short-lived **access** token, and a longer-lived **refresh** token. The
access token SHALL carry the caller's `accessKeyId` and an `access` claim listing the workspaces the
caller may act in together with their role in each. All tokens SHALL carry a single issuer (`iss`)
and audience (`aud`) per Identity instance, plus `sub`, `tokenUse`, `iat`, and `exp`.

#### Scenario: Authentication issues the three tokens

- **WHEN** a principal authenticates successfully
- **THEN** an id token, an access token, and a refresh token are issued

#### Scenario: Access token carries workspace roles

- **WHEN** an access token is inspected
- **THEN** it contains the caller's `accessKeyId`
- **AND** an `access` array of `{ accessKeyId, role }` for each workspace the caller belongs to

### Requirement: Token exchanges

Identity SHALL provide mechanisms to obtain an access/refresh token pair via: username and password
credentials; credentials plus a time-based MFA code when MFA is enforced; an OAuth2 authorization
code from an external provider; an existing refresh token; and an API key.

#### Scenario: Credentials are exchanged for tokens

- **WHEN** a user supplies a valid username and password
- **THEN** an access token and a refresh token are issued

#### Scenario: MFA is required when enforced

- **WHEN** MFA is enforced and a user supplies valid credentials without a valid MFA code
- **THEN** the exchange is rejected until a valid time-based MFA code is provided

#### Scenario: A refresh token is exchanged for a new pair

- **WHEN** a valid refresh token is presented
- **THEN** a new access token and refresh token are issued

### Requirement: Refresh-token rotation policy

Refresh tokens SHALL be time-based and expire after a configurable lifetime. Identity SHALL provide
a mechanism to invalidate existing refresh tokens to handle scenarios such as compromised devices or
accounts.

#### Scenario: Refresh token expires

- **WHEN** a refresh token is presented after its configured lifetime
- **THEN** the exchange is rejected and re-authentication is required

### Requirement: Token verification via public key

Identity SHALL sign JWTs with RS256 and SHALL expose the verification public key through the
`fonoster.identity.v1beta2.Identity.GetPublicKey` gRPC method. Verification SHALL confirm the token
signature and validate claims including issuer, audience, and expiration.

#### Scenario: A consumer verifies a token offline

- **WHEN** a consumer fetches the public key via `GetPublicKey` and validates a token
- **THEN** a token with a valid signature and valid issuer, audience, and expiry is accepted
- **AND** a token failing signature or claim validation is rejected

### Requirement: Security practices

Identity SHALL require encrypted transport (HTTPS/TLS) for all communications, grant tokens the
minimum permissions necessary (least privilege), and log authentication events and token activity for
auditing.

#### Scenario: Transport is encrypted

- **WHEN** a client communicates with Identity
- **THEN** the communication occurs over an encrypted (TLS) channel
