## Context

Identity already has `ExchangeCredentials`, `ExchangeOauth2Code` (GitHub), `CreateUserWithOauth2Code`,
`SendVerificationCode`/`VerifyCode` and reset-password codes. `IdentityConfig.auth` (from
`features.auth`, default `{methods: [password], signup: invite}`) arrived in `unified-service-config`
but nothing reads it.

## Decisions

### Capabilities
`fonoster.capabilities.v1beta2.Capabilities/GetCapabilities(Empty)` is an apiserver service, built
from `fonoster.yaml`:
- `auth.methods` (`password` | `email_code` | `github`) and `auth.signup` (`invite` | `open`) from
  `features.auth`
- `auth.github.clientId` and `authorizeUrl` when GitHub is enabled and `identity.oauth2.github` is
  set (never the secret)
- `billing.enabled`, `costs.display`, `domain`, `appUrl`

It is on the apiserver's public allow-list. Identity has no such RPC: it receives `features.auth`
through `IdentityConfig.auth` and enforces it (see Enforcement), but describing the deployment is the
apiserver's job because it owns the file. Standalone Identity's consumers configure it themselves,
so they already know its settings.

### Email codes
- `SendVerificationCode` keeps its request shape. For sign-in, the dashboard sends it for an email
  that may not have an account yet; the response is the same either way.
- `ExchangeVerificationCode{email, code}` validates and consumes the code, then:
  - existing user → tokens, and the email is marked verified
  - no user, `signup: open` or a pending invite → creates the user (no password), then tokens
  - otherwise → `PERMISSION_DENIED` "Invalid verification code" (no account enumeration)

### Code rules (all code types: sign-in, contact verification, reset password, 2FA)
- 6 digits from `crypto.randomInt`; 5-minute lifetime (unchanged).
- Valid only if unexpired, unconsumed and under 5 attempts; a wrong guess increments `attempts` on
  that contact's live codes; success sets `consumedAt`.
- Sending a code deletes earlier unconsumed codes for the same type and value.
- Send limits: 3 per email per 10 minutes and 20 per IP per 10 minutes, in-process (a shared limiter
  is future work; documented). Over the limit → `RESOURCE_EXHAUSTED`.

### Passwords
- `scrypt` (Node's `crypto`, N=2^15, r=8, p=1, 16-byte salt, 64-byte key), stored as
  `scrypt$<N>$<r>$<p>$<salt b64>$<hash b64>` in `password_digest`. Chosen over argon2 to avoid a native
  dependency in the images; the format carries its parameters so they can be raised later.
- `password` (the old encrypted column) becomes nullable. Verification checks the digest first; if
  there is none, it compares the decrypted legacy value in constant time, then writes the digest and
  clears the legacy value in one update.
- `migratePasswordStorage` runs `backfillPasswordDigests` at boot in the apiserver and standalone
  Identity, before the owner is upserted; it is batched and idempotent.
- Every write path (create, update, reset, invite, owner upsert) writes only the digest.
- Invites: new users get a one-time password (password sign-in) or a sign-in link (no password
  method). "Resend invite" issues a new one-time password instead of reading the stored one.

### Enforcement
- `ExchangeCredentials` → requires `password`, else `PERMISSION_DENIED` "Password sign-in is disabled".
- `ExchangeOauth2Code` / `CreateUserWithOauth2Code` → require `github`.
- `ExchangeVerificationCode` → requires `email_code`.
- GitHub: read `/user/emails`, use the primary verified address; sign-in creates the user only when
  sign-up is open or an invite is pending (so `CreateUserWithOauth2Code` stays for compatibility).
- Unset `auth` keeps today's behaviour: password on, GitHub available when configured, invite-only.

### Forced password change
`User.mustChangePassword` (default false) is set when an invite creates a user with a one-time
password, and on "resend invite". It is cleared by `UpdateUser` / `ResetPassword` when a new password
is written. The id token carries `mustChangePassword` so the dashboard can route to "Set password"
before anything else. Identity does not block other RPCs; enforcement is in the client.

## Risks

- Backfill on large user tables: batched (500), idempotent, and lazy rehash covers stragglers.
- Per-process rate limits don't hold across replicas; documented.
- Stricter codes may surprise integrators that reused a code; called out in the release notes.
