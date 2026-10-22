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
- THEN the sign-in is revoked on the server, its cookie cleared, and the remembered workspace and
  cached API data are cleared

#### Scenario: Older stored session

- WHEN the dashboard loads and finds a session an older version stored in `localStorage`
- THEN it deletes it and moves its refresh token into the cookie session

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

### Requirement: The sidebar names Agents and Apps

The sidebar SHALL list **Agents** (`/agents`, AI agents powered by Autopilot) and **Apps** (`/apps`,
voice apps the workspace runs itself, shown with the streams icon), both backed by the API's
`Application` resource (types `AUTOPILOT` and `STREAM`). User-facing text SHALL say "agent" and "app",
never "stream", "assistant" or "Autopilot app". Old section paths (`/streams`, `/autopilot`,
`/sip-users`) SHALL NOT be redirected.

#### Scenario: Sidebar labels

- WHEN a signed-in user opens a workspace
- THEN the sidebar shows Agents linking to `/agents` and Apps linking to `/apps`
- AND no item is labeled Streams or Autopilot

#### Scenario: Creating an app

- WHEN the user opens Apps and chooses Create app
- THEN a dialog titled New app opens, and saving shows the toast "App created"

#### Scenario: Old paths

- WHEN the user opens `/w/<workspace>/streams`
- THEN the dashboard treats it as an unknown section and goes to the workspace's Overview

### Requirement: Agent pickers offer the catalog

The agent editor's language model, voice and transcriber pickers SHALL offer the catalog's
providers, models and voices (`GetCapabilities`), shown by label. A new agent SHALL default to
offered items, and to a keyless provider's items when the catalog has one, since those work with no
key. A saved agent whose item is no longer offered SHALL keep it, shown as unavailable.

#### Scenario: A new agent prefers keyless providers

- **WHEN** the catalog lists `fake` and `deepgram`
- **THEN** the voice, transcriber and language model pickers offer both
- **AND** a new agent is created with `fake` models and voice

#### Scenario: A saved item that is no longer offered

- **WHEN** an agent uses `deepgram/aura-2-thalia-en` and Deepgram was removed from the catalog
- **THEN** the voice picker shows it as unavailable and saving keeps it

#### Scenario: Models Autopilot cannot run are not offered

- **WHEN** the catalog has no model for a provider (Google, Anthropic)
- **THEN** the language model picker does not offer that provider

### Requirement: Vendor keys warn when no vendor is configured

The vendor keys screen SHALL offer Add key for every keyed vendor in the catalog. When the catalog
has no keyed vendor, it SHALL NOT offer Add key and SHALL say that calls need at least a
text-to-speech vendor and that the operator configures vendors and their platform keys, with a link
to the docs that show how.

#### Scenario: Every vendor was removed

- **WHEN** the catalog has only the keyless `fake` provider
- **THEN** the vendor keys screen shows the platform keys note and no Add key button

### Requirement: Noise cancelling is one select fed by the catalog

An app's Call handling form, and a *Noise cancelling* panel on an Autopilot agent's Advanced tab,
SHALL show a single *Noise cancelling* select whose options are *None* and each `nc` provider the
catalog offers to the workspace (`GetCapabilities`), shown by label. Choosing a provider SHALL set
the app's filter for it; choosing *None* SHALL clear the app's filters. Neither SHALL show a
strength control.

#### Scenario: No noise-cancelling provider is offered

- **WHEN** the catalog offers the workspace no `nc` provider
- **THEN** the select offers *None* only

#### Scenario: Turning noise cancelling on

- **WHEN** `aicoustics` is offered and the user picks *ai-coustics* and saves
- **THEN** the app is saved with `filters: [{ name: "aiCoustics" }]`

#### Scenario: Turning it off

- **WHEN** the app has `filters: [{ name: "aiCoustics" }]` and the user picks *None* and saves
- **THEN** the app is saved with an empty `filters` list

#### Scenario: A saved filter whose provider is no longer offered

- **WHEN** the app has `filters: [{ name: "aiCoustics" }]` and the catalog no longer offers `aicoustics`
- **THEN** the select shows the provider's id marked unavailable (`aicoustics (unavailable)`), since
  the catalog no longer has its label, as the voice, model and transcriber pickers do, and saving
  keeps the filter

#### Scenario: Agents set it on the Advanced tab

- **WHEN** the user opens an Autopilot agent's Advanced tab, picks *ai-coustics* in the *Noise cancelling* panel and saves the agent
- **THEN** the agent's application is saved with `filters: [{ name: "aiCoustics" }]`
- **AND** nothing is sent before the agent is saved
- **AND** the agent's Call handling drawer shows no *Noise cancelling* select

### Requirement: Vendor keys offers noise-cancelling providers

The Vendor keys page SHALL list providers serving `nc` the same way as speech and language-model
providers, by label, and its copy SHALL say that noise-cancelling accounts can be brought.

#### Scenario: Adding an ai-coustics key

- **WHEN** the catalog lists `aicoustics` and the owner opens Vendor keys
- **THEN** *ai-coustics* is offered when adding a key
- **AND** after saving, the row shows the provider's label and that the workspace's own key is in use

### Requirement: The call detail flags unfiltered calls

When a call record contains a `filter.failed` event, the call detail SHALL show an *Unfiltered*
badge with the recorded reason.

#### Scenario: A filter failed

- **WHEN** the user opens a call whose record contains `filter.failed` with reason `license rejected`
- **THEN** the detail shows an *Unfiltered* badge and the reason

#### Scenario: Filtering worked

- **WHEN** the user opens a call whose app has a filter and whose record has no `filter.failed` event
- **THEN** no *Unfiltered* badge is shown

### Requirement: The workspace has a Usage page

The sidebar SHALL list **Usage** (`/usage`) in every edition, whatever `billing.enabled` and
`costs.display` say. The page SHALL show the workspace's usage for a chosen period from
`Usage/GetUsage`: quantities only, never money.

#### Scenario: Community install

- **WHEN** a user of a self-hosted install with `billing.enabled` false opens Usage
- **THEN** the page shows the workspace's usage for the current month
- **AND** shows no price, cost or balance

#### Scenario: Choosing a period

- **WHEN** the user picks Last month
- **THEN** every figure on the page covers last month only

#### Scenario: No usage yet

- **WHEN** the workspace has no usage in the period
- **THEN** the page says there is no usage for that period instead of showing zeros

### Requirement: Usage shows minutes apart from test minutes

The Usage page SHALL show call minutes, with browser test minutes as a separate figure, and the
minutes of noise cancelling, answering-machine detections and recording minutes.

#### Scenario: Calls and tests

- **WHEN** a month has 120 minutes of calls and 15 minutes of browser tests
- **THEN** the page shows Calls 120 min and Tests 15 min as separate figures

### Requirement: Usage shows AI usage by vendor and key

The Usage page SHALL list AI usage (transcription seconds, speech characters, language-model and
embedding tokens) by provider and model, and SHALL say for each whether it ran on the workspace's own
key ("Your key") or the platform's ("Fonoster key").

#### Scenario: Own key and platform key

- **WHEN** a month has STT on the workspace's own key and TTS on the platform key
- **THEN** the STT row says Your key and the TTS row says Fonoster key

### Requirement: The Calls page lists the workspace's records

The Calls page SHALL list the workspace's call records newest first, each with its start, the agent
or app by name, the customer, the workspace's number, the duration and the status in words. It SHALL
filter by period, direction, agent or app, and status through the records API, load further pages on
request, show how many calls are listed, export them as CSV, and say when nothing matches.

#### Scenario: Newest first

- **WHEN** the workspace has records from today and yesterday, and a call that failed busy
- **THEN** today's are listed first, each with its start, agent, customer, Fonoster number, duration and status
- **AND** the busy call's status reads Busy

#### Scenario: Filter by status

- **WHEN** the user picks Failed
- **THEN** the records API is asked for `status=failed` and only failed calls are listed

#### Scenario: More than one page

- **WHEN** the API returns a next page token
- **THEN** a Load more action fetches the next page with that token and appends it
- **AND** the count says more calls exist until the last page is loaded

#### Scenario: Filter by direction and agent

- **WHEN** the user picks Outbound, then all directions and the agent Front desk
- **THEN** the records API is asked for `direction=outbound`, then for `appRef` of Front desk, and only those calls are listed

#### Scenario: Export CSV

- **WHEN** the user picks Export CSV
- **THEN** the listed calls are saved as `calls.csv`, one row per call with its ref, start, direction, agent, parties, duration and status

### Requirement: The call detail reads as the conversation

The call detail SHALL be titled by the customer and the agent or app by name, with the direction,
start, duration, status and the workspace's number. Its transcript SHALL be a timeline of the turns
(side, start, duration), the tools called and how the call ended in words; a failed call SHALL show
its failure reason and SIP status. Turn decisions and notes SHALL be on an Events tab.

#### Scenario: A completed call

- **WHEN** the user opens a completed inbound call to the agent Front desk
- **THEN** the title names the caller and Front desk, and each turn shows who spoke, when and for how long

#### Scenario: A browser test call

- **WHEN** the user opens a call they placed with Talk to agent
- **THEN** the title names them (their email) and the agent, not the media node's internal names

#### Scenario: A failed call

- **WHEN** the user opens an outbound call that failed with `486 Busy Here`
- **THEN** the detail says the line was busy with SIP status 486, and shows no transcript or recording

### Requirement: Recordings play in the page

A recorded call's detail SHALL play the recording in the page, drawn as its waveform, seek where the
user clicks, show the position and length, and offer to download it as `<callRef>.wav`. A call
without a recording SHALL say so.

#### Scenario: Play and download

- **WHEN** the user opens a recorded call
- **THEN** an audio player plays the recording, and Download saves it as `<callRef>.wav`

#### Scenario: No recording

- **WHEN** the call was not recorded
- **THEN** the detail says there is no recording and offers no player

### Requirement: The call detail shows how the agent did

The call detail SHALL show, from the record alone, how long the caller waited for each answer (from
the caller's last word to the agent's first audio, per answered turn, with the median), the usage the
call recorded as quantities without prices, and the number of turns per side, the interruptions and
the tools called. An agent turn the caller cut off SHALL say when. Export JSON SHALL save the record's
vCon as the API returned it. What the record does not carry SHALL be left out, not estimated.

#### Scenario: Response time, tools and usage

- **WHEN** the user opens a call where the agent answered 100 ms after the caller stopped, called `get_hours`, and used speech-to-text and LLM tokens
- **THEN** the answer shows first audio 100 ms, Response time shows p50 100 ms, the timeline shows the `get_hours` tool call as ok, and Usage lists the speech-to-text seconds and the LLM tokens with no price

#### Scenario: An interrupted answer

- **WHEN** the caller cut the agent off
- **THEN** the agent's turn says when it was interrupted and In this call counts one interruption

#### Scenario: Export the record

- **WHEN** the user picks Export JSON
- **THEN** the vCon is saved as `<callRef>.vcon.json`

### Requirement: Unavailable records say why

Opening a record that was erased SHALL say the record was erased, and a record that doesn't exist SHALL
say so. Neither SHALL show a raw API error or keep loading.

#### Scenario: An erased record

- **WHEN** the user opens a call whose record was erased
- **THEN** the page says the record was erased, at once, with no raw error

#### Scenario: An unknown call

- **WHEN** the user opens a call ref the workspace doesn't have
- **THEN** the page says the call record wasn't found
