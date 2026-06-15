# Design notes

## Decisions (locked)

- **Naming: Realm.** An isolated identity domain (Keycloak/Kerberos vocabulary), chosen over
  "tenant" to avoid colliding with Fonoster's existing `Workspace`.
- **Users: siloed.** `realmRef` on `User` with `@@unique([realmRef, email])`. Each realm has its own
  user pool; the same email may exist independently in two realms; no cross-realm leakage.
- **Keys: per-realm.** Each realm has its own RS256 key pair. `GetPublicKey(realm)` returns that
  realm's public key; a compromise is contained to one realm. This is what "separate identity
  provider per product" means.
- **Realm storage: static configuration file.** Realms are enumerated in the Identity service config
  (adding a realm is a config change + redeploy). A runtime registry/admin API is intentionally
  deferred; `realmRef` is a string validated against the configured realms, so introducing a registry
  later does not change the data model.

## Configuration shape

Instance-level settings are shared; everything identity-facing is per realm.

```jsonc
// Identity SERVICE config
{
  "database": { "url": "postgresql://…/identity" },
  "encryptionKey": "k1.aesgcm256.…",        // field-encryption at rest, instance-wide
  "server": { "port": 50051 },
  "realms": [
    {
      "ref": "qcobro",
      "name": "QCobro",
      "issuer": "https://identity.qcobro.com",
      "audience": "qcobro",
      "keys": {                              // per-realm RS256 key pair
        "privateKeyPath": "/etc/identity/realms/qcobro/private.pem",
        "publicKeyPath":  "/etc/identity/realms/qcobro/public.pem"
      },
      "tokens":   { "accessTokenExpiresIn": "15m", "refreshTokenExpiresIn": "30d", "idTokenExpiresIn": "15m" },
      "security": { "contactVerificationRequired": true, "twoFactorAuthenticationRequired": false },
      "invite":   { "url": "https://app.qcobro.com/accept-invite", "failUrl": "…", "expiration": "2d" },
      "smtp":     { "host": "…", "port": 587, "secure": true, "sender": "QCobro <no-reply@qcobro.com>", "auth": { "user": "apikey", "pass": "…" } }
      // "oauth2": { … optional per-realm providers … }
    }
    // … additional realms (e.g. "fonoster") …
  ]
}
```

A consumer holds almost nothing — just its realm and the endpoint; it fetches the realm's public key
at runtime:

```jsonc
{ "identity": { "endpoint": "identity.internal:50051", "realm": "qcobro" } }
// public key via GetPublicKey(realm)
```

## Realm resolution

Operations must know which realm they act in. Sources, in preference order: (1) the calling service
authenticates as a realm (a realm credential / mTLS identity); (2) the requested audience selects the
realm; (3) an explicit `realm` argument on sign-up / exchange / workspace-create.

## Migration

A non-destructive migration creates a **default realm** (named in config) and assigns all existing
users, workspaces, api keys, and verification codes to it, then backfills the per-realm uniqueness.
Single-realm deployments keep working unchanged.

## Relationship to the baseline

This change MODIFIES the seeded `identity` capability (`openspec/specs/identity/spec.md`): the entity
model gains a realm dimension with siloed users, and the token model gains per-realm keys and realm
context. It composes naturally with the standalone-service and client changes (a hosted multi-realm
Identity that consumers reach via the client) but does not depend on them.
