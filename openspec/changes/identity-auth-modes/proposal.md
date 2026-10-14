## Why

The redesigned dashboard signs people in differently per deployment: Fonoster Cloud uses GitHub
and passwordless email codes, while self-hosted Community installs use email and password. Today
Identity only knows passwords and GitHub, and the dashboard guesses the edition from build-time
variables. Identity also has weaknesses that passwordless sign-in would make worse:

- Verification codes come from `Math.random`, stay valid past their expiry (only codes older than
  twice the lifetime are purged), are never consumed, and allow unlimited guesses.
- Passwords are stored with reversible encryption, and "resend invite" emails the stored password.
- Reset-password and update-user handlers log passwords.
- `features.auth` (added in `unified-service-config`) is parsed but not enforced.

## What Changes

- **`GetCapabilities`** (public RPC): what this deployment supports, without secrets: sign-in
  methods, sign-up policy, GitHub client id and authorize URL, and product flags the host passes in
  (billing, cost display). The dashboard renders from it instead of build-time variables.
- **`ExchangeVerificationCode`** (public RPC): trades an emailed 6-digit code for tokens. Creates
  the user on first sign-in when sign-up is open or an invite is pending. Requires `email_code`.
- **Method enforcement:** credentials exchange requires `password`; GitHub exchanges require
  `github`; GitHub sign-in uses the primary verified email (`/user/emails`) and creates users only
  when sign-up allows it.
- **Code hardening:** codes from `crypto.randomInt`, single use, expired codes rejected, at most 5
  attempts, prior codes invalidated when a new one is sent, per-email and per-IP send limits, and the
  same response for unknown emails.
- **Password hashing:** `scrypt` digests in a new `password_digest` column; the encrypted column
  becomes nullable and is cleared as users sign in (lazy rehash) or by an idempotent backfill. Invites
  no longer re-send stored passwords. No password is logged.
- **Forced password change for invitees:** users created by an invite get `mustChangePassword`; it is
  returned in the id token and cleared when they set a password, so the dashboard can require it.
- **SDK:** `client.loginWithVerificationCode()` and `client.getCapabilities()`.

All RPC changes are additive. The only file-shape promise for standalone Identity (fields at the
root of `identity.json`) is unchanged.

## Capabilities

### Modified Capabilities

- `identity`: sign-in methods, capabilities, verification codes, password storage.

## Impact

- `mods/common/src/protos/identity.proto`, validators, `mods/identity` (exchanges, verification,
  users, workspaces/invites, allow-list, Prisma schema and migration), `mods/sdk`.
- **Operators:** take a database snapshot before upgrading; the backfill rewrites password storage.
- **External users of Identity:** RPCs are additive; behaviour changes are stricter codes (single
  use, attempt limits) and method enforcement once `features.auth` is configured (default stays
  `[password]`, invite-only).
