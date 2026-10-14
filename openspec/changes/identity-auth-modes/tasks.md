# Tasks

## 1. Protocol and SDK
- [ ] 1.1 `identity.proto`: `ExchangeVerificationCode{email, code}` → `ExchangeVerificationCodeResponse`
      (tokens), `GetCapabilities(Empty)` → `GetCapabilitiesResponse`; validators in `mods/common`
- [ ] 1.2 Both on `identityAllowList`
- [ ] 1.3 SDK: `client.loginWithVerificationCode(email, code)`, `client.getCapabilities()`; tests

## 2. Verification codes
- [ ] 2.1 Migration: `verification_codes.attempts`, `consumed_at`, index `(type, value)`
- [ ] 2.2 `crypto.randomInt`; invalidate earlier codes on send; single use; expiry; 5 attempts
- [ ] 2.3 Send limits per email and IP (`utils/rateLimiter.ts`, in-process); same response for unknown emails
- [ ] 2.4 Tests: reuse, expiry, attempts, invalidation, rate limit

## 3. Passwords
- [ ] 3.1 Migration: `password_hash` nullable, `password_digest` added
- [ ] 3.2 `utils/passwords.ts`: `hashPassword`, `verifyPassword` (digest, else legacy constant-time + rehash)
- [ ] 3.3 All write paths write the digest only (create, update, reset, invite, owner upsert, GitHub users)
- [ ] 3.4 Invites: one-time password or sign-in link; resend issues a new one-time password
- [ ] 3.5 `backfillPasswordDigests` in the apiserver seed and `db-provision`; batched, idempotent
- [ ] 3.6 Remove password logging
- [ ] 3.7 Tests: hash/verify, legacy rehash, backfill idempotence

## 4. Methods and flows
- [ ] 4.1 Enforce methods in each exchange
- [ ] 4.2 `ExchangeVerificationCode` with sign-up policy and pending invites
- [ ] 4.3 GitHub: primary verified email via `/user/emails`; sign-up policy on first sign-in
- [ ] 4.4 `GetCapabilities` with host-provided product flags; apiserver passes billing/costs/domain/appUrl
- [ ] 4.5 Tests per factory: methods on/off, signup invite vs open, capabilities expose no secrets

## 5. Verification
- [ ] 5.1 Unit tests pass across modules
- [ ] 5.2 Live: Community sign-in (password) and email-code sign-in via MailHog against the local stack
- [ ] 5.3 Docs: `docs/configuration.md` features.auth section; release notes (DB snapshot, stricter codes)
