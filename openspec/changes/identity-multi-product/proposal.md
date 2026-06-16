## Why

Running one Identity service across multiple products (Fonoster itself, QCobro, …) on a **shared
database** is attractive for shared infrastructure. But Identity has no concept of an isolation
boundary today: `User.email` is globally unique, `Workspace` has no association to any product, and
there is a single issuer/audience and a single signing key per instance. So a shared database right
now means users and workspaces from different products are intermixed with no isolation.

To host multiple products on one Identity instance and one database, Identity needs a first-class
**Realm** — an isolated identity domain that holds its own users, workspaces, configuration, and
signing keys (the term used by Keycloak/Kerberos; chosen over "tenant" to avoid colliding with
Fonoster's existing `Workspace`).

## What Changes

- **Introduce Realms.** A realm is an isolated identity domain. Realms are defined in the Identity
  service's **configuration file** (no runtime registry for now). Each realm has a `ref`, a `name`,
  and its own configuration: issuer, audience, an **RS256 key pair**, token expirations, security
  flags, invite URLs, and SMTP sender.
- **Siloed users.** `email` is unique **per realm** (`@@unique([realmRef, email])`); each realm has
  its own user pool. The same email may register independently in different realms.
- **Realm-scoped tenant data.** `Workspace`, invitations, `ApiKey`, and `VerificationCode` carry a
  `realmRef`, isolating each realm's data within the shared database.
- **Per-realm signing keys.** Each realm signs its tokens with its own RS256 key. Tokens carry the
  realm via the audience and a `realm` claim, and `GetPublicKey` takes a realm and returns that
  realm's public key — so a token minted for one realm is cryptographically and semantically invalid
  for another.
- **Realm resolution.** Sign-up, token exchange, and workspace operations resolve a target realm
  (from the calling service's credentials, the requested audience, or an explicit realm identifier).
- **Migration.** Existing users and workspaces are assigned to a configured **default realm**, so
  current single-product deployments are unaffected.

## Capabilities

### New Capabilities

- `identity-realms`: Realm definitions and per-realm configuration (issuer/audience, RS256 keys,
  branding) supplied via the Identity service configuration file, plus the default-realm migration.

### Modified Capabilities

- `identity`: Users and tenant data (workspaces, invitations, API keys, verification) are scoped to a
  realm with siloed user pools; tokens carry realm context and are signed by per-realm RS256 keys;
  operations resolve a realm.

## Impact

- **Schema:** `realmRef` on `users` (with `@@unique([realmRef, email])`), `workspaces`, invitations,
  `api_keys`, and `verification_codes`; a data migration into a default realm. No realms table —
  realms are configuration; `realmRef` is a string validated against the configured realms.
- **Tokens/keys:** a per-realm RS256 key pair; per-realm audience + a `realm` claim; `GetPublicKey`
  gains a realm argument.
- **Config:** instance-level settings (database, encryption key, port) plus a `realms` array in the
  service config; consumers configure their realm + endpoint and fetch the realm's public key.
- **Out of scope:** the standalone service and client packaging (separate changes); a runtime realm
  registry / admin API (realms are static config for now); cross-realm workspace sharing; per-realm
  billing/quotas.
