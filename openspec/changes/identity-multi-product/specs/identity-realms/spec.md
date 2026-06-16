## ADDED Requirements

### Requirement: Realm configuration

The Identity service SHALL read its realms from configuration. Each realm SHALL define a `ref`, a
`name`, an issuer, an audience, an RS256 key pair, token expirations, security flags (contact
verification, 2FA), invite and invite-failure URLs, and an SMTP sender, optionally OAuth2 providers.
Identity SHALL use a realm's configuration when issuing and signing tokens and when sending outbound
mail for that realm, and SHALL reject any `realmRef` that is not a configured realm.

#### Scenario: A configured realm is usable

- **WHEN** the service starts with a realm defined in its configuration
- **THEN** users, workspaces, and tokens can be scoped to that realm
- **AND** the realm's issuer, audience, keys, and branding are applied

#### Scenario: An unknown realm is rejected

- **WHEN** an operation references a `realmRef` that is not configured
- **THEN** the request is rejected with a clear error

#### Scenario: Per-realm branding on outbound mail

- **WHEN** Identity sends an invitation or verification email for a realm
- **THEN** it uses that realm's SMTP sender and invite URL

### Requirement: Default realm for existing data

Migrating an existing single-realm deployment SHALL assign all pre-existing users, workspaces, API
keys, and verification codes to a configured default realm, with no behavior change for that
deployment.

#### Scenario: Existing deployment keeps working

- **WHEN** an existing Identity database is migrated to the multi-realm model
- **THEN** all existing records are assigned to the configured default realm
- **AND** existing sign-in and workspace operations continue to work unchanged
