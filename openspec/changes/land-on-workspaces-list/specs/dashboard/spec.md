# Spec Delta

## REMOVED Requirements

### Requirement: Users land on a workspace after sign-in

**Reason**: Its "Remembered workspace" scenario sent returning users straight into a workspace. The
owner wants one landing for every edition: the workspaces list.

**Migration**: Replaced by "Users land on the workspaces list after sign-in" below. The storage key
that remembered the last workspace is removed.

## MODIFIED Requirements

### Requirement: Invitees set a password before using the app

When the id token carries `mustChangePassword`, the dashboard SHALL show only the Set password screen
until the password is changed.

#### Scenario: First sign-in from an invite

- WHEN an invited user signs in with the one-time password from the invite email
- THEN the dashboard shows Set password, with no skip action, and every other route redirects to it

#### Scenario: Password set

- WHEN the user sets a valid password
- THEN the dashboard refreshes the tokens and shows the workspaces list, like any other sign-in

### Requirement: The session persists in the browser and ends cleanly

The dashboard SHALL NOT store any token in web storage. It SHALL keep the access and id tokens in
memory only and hand each sign-in's refresh token to the apiserver's cookie session
(`/api/session`, see identity "Dashboard cookie session"), which keeps it in an httpOnly cookie. On
load it SHALL restore the session from that cookie, renew before the access token expires (one
renewal at a time across tabs), and on sign-out call the session's logout, which revokes the
sign-in. It SHALL remove a session stored by older versions on load (moving its refresh token into
the cookie). It SHALL be served with a Content-Security-Policy that allows scripts only from its own
origin.

#### Scenario: Reload

- WHEN a signed-in user reloads the page
- THEN the cookie session restores them on the same route

#### Scenario: No token in storage

- WHEN a user signs in, the session renews, or the user signs out
- THEN `localStorage` and `sessionStorage` hold no access, id or refresh token

#### Scenario: Refresh token rejected

- WHEN renewing the access token fails
- THEN the session is cleared and the user is sent to sign-in, with the current path kept as `next`

#### Scenario: Sign-out

- WHEN the user signs out
- THEN the sign-in is revoked on the server, its cookie cleared, and cached API data cleared

#### Scenario: Older stored session

- WHEN the dashboard loads and finds a session an older version stored in `localStorage`
- THEN it deletes it and moves its refresh token into the cookie session

#### Scenario: Inline script blocked

- WHEN an inline `<script>` is injected into the page
- THEN the browser refuses to run it under the served CSP

## ADDED Requirements

### Requirement: Users land on the workspaces list after sign-in

After sign-in, and whenever a signed-in user opens `/`, the dashboard SHALL show the workspaces
list, in every edition. It SHALL NOT remember the workspace used last. A user who belongs to no
workspace SHALL be taken to Create workspace instead. A deep link to a workspace SHALL still open
that workspace.

#### Scenario: Signed in with workspaces

- WHEN a user signs in and belongs to one or more workspaces
- THEN the dashboard shows the workspaces list, and choosing one opens its overview

#### Scenario: Opening the root with a session

- WHEN a signed-in user opens `/`, including after a reload
- THEN the dashboard shows the workspaces list

#### Scenario: No workspaces

- WHEN a signed-in user belongs to no workspace
- THEN the dashboard shows Create workspace, and opens the new workspace's overview once created

#### Scenario: Deep link with a session

- WHEN a signed-in user opens `/w/<ref>` for a workspace they belong to
- THEN the dashboard opens that workspace's overview
