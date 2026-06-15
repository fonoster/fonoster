## 1. Realm configuration (static file)

- [ ] 1.1 Define the realm config shape: instance-level settings (database, encryption key, port) plus a `realms` array
- [ ] 1.2 Each realm carries `ref`, `name`, issuer, audience, an RS256 key pair (paths), token expirations, security flags (contact verification / 2FA), invite URL + fail URL, SMTP sender, optional OAuth2
- [ ] 1.3 Validate `realmRef` against configured realms; fail fast on an unknown realm

## 2. Realm-scoped, siloed data

- [ ] 2.1 Add `realmRef` to `users` with `@@unique([realmRef, email])`
- [ ] 2.2 Add `realmRef` to `workspaces`, invitations, `api_keys`, and `verification_codes`
- [ ] 2.3 Scope all reads/writes by realm so one realm never sees another's data

## 3. Per-realm keys and tokens

- [ ] 3.1 Sign each realm's tokens with that realm's RS256 private key; carry the realm via the audience and a `realm` claim
- [ ] 3.2 `GetPublicKey` accepts a realm and returns that realm's public key
- [ ] 3.3 Verification validates the realm audience/claim; a token for realm A fails for realm B

## 4. Realm resolution

- [ ] 4.1 Resolve the target realm for sign-up, exchanges, and workspace operations (calling service credentials, requested audience, or explicit realm id)
- [ ] 4.2 Per-realm branding on outbound email (invite URL, SMTP sender)

## 5. Migration

- [ ] 5.1 Configure a default realm and assign all existing users, workspaces, api keys, and verification codes to it
- [ ] 5.2 Backfill `realmRef` and the per-realm uniqueness without downtime

## 6. Verification

- [ ] 6.1 Two realms on one database/instance: a user and workspace in realm A are invisible to realm B
- [ ] 6.2 A token minted for realm A fails verification for realm B (different key and audience)
- [ ] 6.3 The same email signs up independently in two realms (siloed pools)
- [ ] 6.4 Existing single-realm deployments keep working after migration (default realm)
