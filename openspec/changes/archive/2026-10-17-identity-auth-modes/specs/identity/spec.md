## ADDED Requirements

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
