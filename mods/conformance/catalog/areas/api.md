---
prefix: API
title: Control-plane API
level: L2 Integration (API)
tier: pr
uut: The apiserver's services (Identity among them) in one process behind its auth interceptor, on Postgres, with Routr storing the SIP resources; the standalone Identity service; @fonoster/identity-client
tester: Mocha. One case file run through the Node SDK and through raw gRPC on the canonical protos; the case answers call placement on NATS; a fake SMTP server keeps every email; SQL on Identity's database for states the API cannot reach (expired codes, legacy passwords)
environment: Postgres 16, fonoster/routr-one 2.19.0 and NATS as service containers; everything else in the test process
cadence: every pull request (the api job of pr-checks); proofs nightly and at release
prove: sh mods/conformance/test/api/prove.sh {id} {junitDir}
reset: sh mods/conformance/test/api/rebuild.sh
capabilities:
  - management-api
  - control-plane
  - identity
  - identity-service
  - identity-client
  - capabilities
tests:
  - mods/conformance/test/api/*.api.ts
  - mods/identity/test/server/standaloneService.test.ts
  - mods/identity/test/server/sharedLimits.test.ts
  - mods/identity/test/server/serverFree.test.ts
  - mods/identity-client/test/*.test.ts
---

# Control-plane API

What a client of the platform sees below the dashboard: the management API's resources, Identity
(users, workspaces, roles, tokens, codes, keys), the dashboard's cookie session, the capabilities
RPC, and the checks CreateCall and the SIP resources make before anything reaches a Roomr node or
Routr. The apiserver runs in the test process with its real services and auth interceptor, so a
case exercises the same handlers, validation and access checks production does, on a real Postgres
and a real Routr. Every management case runs twice, through the Node SDK and through plain gRPC on
the canonical protos: when only one fails, the bug is in the SDK's mapping or in the server's
handling of the raw message. Identity's token exchanges have no SDK class (the SDK wraps them in
`Client.login`), so those cases use gRPC. The standalone Identity service and
`@fonoster/identity-client` are proven on their own, from their packages.

Not here: call placement and media (Call flows), node selection, replicas and the bus
(`control-plane` scenarios left in `uncovered-scenarios.txt` for the Call flows and Faults areas),
TLS (Security), the published image (Operations), webhooks, usage, providers and regions (their own
areas; see the hand-off list in the README).

## Running

```sh
docker run -d --name api-pg -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:18.6-alpine3.24
docker run -d --name api-nats -p 4222:4222 nats:2.11.8
docker run -d --name api-routr -p 51907:51907 fonoster/routr-one:2.25.0
export PERSISTENCE_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
export ROUTR_API_ENDPOINT=127.0.0.1:51907 CONFORMANCE_NATS_URL=nats://127.0.0.1:4222
npm run build
npm run test:api -w @fonoster/conformance
node mods/conformance/catalog/prove.cjs --area API     # the proofs, one run per case
```

## Systems

```mermaid
flowchart LR
  subgraph TESTER["Tester (mocha)"]
    SDKD["Node SDK driver"]
    GRPCD["Raw gRPC driver"]
    PLACE["Call placement stand-in"]
    SMTP["Fake SMTP"]
    SQL["SQL on Identity's database"]
  end
  subgraph UUT["Unit under test (in process)"]
    AUTH["Auth interceptor"]
    API["Apiserver services"]
    ID["Identity"]
    SIP["sipnet"]
    SESS["Cookie session routes"]
  end
  PG[("Postgres")]
  ROUTR["Routr (routr-one)"]
  NATS["NATS"]
  SDKD --> AUTH
  GRPCD --> AUTH
  AUTH --> API
  AUTH --> ID
  API --> SIP --> ROUTR
  API --> PG
  ID --> PG
  ID --> SMTP
  API -- "calls.create" --> NATS --> PLACE
  SESS --> ID
  SQL --> PG
```

## Cases

### API-001 Created resources come back

- **Spec:** management-api / Every workspace resource follows the same contract / Created resources come back
- **Priority:** P0
- **Proof:** Stop sending the workspace (`extended.accessKeyId`) when sipnet creates a resource; the SIP resources' tests go red on the list.
- **Fault:** faults/API-001.patch
- **Test:** mods/conformance/test/api/management.api.ts

Each resource is created through the SDK and through gRPC, then read back by get and found in the workspace's list with the field that was sent.

**Pass.** Get and list return the created resource with the sent field, for every resource and both clients. **Fail.** A created resource is missing from get or list, or comes back with a different value.

### API-002 Updates are kept

- **Spec:** management-api / Every workspace resource follows the same contract / Updates are kept
- **Priority:** P1
- **Proof:** Make sipnet's update send only the ref to Routr; the SIP resources' tests go red on the changed name.
- **Fault:** faults/API-002.patch
- **Test:** mods/conformance/test/api/management.api.ts

Each resource that has an update is created, renamed and read back.

**Pass.** Get returns the new name and the fields that were not sent are unchanged. **Fail.** The update is lost, or another field changes.

### API-003 A required field is missing

- **Spec:** management-api / Invalid requests change nothing / A required field is missing
- **Priority:** P1
- **Proof:** Make a secret's name optional; the Secrets create without a name gets past validation and the test goes red. (Routr checks the SIP resources' names itself, so loosening the shared schema alone stays green.)
- **Fault:** faults/API-003.patch
- **Test:** mods/conformance/test/api/management.api.ts

Each resource is created without its required field.

**Pass.** `INVALID_ARGUMENT`, the message names the field, and the workspace's list is unchanged. **Fail.** The create succeeds, answers another code, does not name the field, or leaves an item behind.

### API-004 A field has the wrong format

- **Spec:** management-api / Invalid requests change nothing / A field has the wrong format
- **Priority:** P1
- **Proof:** Let a secret's name be anything; the secret with a spaced name is created and the test goes red. (Routr checks usernames itself.)
- **Fault:** faults/API-004.patch
- **Test:** mods/conformance/test/api/management.api.ts

Each resource is created with one field in the wrong format (a private app URL, a spaced name or username, a bad country code, host, domain, CIDR or role).

**Pass.** `INVALID_ARGUMENT` naming the field, and nothing is created. **Fail.** The create succeeds or answers without naming the field.

### API-005 Unknown refs are not found

- **Spec:** management-api / Unknown refs are not found / Unknown ref
- **Priority:** P1
- **Proof:** Throw a bad-request error instead of not-found for a missing application; the Applications test goes red.
- **Fault:** faults/API-005.patch
- **Test:** mods/conformance/test/api/management.api.ts

Get, update and delete of a ref that was never created, for every resource.

**Pass.** Each call fails with `NOT_FOUND`. **Fail.** Any call succeeds or answers another code.

### API-006 Another workspace's ref

- **Spec:** management-api / Workspaces cannot see each other's resources / Another workspace's ref
- **Priority:** P0
- **Proof:** Make `hasAccessToResource` always grant access; workspace B reads A's resources and the test goes red.
- **Fault:** faults/API-006.patch
- **Test:** mods/conformance/test/api/management.api.ts

Workspace A creates a resource; workspace B, and a member of A acting as a workspace of their own, get, update and delete it by ref.

**Pass.** Every call is `NOT_FOUND`, exactly as for an unknown ref, and A's resource is unchanged. **Fail.** Any call succeeds, answers `PERMISSION_DENIED` (which tells the ref exists), or A's resource changes.

### API-007 Lists are per workspace

- **Spec:** management-api / Workspaces cannot see each other's resources / Lists are per workspace
- **Priority:** P0
- **Proof:** Make `filterByAccessKeyId` return every item; B's list shows A's SIP resources and the test goes red.
- **Fault:** faults/API-007.patch
- **Test:** mods/conformance/test/api/management.api.ts

Workspaces A and B each create a resource; B lists.

**Pass.** B's list has B's resource and not A's. **Fail.** B's list shows A's resource or misses its own.

### API-008 Walking the pages

- **Spec:** management-api / Lists page through every item once / Walking the pages
- **Priority:** P1
- **Proof:** End a full page on Routr's next token instead of the last kept ref; the items fetched past the page are skipped and the test goes red.
- **Fault:** faults/API-008.patch
- **Test:** mods/conformance/test/api/management.api.ts

A creates five resources in a row and B five more; A walks its list two at a time, so pages end in the middle of Routr's batches.

**Pass.** Every item comes once, no page is larger than two, and the walk equals a single large page. **Fail.** An item is skipped or repeated, or a page is too large.

### API-009 Invalid page size

- **Spec:** management-api / Lists page through every item once / Invalid page size
- **Priority:** P2
- **Proof:** Drop the positive-integer rule on `pageSize`; a page size of -1 is accepted and the test goes red.
- **Fault:** faults/API-009.patch
- **Test:** mods/conformance/test/api/management.api.ts

Each list is called with a page size of -1.

**Pass.** `INVALID_ARGUMENT`. **Fail.** The list answers.

### API-010 Delete

- **Spec:** management-api / Deleted resources are gone / Delete
- **Priority:** P1
- **Proof:** Skip sipnet's call to Routr's delete; the SIP resources stay and the test goes red.
- **Fault:** faults/API-010.patch
- **Test:** mods/conformance/test/api/management.api.ts

Each resource is created, deleted, then read, listed and deleted again.

**Pass.** Get is `NOT_FOUND`, the list no longer has it, the second delete is `NOT_FOUND`. **Fail.** The resource is still readable or listed, or the second delete succeeds.

### API-011 Creator owns the workspace

- **Spec:** identity / Users, workspaces, and resource ownership / Creator owns the workspace
- **Priority:** P0
- **Proof:** Give the creator WORKSPACE_ADMIN instead of WORKSPACE_OWNER; the test goes red on the role.
- **Fault:** faults/API-011.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A user creates a workspace and is invited into Acme.

**Pass.** Their access token lists their workspace as WORKSPACE_OWNER and Acme as WORKSPACE_MEMBER. **Fail.** The creator is not the owner, or cannot belong to another workspace.

### API-012 accessKeyId prefix identifies the owner type

- **Spec:** identity / Users, workspaces, and resource ownership / accessKeyId prefix identifies the owner type
- **Priority:** P2
- **Proof:** Generate workspaces' accessKeyIds with another prefix; the test goes red. (A user prefix fault breaks sign-in itself, which reads `US`, so no case could run.)
- **Fault:** faults/API-012.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A signed-up user's and a created workspace's accessKeyId.

**Pass.** The user's starts with `US`, the workspace's with `WO`. **Fail.** Either prefix differs.

### API-013 A role permits only its listed methods

- **Spec:** identity / Role-based access control / A role permits only its listed methods
- **Priority:** P1
- **Proof:** Take ListApplications out of the member role; the member's list is refused and the test goes red.
- **Fault:** faults/API-013.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A member of Acme lists its applications through both clients.

**Pass.** The call succeeds. **Fail.** The call is refused.

### API-014 A method outside the role is denied

- **Spec:** identity / Role-based access control / A method outside the role is denied
- **Priority:** P0
- **Proof:** Add InviteUserToWorkspace to the member role; the member's invite succeeds and the test goes red.
- **Fault:** faults/API-014.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A member of Acme invites someone through both clients.

**Pass.** `PERMISSION_DENIED`. **Fail.** The invite succeeds or answers another code.

### API-015 Only the role in the target workspace counts

- **Spec:** identity / Role-based access control / Only the role in the target workspace counts
- **Priority:** P0
- **Proof:** Check the method against the roles of any workspace in the token; the member who owns another workspace may invite into Acme and the test goes red.
- **Fault:** faults/API-015.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A member of Acme creates a workspace of their own, then invites someone into Acme.

**Pass.** `PERMISSION_DENIED`: in Acme they are a member. **Fail.** The invite succeeds.

### API-016 Authentication issues the three tokens

- **Spec:** identity / Id, access, and refresh tokens / Authentication issues the three tokens
- **Priority:** P0
- **Proof:** Return the access token in place of the id token; the test goes red on the id token's use.
- **Fault:** faults/API-016.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A user signs in with a password.

**Pass.** An id, an access and a refresh token, each verified with Identity's key and each with its own `tokenUse`. **Fail.** A token is missing, unsigned, or of the wrong use.

### API-017 Access token carries workspace roles

- **Spec:** identity / Id, access, and refresh tokens / Access token carries workspace roles
- **Priority:** P0
- **Proof:** Leave the role out of the access claim's entries; the test goes red.
- **Fault:** faults/API-017.patch
- **Test:** mods/conformance/test/api/identity.api.ts

The admin of Acme signs in and the access token is decoded.

**Pass.** It has the admin's `accessKeyId` and `{ accessKeyId: Acme, role: WORKSPACE_ADMIN }` in `access`. **Fail.** Either is missing or wrong.

### API-018 Credentials are exchanged for tokens

- **Spec:** identity / Token exchanges / Credentials are exchanged for tokens
- **Priority:** P0
- **Proof:** Make the password check always succeed; the wrong password is exchanged and the test goes red.
- **Fault:** faults/API-018.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A user signs in with the right password, then with a wrong one.

**Pass.** The right one gets an access and a refresh token; the wrong one is refused. **Fail.** The right one is refused or the wrong one is accepted.

### API-019 MFA is required when enforced

- **Spec:** identity / Token exchanges / MFA is required when enforced
- **Priority:** P1
- **Proof:** Ignore `twoFactorAuthenticationRequired`; the exchange without a code succeeds and the test goes red.
- **Fault:** faults/API-019.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A replica of Identity with MFA enforced; a user signs in without a code and with a wrong one.

**Pass.** Both are refused. **Fail.** Either issues tokens.

### API-020 A refresh token is exchanged for a new pair

- **Spec:** identity / Token exchanges / A refresh token is exchanged for a new pair
- **Priority:** P0
- **Proof:** Answer the presented refresh token instead of a new one; the test goes red.
- **Fault:** faults/API-020.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A refresh token is exchanged.

**Pass.** A new access token and a new refresh token. **Fail.** The exchange fails or hands back the same refresh token.

### API-021 Only refresh tokens refresh

- **Spec:** identity / Token exchanges / Only refresh tokens refresh
- **Priority:** P0
- **Proof:** Drop the `tokenUse` check of the refresh exchange; an access token refreshes and the test goes red.
- **Fault:** faults/API-021.patch
- **Test:** mods/conformance/test/api/identity.api.ts

`ExchangeRefreshToken` is given an access token and an id token.

**Pass.** `UNAUTHENTICATED` for both. **Fail.** Either is exchanged.

### API-022 Refresh token expires

- **Spec:** identity / Refresh-token rotation policy / Refresh token expires
- **Priority:** P1
- **Proof:** Verify refresh tokens without their expiry; the late exchange succeeds and the test goes red.
- **Fault:** faults/API-022.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A replica of Identity whose refresh tokens live one second; the token is exchanged after two and a half.

**Pass.** `UNAUTHENTICATED`. **Fail.** The exchange succeeds.

### API-023 Reuse revokes the session

- **Spec:** identity / Refresh-token rotation policy / Reuse revokes the session
- **Priority:** P0
- **Proof:** Make the reuse grace period a day; the reused token is exchanged and the test goes red.
- **Fault:** faults/API-023.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A refresh token is exchanged, its use is moved a minute back, and it is presented again.

**Pass.** The reuse is `UNAUTHENTICATED` and the token from the first exchange stops working too. **Fail.** The reuse succeeds or the rotated token still works.

### API-024 Sign-out

- **Spec:** identity / Refresh-token rotation policy / Sign-out
- **Priority:** P0
- **Proof:** Make RevokeToken a no-op; the revoked token is exchanged and the test goes red.
- **Fault:** faults/API-024.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A sign-in's second refresh token is revoked.

**Pass.** Neither it nor the first token of the sign-in can be exchanged. **Fail.** Either can.

### API-025 Refresh rotates the cookie

- **Spec:** identity / Dashboard cookie session / Refresh rotates the cookie
- **Priority:** P0
- **Proof:** Set the cookie to the presented refresh token instead of the new one; the test goes red on the cookie.
- **Fault:** faults/API-025.patch
- **Test:** mods/conformance/test/api/identity.api.ts

`POST /api/session/refresh` with a valid cookie.

**Pass.** 200 with an access and an id token, the cookie holds a different refresh token, and the previous one can no longer be exchanged. **Fail.** Any of these does not hold.

### API-026 No session

- **Spec:** identity / Dashboard cookie session / No session
- **Priority:** P1
- **Proof:** Answer 200 when there is no cookie; the test goes red.
- **Fault:** faults/API-026.patch
- **Test:** mods/conformance/test/api/identity.api.ts

`POST /api/session/refresh` without a cookie, then with one Identity refuses.

**Pass.** 401 both times, and the refused cookie is cleared. **Fail.** Another status, or the refused cookie stays.

### API-027 Logout revokes

- **Spec:** identity / Dashboard cookie session / Logout revokes
- **Priority:** P0
- **Proof:** Skip the revoke in `/logout`; the token is still exchanged and the test goes red.
- **Fault:** faults/API-027.patch
- **Test:** mods/conformance/test/api/identity.api.ts

`POST /api/session/logout` with a cookie.

**Pass.** The cookie is cleared and its refresh token can no longer be exchanged. **Fail.** The token still works or the cookie stays.

### API-028 Cross-site request

- **Spec:** identity / Dashboard cookie session / Cross-site request
- **Priority:** P0
- **Proof:** Remove the `X-Requested-With` check; the request is answered and the test goes red.
- **Fault:** faults/API-028.patch
- **Test:** mods/conformance/test/api/identity.api.ts

`POST /api/session/refresh` with a valid cookie and no `X-Requested-With`.

**Pass.** 403, no `Set-Cookie`, and the refresh token still works. **Fail.** The request is served or the cookie changes.

### API-029 A consumer verifies a token offline

- **Spec:** identity / Token verification via public key / A consumer verifies a token offline
- **Priority:** P1
- **Proof:** Make GetPublicKey answer a wrong key; the good token no longer verifies and the test goes red.
- **Fault:** faults/API-029.patch
- **Test:** mods/conformance/test/api/identity.api.ts

The key from GetPublicKey verifies a real access token, a tampered one, and one checked for another audience.

**Pass.** Only the real token verifies. **Fail.** The real token fails, or the tampered or foreign one verifies.

### API-030 Protected methods take access tokens only

- **Spec:** identity / Token verification via public key / Protected methods take access tokens only
- **Priority:** P0
- **Proof:** Accept any `tokenUse` when verifying access tokens; the refresh token is let through and the test goes red.
- **Fault:** faults/API-030.patch
- **Test:** mods/conformance/test/api/identity.api.ts

ListApplications is called with a refresh token, an id token, a tampered access token and garbage; then with a real access token.

**Pass.** `UNAUTHENTICATED` for each of the first four, and the server still serves the fifth. **Fail.** Any of the four is let through, or the server stops serving.

### API-031 Password disabled

- **Spec:** identity / Only enabled sign-in methods work / Password disabled
- **Priority:** P0
- **Proof:** Skip the enabled-methods check for passwords; the sign-in succeeds and the test goes red.
- **Fault:** faults/API-031.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A replica of Identity with methods `[github, email_code]`; a user signs in with the right password.

**Pass.** `PERMISSION_DENIED`. **Fail.** Tokens are issued.

### API-032 Existing user

- **Spec:** identity / Passwordless sign-in with an email code / Existing user
- **Priority:** P0
- **Proof:** Don't mark the email verified on a code sign-in; the test goes red on the column.
- **Fault:** faults/API-032.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A user requests a code and exchanges the code from the email.

**Pass.** The three tokens, and the user's email is verified. **Fail.** The exchange fails or the email stays unverified.

### API-033 Unknown email with invite-only sign-up

- **Spec:** identity / Passwordless sign-in with an email code / Unknown email with invite-only sign-up
- **Priority:** P0
- **Proof:** Create the user even under invite-only sign-up; the test goes red.
- **Fault:** faults/API-033.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A replica of Identity with invite-only sign-up; an email with no account exchanges a valid code.

**Pass.** "Invalid verification code" and no user is created. **Fail.** Tokens are issued or a user appears.

### API-034 Reused code

- **Spec:** identity / Verification codes are single use and limited / Reused code
- **Priority:** P0
- **Proof:** Don't mark codes consumed; the second exchange succeeds and the test goes red.
- **Fault:** faults/API-034.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A code is exchanged twice.

**Pass.** The second exchange fails. **Fail.** It succeeds.

### API-035 Guessing

- **Spec:** identity / Verification codes are single use and limited / Guessing
- **Priority:** P0
- **Proof:** Raise the attempts limit to a thousand; the right code still works after five wrong ones and the test goes red.
- **Fault:** faults/API-035.patch
- **Test:** mods/conformance/test/api/identity.api.ts

Five wrong codes, then the right one.

**Pass.** The right one fails. **Fail.** It succeeds.

### API-036 Expired code

- **Spec:** identity / Verification codes are single use and limited / Expired code
- **Priority:** P1
- **Proof:** Ignore the code's expiry; the late code works and the test goes red.
- **Fault:** faults/API-036.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A code is moved six minutes back and exchanged.

**Pass.** The exchange fails. **Fail.** It succeeds.

### API-037 Pre-existing user signs in

- **Spec:** identity / Passwords are stored as one-way digests / Pre-existing user signs in
- **Priority:** P1
- **Proof:** Keep the encrypted password after writing the digest; the test goes red on the column.
- **Fault:** faults/API-037.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A user is put back in the pre-digest shape (encrypted password, no digest) and signs in.

**Pass.** Sign-in succeeds, a scrypt digest is stored and the encrypted password is cleared. **Fail.** Sign-in fails, no digest, or the encrypted password stays.

### API-038 Invitee must set a password

- **Spec:** identity / Passwords are stored as one-way digests / Invitee must set a password
- **Priority:** P1
- **Proof:** Create invited users without `mustChangePassword`; the test goes red on the claim.
- **Fault:** faults/API-038.patch
- **Test:** mods/conformance/test/api/identity.api.ts

An owner invites a new email; the invitee signs in with the emailed one-time password.

**Pass.** The id token has `mustChangePassword: true`. **Fail.** The sign-in fails or the claim is missing.

### API-039 Resending an invite

- **Spec:** identity / Passwords are stored as one-way digests / Resending an invite
- **Priority:** P1
- **Proof:** Send no email on resend; the test goes red.
- **Fault:** faults/API-039.patch
- **Test:** mods/conformance/test/api/identity.api.ts

An invite is resent.

**Pass.** A new email whose one-time password differs from the first. **Fail.** No email, or the same password.

### API-040 A member can't mint keys

- **Spec:** identity / API keys are managed by workspace owners and admins / A member can't mint keys
- **Priority:** P0
- **Proof:** Add CreateApiKey to the member role; the member mints a key and the test goes red.
- **Fault:** faults/API-040.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A member of Acme creates an API key through both clients.

**Pass.** `PERMISSION_DENIED`, and Acme's keys are unchanged. **Fail.** A key is created.

### API-041 Another workspace's key

- **Spec:** identity / API keys are managed by workspace owners and admins / Another workspace's key
- **Priority:** P0
- **Proof:** Look keys up without the caller's workspace; the admin of Acme deletes Bravo's key and the test goes red.
- **Fault:** faults/API-041.patch
- **Test:** mods/conformance/test/api/identity.api.ts

The admin of Acme deletes and regenerates a key of Bravo through both clients.

**Pass.** `NOT_FOUND` both times and Bravo's key still exchanges. **Fail.** Either call succeeds or the key stops working.

### API-042 Expired key

- **Spec:** identity / API keys are managed by workspace owners and admins / Expired key
- **Priority:** P0
- **Proof:** Ignore the key's expiry in ExchangeApiKey; the test goes red.
- **Fault:** faults/API-042.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A key whose `expiresAt` is a day past is exchanged with its secret.

**Pass.** `PERMISSION_DENIED` "Invalid credentials". **Fail.** Tokens are issued.

### API-043 Requester-supplied URL

- **Spec:** identity / Password reset links come from configuration / Requester-supplied URL
- **Priority:** P0
- **Proof:** Use the request's `resetPasswordUrl`; the email links to the other site and the test goes red.
- **Fault:** faults/API-043.patch
- **Test:** mods/conformance/test/api/identity.api.ts

A reset is requested with `resetPasswordUrl` set to another site.

**Pass.** The email links to `https://api.test/reset-password?token=` and never to the other site. **Fail.** The other site appears.

### API-044 Limits across replicas

- **Spec:** identity / Password reset links come from configuration / Limits across replicas
- **Priority:** P1
- **Proof:** Key the send limiter per process; each replica allows three and the test goes red on the fourth.
- **Fault:** faults/API-044.patch
- **Test:** mods/conformance/test/api/identity.api.ts

Reset emails for one address are requested round robin from two replicas, one restarted in between.

**Pass.** The fourth is `RESOURCE_EXHAUSTED`. **Fail.** The fourth is sent.

### API-045 Too many requests

- **Spec:** identity / Password reset links come from configuration / Too many requests
- **Priority:** P1
- **Proof:** Raise the reset limit to a hundred; the fourth email is sent and the test goes red.
- **Fault:** faults/API-045.patch
- **Test:** mods/conformance/test/api/identity.api.ts

Four reset emails are requested for one address.

**Pass.** The fourth is `RESOURCE_EXHAUSTED` and no email is sent for it. **Fail.** It is sent.

### API-046 Guessing a password

- **Spec:** identity / Failed sign-ins are throttled / Guessing a password
- **Priority:** P0
- **Proof:** Raise the failed sign-in limit to a thousand; the right password still works and the test goes red.
- **Fault:** faults/API-046.patch
- **Test:** mods/conformance/test/api/identity.api.ts

Ten wrong passwords, then the right one.

**Pass.** `RESOURCE_EXHAUSTED`. **Fail.** Tokens are issued.

### API-047 Someone signed up with another person's email

- **Spec:** identity / An unverified account belongs to whoever proves its email / Someone signed up with another person's email
- **Priority:** P0
- **Proof:** Keep the sign-up password when the owner proves the email; the squatter's password still works and the test goes red.
- **Fault:** faults/API-047.patch
- **Test:** mods/conformance/test/api/identity.api.ts

An account signed up with a password is then signed into with an emailed code.

**Pass.** The password set at sign-up no longer works. **Fail.** It still works.

### API-048 Verifying another account

- **Spec:** identity / An unverified account belongs to whoever proves its email / Verifying another account
- **Priority:** P0
- **Proof:** Skip the check that the username matches the code's address; the victim is verified and the test goes red.
- **Fault:** faults/API-048.patch
- **Test:** mods/conformance/test/api/identity.api.ts

VerifyCode with a code sent to one user and another user's username.

**Pass.** `PERMISSION_DENIED` and the other user stays unverified. **Fail.** The other user is verified.

### API-049 Stolen access token

- **Spec:** identity / Changing a password needs the current one / Stolen access token
- **Priority:** P0
- **Proof:** Skip the current-password check in UpdateUser; the password changes and the test goes red.
- **Fault:** faults/API-049.patch
- **Test:** mods/conformance/test/api/identity.api.ts

UpdateUser with a new password and no current one.

**Pass.** `PERMISSION_DENIED` and the old password still works. **Fail.** The password changes.

### API-050 Another workspace's number

- **Spec:** control-plane / Calls leave only by the workspace's own numbers / Another workspace's number
- **Priority:** P0
- **Proof:** Treat every `from` as the workspace's; the call is placed and the test goes red.
- **Fault:** faults/API-050.patch
- **Test:** mods/conformance/test/api/controlPlane.api.ts

Acme calls CreateCall from a number of Bravo, through both clients; the case answers call placement on the bus.

**Pass.** `PERMISSION_DENIED` and nothing reaches call placement. **Fail.** The call is placed.

### API-051 Own number

- **Spec:** control-plane / Calls leave only by the workspace's own numbers / Own number
- **Priority:** P0
- **Proof:** Place the call with `from` set to `to`; the test goes red on the placed number.
- **Fault:** faults/API-051.patch
- **Test:** mods/conformance/test/api/controlPlane.api.ts

Acme calls CreateCall from one of its numbers.

**Pass.** Call placement receives the call with that number as `from` (it becomes `X-Dod-Number`) and Acme's accessKeyId. **Fail.** The call is refused or placed with another number or workspace.

### API-052 Header injection in a party

- **Spec:** control-plane / Calls leave only by the workspace's own numbers / Header injection in a party
- **Priority:** P0
- **Proof:** Remove the format check of `from` and `to`; the CR/LF reaches placement and the test goes red.
- **Fault:** faults/API-052.patch
- **Test:** mods/conformance/test/api/controlPlane.api.ts

CreateCall with a CR LF in `from`, then in `to`.

**Pass.** `INVALID_ARGUMENT` both times and nothing is placed. **Fail.** Either is placed.

### API-053 Trunk with another workspace's credentials

- **Spec:** control-plane / SIP resources reference only their own workspace / Trunk with another workspace's credentials
- **Priority:** P0
- **Proof:** Skip the ownership comparison in `checkRefs`; the trunk is created and the test goes red.
- **Fault:** faults/API-053.patch
- **Test:** mods/conformance/test/api/controlPlane.api.ts

Acme creates a trunk whose `outboundCredentialsRef` names Bravo's credentials.

**Pass.** `INVALID_ARGUMENT` and no such trunk in Acme's list. **Fail.** The trunk is created.

### API-054 Agent in another workspace's domain

- **Spec:** control-plane / SIP resources reference only their own workspace / Agent in another workspace's domain
- **Priority:** P0
- **Proof:** Skip the ownership comparison in `checkRefs`; the agent joins Bravo's domain and the test goes red.
- **Fault:** faults/API-054.patch
- **Test:** mods/conformance/test/api/controlPlane.api.ts

Acme creates an agent in Bravo's domain, and moves one of its agents there.

**Pass.** `INVALID_ARGUMENT` both times. **Fail.** Either succeeds.

### API-055 Community defaults

- **Spec:** capabilities / The apiserver advertises the deployment's capabilities / Community defaults
- **Priority:** P1
- **Proof:** Default the sign-in methods to password and email code; the test goes red.
- **Fault:** faults/API-055.patch
- **Test:** mods/conformance/test/api/capabilities.api.ts

GetCapabilities from a configuration without `features.auth`.

**Pass.** Methods `[password]`, sign-up `invite`, no GitHub block. **Fail.** Anything else.

### API-056 Cloud configuration

- **Spec:** capabilities / The apiserver advertises the deployment's capabilities / Cloud configuration
- **Priority:** P0
- **Proof:** Add the GitHub client secret to the answer; the test goes red.
- **Fault:** faults/API-056.patch
- **Test:** mods/conformance/test/api/capabilities.api.ts

GetCapabilities with methods `[github, email_code]` and a GitHub app configured.

**Pass.** Both methods and the client id, and never the client secret. **Fail.** A method or the client id is missing, or the secret appears.

### API-057 No credentials needed

- **Spec:** capabilities / The apiserver advertises the deployment's capabilities / No credentials needed
- **Priority:** P1
- **Proof:** Take GetCapabilities out of the allow list; the call without a token is refused and the test goes red.
- **Fault:** faults/API-057.patch
- **Test:** mods/conformance/test/api/capabilities.api.ts

GetCapabilities without a token, through the SDK and gRPC.

**Pass.** Both answer. **Fail.** Either is refused.

### API-058 Service serves Identity on the configured port

- **Spec:** identity-service / Standalone Identity gRPC service / Service serves Identity on the configured port
- **Priority:** P0
- **Proof:** Make the standalone server ignore the configured `bindAddr`; the test goes red on the health check.
- **Fault:** faults/API-058.patch
- **Test:** mods/identity/test/server/standaloneService.test.ts

The built `fonoster-identity` started from a config file.

**Pass.** It serves `fonoster.identity.v1beta2` on the configured port and reports SERVING. **Fail.** Nothing answers there or it is not SERVING.

### API-059 Fresh database is provisioned

- **Spec:** identity-service / Database provisioning entrypoint / Fresh database is provisioned
- **Priority:** P0
- **Proof:** Make the provisioning entrypoint leave out the newest migration; the test goes red on the applied count. (Skipping every migration stops the service before any case runs, which proves nothing.)
- **Fault:** faults/API-059.patch
- **Test:** mods/identity/test/server/standaloneService.test.ts

The provisioning entrypoint on an empty database, then sign-up, sign-in and a workspace.

**Pass.** Every migration is applied and the three calls succeed. **Fail.** A migration is missing or a call fails.

### API-060 Public methods need no token, others do

- **Spec:** identity-service / Standalone Identity gRPC service / Public methods need no token, others do
- **Spec:** identity-service / Standalone Identity gRPC service / CreateWorkspace requires an access token
- **Priority:** P0
- **Proof:** Take CreateUser out of the allow list; sign-up without a token is refused and the test goes red.
- **Fault:** faults/API-060.patch
- **Test:** mods/identity/test/server/standaloneService.test.ts

Sign-up, sign-in and GetPublicKey without a token; ListWorkspaces and CreateWorkspace without one, with a forged one and with a real one.

**Pass.** The public methods answer; the others are `UNAUTHENTICATED` until given the real access token. **Fail.** A public method is refused or a protected one is served without a valid token.

### API-061 Missing required configuration fails fast

- **Spec:** identity-service / Externalized configuration with fail-fast validation / Missing required configuration fails fast
- **Priority:** P1
- **Proof:** Give the issuer a default; the server starts without it and the test goes red.
- **Fault:** faults/API-061.patch
- **Test:** mods/identity/test/server/serverFree.test.ts

The built server is started with a config that has no issuer and no database.

**Pass.** It exits non-zero by itself, naming the missing setting. **Fail.** It starts, hangs, or exits without naming it.

### API-062 No telephony subsystems are started

- **Spec:** identity-service / Standalone Identity gRPC service / No telephony subsystems are started
- **Priority:** P1
- **Proof:** Import `nats` from the standalone server's entry; the test goes red on the reached packages.
- **Fault:** faults/API-062.patch
- **Test:** mods/identity/test/server/serverFree.test.ts

The packages the built standalone server reaches through its requires.

**Pass.** gRPC is reached and no telephony package (NATS, Routr, voice, apiserver, sipnet, AppBridge) is. **Fail.** A telephony package is reached.

### API-063 Library import stays server-free

- **Spec:** identity-service / Standalone Identity gRPC service / Library import stays server-free
- **Priority:** P1
- **Proof:** Start a timer at import in the library's index; the process never exits and the test goes red.
- **Fault:** faults/API-063.patch
- **Test:** mods/identity/test/server/serverFree.test.ts

A process that only requires `@fonoster/identity`.

**Pass.** It exits by itself with status 0 and prints nothing about serving. **Fail.** It keeps running or starts listening.

### API-064 Client targets an arbitrary endpoint

- **Spec:** identity-client / Lightweight, endpoint-configurable client / Client targets an arbitrary endpoint
- **Priority:** P0
- **Proof:** Make the client dial `localhost:50051` whatever it is given; the test goes red on the first call.
- **Fault:** faults/API-064.patch
- **Test:** mods/identity-client/test/endToEnd.test.ts

The client against a standalone Identity on a random port: sign-up, sign-in, workspace, invite and sign-out.

**Pass.** Every call reaches that Identity and succeeds. **Fail.** A call fails or reaches another server.

### API-065 Installing the client stays lightweight

- **Spec:** identity-client / Lightweight, endpoint-configurable client / Installing the client stays lightweight
- **Priority:** P1
- **Proof:** Add `nats` to the client's dependencies; the test goes red.
- **Fault:** faults/API-065.patch
- **Test:** mods/identity-client/test/dependencies.test.ts

The client's declared dependencies, what they pull in, and the files it publishes.

**Pass.** Only gRPC, the proto loader and jsonwebtoken; no Prisma, Identity server or telephony; only the built client and its proto. **Fail.** Anything more.

### API-066 Wrappers cover the Identity methods

- **Spec:** identity-client / Identity surface coverage from a single proto source / Wrappers cover the Identity methods
- **Priority:** P1
- **Proof:** Remove the `exchangeVerificationCode` wrapper; the test goes red naming it.
- **Fault:** faults/API-066.patch
- **Test:** mods/identity-client/test/proto.test.ts

Every `rpc` of the canonical `identity.proto` against the client's methods.

**Pass.** Each RPC has a wrapper. **Fail.** One has none.

### API-067 The proto comes from the canonical source

- **Spec:** identity-client / Identity surface coverage from a single proto source / The proto comes from the canonical source
- **Priority:** P1
- **Proof:** Commit a second `identity.proto` in the client; the test goes red.
- **Fault:** faults/API-067.patch
- **Test:** mods/identity-client/test/proto.test.ts

The proto the built client loads, and the copies committed in the repository.

**Pass.** The loaded proto is byte for byte `@fonoster/common`'s and no other copy is committed. **Fail.** They differ or a copy is committed.

### API-068 A server forwards different callers' tokens

- **Spec:** identity-client / Per-request token forwarding / A server forwards different callers' tokens
- **Priority:** P0
- **Proof:** Make the client keep the first token it was given; the second caller acts as the first and the test goes red.
- **Fault:** faults/API-068.patch
- **Test:** mods/identity-client/test/endToEnd.test.ts

One client instance calls for two users, each with their own token.

**Pass.** Each call acts as its own caller. **Fail.** A call acts as the other caller.

### API-069 Call records name their app and ListCalls filters by it

- **Spec:** control-plane / The Calls API carries and filters by the app that handled a call / A call record names its app
- **Spec:** control-plane / The Calls API carries and filters by the app that handled a call / Filter calls by app
- **Spec:** control-plane / The Calls API carries and filters by the app that handled a call / No filter lists every app's calls
- **Priority:** P1
- **Proof:** Leave `appRef` out of the index search ListCalls makes; the filter returns every app's calls and the test goes red.
- **Fault:** faults/API-069.patch
- **Test:** mods/conformance/test/api/calls.api.ts

Index rows the call-record service would write for workspace A (two calls by one app, one by another, one with no app) and one for workspace B by the first app, then ListCalls and GetCall through each driver.

**Pass.** Each record carries its app's ref (none for the call no app handled), the unfiltered list has all four of A's calls, and filtering by the first app returns exactly its two. **Fail.** A record lacks its app, or the filter returns another app's, no app's or B's calls.

### API-070 A malformed app filter is rejected

- **Spec:** control-plane / The Calls API carries and filters by the app that handled a call / A malformed app filter is rejected
- **Priority:** P1
- **Proof:** Remove the UUID check on `appRef` from `listCallsRequestSchema`; the malformed filter is accepted and the test goes red.
- **Fault:** faults/API-070.patch
- **Test:** mods/conformance/test/api/calls.api.ts

ListCalls through each driver with an `appRef` that is not a UUID, and with an empty `appRef` (proto3's unset), over the index rows API-069 writes.

**Pass.** The malformed filter is INVALID_ARGUMENT and the empty one lists all four of workspace A's calls. **Fail.** The malformed filter is accepted, or the empty one filters.

### API-071 Unanswered outbound calls are recorded as failed

- **Spec:** control-plane / Unanswered outbound calls are recorded as failed / Outbound call ends before the answer
- **Spec:** control-plane / Unanswered outbound calls are recorded as failed / An answered call is AppBridge's
- **Priority:** P0
- **Proof:** Seal the failed call's record with no workspace (`createNodeCallEvents` in `webhooks/nodeCallEvents.ts`); the test must go red on the record's workspace.
- **Fault:** faults/API-071.patch
- **Test:** mods/conformance/test/api/outboundFailures.api.ts

An app created through the API in workspace A; a Roomr node in roomr-fake places an outbound call
to it whose callee is busy, or answers and later hangs up. Two control-plane replicas read the
node's call events as the apiserver does, and a stand-in record writer answers on the region's
maintenance subject. A node that dies before the answer is not covered (#1107).

**Pass.** The busy call is sealed once, in workspace A, with call.started, call.progress and call.failed (busy), and one call.failed goes to the fan-out; the answered call produces neither. **Fail.** No record, a record in no or another workspace, two of them, or a failed record for an answered call.
