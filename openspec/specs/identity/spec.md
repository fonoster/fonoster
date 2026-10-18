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

#### Scenario: Only the role in the target workspace counts

- **WHEN** a user who owns workspace A and is a member of workspace B calls an owner/admin method
  (e.g. `SetProviderKey`, `InviteUserToWorkspace`) naming B as its `accessKeyId`
- **THEN** the call is rejected with `PERMISSION_DENIED`, because their role in B is member

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

#### Scenario: Only refresh tokens refresh

- **WHEN** `ExchangeRefreshToken` is given an access, id or invite token, or a refresh token from
  another issuer or audience
- **THEN** it fails with `UNAUTHENTICATED` and no tokens are issued

### Requirement: Refresh-token rotation policy

Refresh tokens SHALL be time-based and expire after a configurable lifetime. Each refresh token SHALL
carry a `jti` recorded by Identity and SHALL be usable for one exchange, which issues the next token
of the same sign-in (family). Reusing a token more than 30 seconds after its first use SHALL revoke
its family. `RevokeToken` (public: holding the refresh token authorizes it) SHALL revoke the token's
family, a password reset SHALL revoke all of the user's refresh tokens, and regenerating or deleting
an API key SHALL revoke the key's. Access tokens already issued stay valid until they expire.

#### Scenario: Refresh token expires

- **WHEN** a refresh token is presented after its configured lifetime
- **THEN** the exchange is rejected and re-authentication is required

#### Scenario: Reuse revokes the session

- **WHEN** a refresh token that was already exchanged a minute ago is presented again
- **THEN** the exchange fails with `UNAUTHENTICATED`
- **AND** the token issued by the first exchange stops working too

#### Scenario: Sign-out

- **WHEN** a client calls `RevokeToken` with its refresh token
- **THEN** that token and every token rotated from the same sign-in can no longer be exchanged

### Requirement: Token verification via public key

Identity SHALL sign JWTs with RS256 and SHALL expose the verification public key through the
`fonoster.identity.v1beta2.Identity.GetPublicKey` gRPC method. Verification SHALL confirm the token
signature and validate claims including issuer, audience, and expiration.

#### Scenario: A consumer verifies a token offline

- **WHEN** a consumer fetches the public key via `GetPublicKey` and validates a token
- **THEN** a token with a valid signature and valid issuer, audience, and expiry is accepted
- **AND** a token failing signature or claim validation is rejected

#### Scenario: Protected methods take access tokens only

- **WHEN** a protected gRPC method or HTTP route receives a refresh, id or invite token, an access
  token without a well-formed `access` claim, or a token for another issuer or audience
- **THEN** it is rejected as `UNAUTHENTICATED` (HTTP 401)
- **AND** an error while checking a token also answers `UNAUTHENTICATED`; the server keeps serving

### Requirement: Security practices

Identity SHALL require encrypted transport (HTTPS/TLS) for all communications, grant tokens the
minimum permissions necessary (least privilege), and log authentication events and token activity for
auditing.

#### Scenario: Transport is encrypted

- **WHEN** a client communicates with Identity
- **THEN** the communication occurs over an encrypted (TLS) channel

### Requirement: Only enabled sign-in methods work

Each exchange SHALL refuse with `PERMISSION_DENIED` when its method is not in `features.auth.methods`:
`ExchangeCredentials` needs `password`, `ExchangeOauth2Code` and `CreateUserWithOauth2Code` need
`github`, and `ExchangeVerificationCode` needs `email_code`.

#### Scenario: Password disabled

- WHEN methods are `[github, email_code]` and a client calls `ExchangeCredentials` with a valid
  email and password
- THEN the call fails with `PERMISSION_DENIED` and no tokens are issued

### Requirement: Passwordless sign-in with an email code

Identity SHALL trade a valid emailed code for tokens through `ExchangeVerificationCode`, creating the
user only when sign-up is open or an invite is pending, and SHALL answer the same way for known and
unknown emails.

#### Scenario: Existing user

- WHEN a user requests a code and exchanges it within 5 minutes
- THEN they receive id, access and refresh tokens and their email is marked verified

#### Scenario: Unknown email with invite-only sign-up

- WHEN an email with no account and no pending invite exchanges a valid code
- THEN the call fails with "Invalid verification code" and no user is created

### Requirement: Verification codes are single use and limited

Codes SHALL be generated with a cryptographic random source and SHALL be accepted only while
unexpired, unconsumed and under 5 failed attempts; sending a new code SHALL invalidate earlier ones
for the same contact, and sends SHALL be rate limited per email and per IP.

#### Scenario: Reused code

- WHEN a code has been used successfully once
- THEN using it again fails

#### Scenario: Guessing

- WHEN 5 wrong codes are submitted for an email
- THEN the correct code no longer works and a new one must be requested

#### Scenario: Expired code

- WHEN a code is used 6 minutes after it was sent
- THEN it fails

### Requirement: Passwords are stored as one-way digests

Identity SHALL store passwords only as salted `scrypt` digests, SHALL migrate existing encrypted
passwords on sign-in or by backfill, SHALL never send a stored password by email, and SHALL never log
passwords.

#### Scenario: Pre-existing user signs in

- WHEN a user created before this change signs in with their password
- THEN sign-in succeeds, the digest is stored and the encrypted password is cleared

#### Scenario: Invitee must set a password

- WHEN a user created by an invite signs in with the one-time password
- THEN the id token has `mustChangePassword: true` until they set their own password

#### Scenario: Resending an invite

- WHEN an admin resends an invite to a user who hasn't signed in
- THEN the email carries a new one-time password, not a stored one

### Requirement: API keys are managed by workspace owners and admins

`CreateApiKey`, `ListApiKeys`, `RegenerateApiKey` and `DeleteApiKey` SHALL require the caller to be
an owner or admin of the workspace named by the call's `accessKeyId`, and SHALL act only on keys of
that workspace. API keys act as `WORKSPACE_ADMIN`. A key past its `expiresAt` SHALL NOT exchange or
refresh.

#### Scenario: A member can't mint keys

- **WHEN** a workspace member calls `CreateApiKey` for that workspace
- **THEN** the call fails with `PERMISSION_DENIED` and no key is created

#### Scenario: Another workspace's key

- **WHEN** an admin of workspace A calls `DeleteApiKey` or `RegenerateApiKey` with the ref of a key
  of workspace B
- **THEN** the call fails with `NOT_FOUND` and the key is unchanged

#### Scenario: Expired key

- **WHEN** `ExchangeApiKey` is called with the right secret for a key whose `expiresAt` has passed
- **THEN** it fails with `PERMISSION_DENIED` "Invalid credentials"

### Requirement: Password reset links come from configuration

`SendResetPasswordCode` SHALL link to Identity's configured reset page (`<appUrl>/reset-password`)
and SHALL ignore any URL in the request. `SendResetPasswordCode` (3 per email, 20 per IP per 10
minutes) and `ResetPassword` (10 per email, 30 per IP per 10 minutes) SHALL be rate limited, with
`RESOURCE_EXHAUSTED`, counted the same for unknown emails. Limits (these and the verification-code
sends) SHALL be counted in the Identity database, so they hold across replicas and restarts.

#### Scenario: Requester-supplied URL

- **WHEN** a reset is requested with `resetPasswordUrl` set to another site
- **THEN** the emailed link points at `<appUrl>/reset-password?token=…`

#### Scenario: Limits across replicas

- **WHEN** reset emails for one address are requested round robin from two replicas, one of which
  restarts
- **THEN** the fourth request within 10 minutes fails with `RESOURCE_EXHAUSTED`

#### Scenario: Too many requests

- **WHEN** a fourth reset email is requested for the same address within 10 minutes
- **THEN** the call fails with `RESOURCE_EXHAUSTED` and no email is sent

### Requirement: Failed sign-ins are throttled

`ExchangeCredentials` and `ExchangeVerificationCode` SHALL count failed attempts (wrong password,
2FA code or email code) per email and per client IP. After 10 failures for an email, or 50 from
an IP, within 15 minutes, sign-in for that email (or from that IP) SHALL fail with
`RESOURCE_EXHAUSTED` for 15 minutes, even with the right password, without checking it. Successful
sign-ins SHALL NOT count. Counts are kept in each process's memory, like the other limits.

#### Scenario: Guessing a password

- **WHEN** the tenth wrong password for an email is tried within 15 minutes
- **THEN** the next sign-in for that email fails with `RESOURCE_EXHAUSTED`, right password or not

### Requirement: An unverified account belongs to whoever proves its email

When someone signs in with an emailed code (`ExchangeVerificationCode`) or GitHub
(`ExchangeOauth2Code`, by a verified GitHub email) to an existing account whose email was never
verified, Identity SHALL mark the email verified, clear the account's password and revoke all of
its refresh tokens: whoever set that password may not own the address. `VerifyCode` with an email
code SHALL verify only the account whose email received the code.

#### Scenario: Someone signed up with another person's email

- **WHEN** a password account is created for an email its creator doesn't own, and the email's owner
  later signs in with an emailed code or GitHub
- **THEN** the owner is signed in and the password set at sign-up no longer works

#### Scenario: Verifying another account

- **WHEN** `VerifyCode` is called with a code for `a@x.com` and `username` `b@x.com`
- **THEN** it fails with `PERMISSION_DENIED` and `b@x.com` stays unverified

### Requirement: Changing a password needs the current one

`UpdateUser` with a new `password` SHALL require `currentPassword` to match the account's
password (`PERMISSION_DENIED` otherwise) and SHALL revoke all of the user's refresh tokens. An
account without a password (GitHub or email-code sign-in) SHALL get `FAILED_PRECONDITION` and set
one with the password-reset flow. Invitees enter their one-time password as `currentPassword`.

#### Scenario: Stolen access token

- **WHEN** `UpdateUser` is called with a valid access token and a new password but no current password
- **THEN** it fails with `PERMISSION_DENIED` and the password is unchanged
