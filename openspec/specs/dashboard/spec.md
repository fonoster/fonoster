# dashboard Specification

## Purpose
The web dashboard: sign-in, workspace screens and how they follow the deployment's capabilities.
## Requirements
### Requirement: The dashboard is configured at run time with one setting

The dashboard image SHALL read only `DASHBOARD_API_URL`, when its container starts, and it SHALL take
every other deployment setting from `Capabilities/GetCapabilities`. No setting SHALL be compiled into
the bundle.

#### Scenario: One image, two deployments

- WHEN the same image runs with `DASHBOARD_API_URL=https://api.fonoster.com` and with
  `DASHBOARD_API_URL=https://fonoster.example.org`
- THEN each instance sends its API calls to its own URL and renders the sign-in options its API
  advertises

#### Scenario: Missing API URL

- WHEN the container starts without `DASHBOARD_API_URL`
- THEN the page shows a configuration error that names `DASHBOARD_API_URL`

#### Scenario: API unreachable at boot

- WHEN `GetCapabilities` fails
- THEN the page shows that the API at the configured URL can't be reached, with a retry action, and
  shows no sign-in form

### Requirement: Sign-in options follow the advertised methods

The sign-in screens SHALL offer exactly the methods in `auth.methods`, SHALL offer sign-up only when
`auth.signup` is `open`, and SHALL NOT reveal whether an email has an account.

#### Scenario: Community defaults

- WHEN capabilities return methods `[password]` and signup `invite`
- THEN sign-in shows email and password with "Forgot password", and shows no GitHub button, no code
  sign-in and no sign-up link

#### Scenario: Cloud

- WHEN capabilities return methods `[github, email_code]`
- THEN sign-in shows "Continue with GitHub" and an email field that sends a code, and shows no
  password field

#### Scenario: Open sign-up

- WHEN `auth.signup` is `open` and `password` is enabled
- THEN sign-in links to a sign-up screen that creates the account and signs the user in

#### Scenario: Wrong credentials

- WHEN a user enters a wrong password, or a code for an email without an account
- THEN the screen shows the same message in both cases

#### Scenario: GitHub state mismatch

- WHEN the GitHub callback's `state` doesn't match the nonce stored before the redirect
- THEN the dashboard shows an error and doesn't exchange the code

### Requirement: Invitees set a password before using the app

When the id token carries `mustChangePassword`, the dashboard SHALL show only the Set password screen
until the password is changed.

#### Scenario: First sign-in from an invite

- WHEN an invited user signs in with the one-time password from the invite email
- THEN the dashboard shows Set password, with no skip action, and every other route redirects to it

#### Scenario: Password set

- WHEN the user sets a valid password
- THEN the dashboard refreshes the tokens, and continues to the workspace landing

### Requirement: Users land on a workspace after sign-in

After sign-in, the dashboard SHALL take the user to a workspace they belong to, or let them create
one when they belong to none.

#### Scenario: No workspaces

- WHEN a signed-in user belongs to no workspace
- THEN the dashboard shows Create workspace, and opens the new workspace's overview once created

#### Scenario: Remembered workspace

- WHEN the workspace used last still exists
- THEN the dashboard opens its overview directly

#### Scenario: Several workspaces, none remembered

- WHEN the user belongs to several workspaces and none is remembered
- THEN the dashboard shows Select workspace

### Requirement: The session persists in the browser and ends cleanly

The dashboard SHALL keep the session tokens in `localStorage`, renew them through the SDK, and clear
them on sign-out or when renewal fails. It SHALL be served with a Content-Security-Policy that allows
scripts only from its own origin.

#### Scenario: Reload

- WHEN a signed-in user reloads the page
- THEN they stay signed in on the same route

#### Scenario: Refresh token rejected

- WHEN renewing the access token fails
- THEN the session is cleared and the user is sent to sign-in, with the current path kept as `next`

#### Scenario: Sign-out

- WHEN the user signs out
- THEN the stored session, the remembered workspace and cached API data are cleared

#### Scenario: Inline script blocked

- WHEN an inline `<script>` is injected into the page
- THEN the browser refuses to run it under the served CSP

### Requirement: Cloud-only screens follow capabilities

Billing and cost displays SHALL follow `billing.enabled` and `costs.display` (`none`, `usage` or
`prices`) from the capabilities. In this release the dashboard shows no Billing tab and no cost
fields at all; billing amounts appear only where `billing.enabled` is true, such as a private
region's monthly fee.

#### Scenario: No Billing tab in this release

- WHEN the user opens Settings, with or without `billing.enabled`
- THEN Settings has no Billing tab, and navigating to the billing route goes back to General

#### Scenario: Region fee follows billing

- WHEN `billing.enabled` is false
- THEN a private region's monthly fee is not shown

### Requirement: The navigation can collapse

The sidebar SHALL toggle between expanded and collapsed, SHALL remember the choice per browser, and
SHALL keep every item reachable when collapsed.

#### Scenario: Collapse

- WHEN the user collapses the sidebar
- THEN it shows icons with tooltips, the bubble mark and the workspace avatar, and it stays collapsed
  after a reload

