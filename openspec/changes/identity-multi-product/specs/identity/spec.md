## MODIFIED Requirements

### Requirement: Users, workspaces, and resource ownership

Identity SHALL manage `User` and `Workspace` entities **scoped to a realm**. A user MAY belong to
multiple workspaces **within their realm**. Every resource SHALL have an owner — a user or a
workspace — identified by an `accessKeyId`, with the prefix indicating owner type (`US` for a user,
`WO` for a workspace). `Workspace`, invitations, `ApiKey`, and `VerificationCode` SHALL carry a
`realmRef` identifying the owning realm. The user pool SHALL be siloed per realm: a user's `email`
SHALL be unique within a realm (`@@unique([realmRef, email])`), so the same email MAY register
independently in different realms.

#### Scenario: Workspace belongs to the realm it was created in

- **WHEN** a user in realm R creates a workspace
- **THEN** the workspace carries R's `realmRef`
- **AND** it is not returned when listing workspaces for any other realm

#### Scenario: The same email can exist in two realms

- **WHEN** the same email signs up in realm A and in realm B
- **THEN** two independent users exist, one per realm

#### Scenario: accessKeyId prefix still identifies the owner type

- **WHEN** an `accessKeyId` is inspected
- **THEN** a `US` prefix denotes a user owner and a `WO` prefix denotes a workspace owner

### Requirement: Id, access, and refresh tokens

Upon successful authentication Identity SHALL issue id, access, and refresh JWTs as before, signed
with the **realm's own RS256 key**, and each token SHALL carry **realm context** — the realm's
`audience` and a `realm` claim — so a token issued for one realm is not valid for another. The access
token SHALL still carry the caller's `accessKeyId` and an `access` claim of `{ accessKeyId, role }`
for the workspaces the caller may act in within that realm.

#### Scenario: Token carries realm context and is realm-signed

- **WHEN** a principal authenticates within a realm
- **THEN** the issued tokens are signed by that realm's key
- **AND** they identify the realm via the audience and a `realm` claim

#### Scenario: A token is not valid across realms

- **WHEN** a token minted for realm A is presented to a verifier configured for realm B
- **THEN** verification fails on both the realm audience/claim and the signing key

### Requirement: Token verification via public key

Identity SHALL sign JWTs with RS256 using **per-realm keys** and SHALL expose the verification public
key for a given realm through `GetPublicKey`, which SHALL accept a realm and return that realm's
public key. Verification SHALL confirm the token signature against the realm's key and validate the
issuer, audience, and expiration.

#### Scenario: A consumer verifies a realm's token

- **WHEN** a consumer fetches a realm's public key via `GetPublicKey(realm)` and validates a token for that realm
- **THEN** a token with a valid signature and valid issuer, audience, and expiry is accepted
- **AND** a token signed by a different realm's key is rejected

## ADDED Requirements

### Requirement: Realm isolation

On a shared database, one realm SHALL NOT be able to read or modify another realm's users,
workspaces, members, API keys, or verification codes.

#### Scenario: Listing is realm-scoped

- **WHEN** a caller in realm A lists workspaces or members
- **THEN** only realm A's records are returned

#### Scenario: Cross-realm access is denied

- **WHEN** a caller in realm A references a resource belonging to realm B
- **THEN** the request is rejected as not found or not authorized

### Requirement: Realm resolution on operations

Every sign-up, token exchange, and workspace operation SHALL resolve a target realm — from the
calling service's credentials, the requested audience, or an explicit realm identifier — and act only
within that realm.

#### Scenario: Operations without a resolvable realm are rejected

- **WHEN** a realm-scoped operation is invoked with no resolvable realm
- **THEN** the request is rejected with a clear error
