# Tasks

## 1. Protocol and SDK
- [x] 1.1 `identity.proto`: `ExchangeVerificationCode{email, code}` → `ExchangeVerificationCodeResponse`
      (tokens); validators in `mods/common`. `capabilities.proto`: `Capabilities/GetCapabilities`
      (apiserver service, typed response)
- [x] 1.2 `ExchangeVerificationCode` on `identityAllowList`
- [x] 1.3 SDK: `client.loginWithVerificationCode(email, code)`, `client.getCapabilities()` (exercised
      live; SDK has no unit-test harness for identity calls)

## 2. Verification codes
- [x] 2.1 Migration: `verification_codes.attempts`, `consumed_at`, index `(type, value)`
- [x] 2.2 `crypto.randomInt`; invalidate earlier codes on send; single use; expiry; 5 attempts
- [x] 2.3 Send limits per email and IP (`utils/rateLimiter.ts`, in-process); same response for unknown emails
- [x] 2.4 Tests: reuse, expiry, attempts, invalidation, rate limit

## 3. Passwords
- [x] 3.1 Migration: `password_hash` nullable, `password_digest` added
- [x] 3.2 `utils/passwords.ts`: `hashPassword`, `verifyPassword` (digest, else legacy constant-time + rehash)
- [x] 3.3 All write paths write the digest only (create, update, reset, invite, owner upsert, GitHub users)
- [x] 3.4 Invites: one-time password or sign-in link; resend issues a new one-time password
- [x] 3.5 `backfillPasswordDigests` at boot (apiserver and standalone Identity, `migratePasswordStorage`); batched, idempotent
- [x] 3.6 Remove password logging
- [x] 3.8 `User.mustChangePassword`: set by invite/resend, cleared on password write, in the id token
- [x] 3.7 Tests: hash/verify, legacy rehash, backfill idempotence

## 4. Methods and flows
- [x] 4.1 Enforce methods in each exchange
- [x] 4.2 `ExchangeVerificationCode` with sign-up policy and pending invites
- [x] 4.3 GitHub: primary verified email via `/user/emails`; sign-up policy on first sign-in
- [x] 4.4 `GetCapabilities` in the apiserver (`src/capabilities`), from `fonoster.yaml`; on its allow-list
- [x] 4.5 Tests: methods on/off, signup invite vs open (identity); capabilities expose no secrets (apiserver)

## 5. Verification
- [x] 5.1 Unit tests pass across modules (485)
- [x] 5.2 Live against the local stack: capabilities, password sign-in after backfill, email code via
      MailHog, wrong/reused code, unknown email under invite-only
- [x] 5.3 Docs: `docs/configuration.md` features.auth section; release notes (DB snapshot, stricter codes)
