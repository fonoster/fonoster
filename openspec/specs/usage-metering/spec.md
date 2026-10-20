# usage-metering Specification

## Purpose
Records what every call, eval and stored file consumes, by whom and with whose vendor key, as facts
that any edition can read and that Cloud billing prices later.

## Requirements

### Requirement: Metered quantities

The platform SHALL record usage for these meters, each in one unit: `call.seconds`, `stt.seconds`,
`tts.characters`, `llm.tokens.in`, `llm.tokens.out`, `llm.tokens.cached`, `embedding.tokens`,
`nc.seconds`, `amd.detections`, `amd.seconds`, `recording.seconds` and `storage.bytes`. A meter
SHALL be declared once with its unit and aggregation; usage for an undeclared meter SHALL be
rejected.

#### Scenario: An AI call is metered end to end

- **WHEN** an Autopilot call is answered, talks for 90 seconds with STT, TTS and an LLM, and hangs up
- **THEN** usage lines exist for `call.seconds`, `stt.seconds`, `tts.characters`, `llm.tokens.in`
  and `llm.tokens.out` for that call
- **AND** each line's unit matches its meter's declared unit

#### Scenario: An undeclared meter is rejected

- **WHEN** a component reports usage for the meter `video.seconds`, which is not declared
- **THEN** the usage line is not stored and the rejection is logged with the meter name

### Requirement: Usage records facts, not prices

A usage line SHALL hold a quantity and its attribution only. It SHALL NOT hold a price, a cost, a
currency or a billable flag, and recording usage SHALL NOT depend on whether billing is enabled.

#### Scenario: Billing disabled

- **WHEN** `billing.enabled` is false and a call completes
- **THEN** the call's usage lines are recorded the same as when billing is enabled

#### Scenario: No money on a usage line

- **WHEN** a client reads usage lines or totals through the API
- **THEN** no field carries an amount of money or a billable flag

### Requirement: Usage attribution

Every usage line SHALL carry the owner, workspace, region, region kind (`public` or `private`),
origin (`call`, `browser_test`, `eval` or `api`), the time it occurred and, when they apply, the
app, the call reference, the provider and the model.

#### Scenario: A call's lines are attributed

- **WHEN** a call to an app of workspace W, owned by user U, ends in region R
- **THEN** each of the call's usage lines names U, W, the app, the call reference, R and its region
  kind, and origin `call`

### Requirement: Key source per provider

Every line for a vendor meter (STT, TTS, LLM, embeddings, noise cancelling) SHALL record
`keySource`: `workspace` when the vendor was called with the workspace's own key, `platform`
otherwise. Key source SHALL be recorded per provider, not per call.

#### Scenario: One call, two key sources

- **WHEN** a call uses STT from provider A with the workspace's own key and TTS from provider B
  with the platform key
- **THEN** the `stt.seconds` line says provider A and `keySource: workspace`
- **AND** the `tts.characters` line says provider B and `keySource: platform`

#### Scenario: Platform resources have no key source

- **WHEN** a call's `call.seconds` and `recording.seconds` lines are read
- **THEN** they carry no `keySource`

### Requirement: Call seconds count from answer

`call.seconds` SHALL count whole seconds from the moment the call is answered until the call ends,
including time after a transfer while the call is still bridged. A call that is never answered
SHALL produce no `call.seconds` line.

#### Scenario: Ringing is not metered

- **WHEN** a call rings for 20 seconds, is answered and ends 65 seconds after the answer
- **THEN** its `call.seconds` quantity is 65

#### Scenario: Unanswered call

- **WHEN** an outbound call is not answered
- **THEN** no `call.seconds` line exists for it

### Requirement: Origin of test calls and evals

A call started from the browser test path SHALL be metered with origin `browser_test`, the same
quantities as any call. An eval run SHALL be metered with origin `eval` and only its LLM token
meters, since it uses no media.

#### Scenario: Browser test call

- **WHEN** a user talks to an agent from the dashboard for 30 seconds
- **THEN** the call's lines carry origin `browser_test` and `call.seconds` is 30

#### Scenario: Eval run

- **WHEN** an eval runs three scenarios against an agent
- **THEN** usage lines with origin `eval` exist only for `llm.tokens.*` meters, with no call
  reference

### Requirement: Token counts come only from the vendor

LLM and embedding token counts SHALL be the counts the vendor reports for each request, never an
estimate. A turn the caller interrupts SHALL still be metered with the vendor's counts for the whole
request.

#### Scenario: Vendor reports usage

- **WHEN** the LLM vendor reports 1,200 input, 340 output and 800 cached input tokens for a turn
- **THEN** the call's `llm.tokens.in`, `llm.tokens.out` and `llm.tokens.cached` include exactly
  those counts

#### Scenario: Interrupted turn

- **WHEN** the caller interrupts a reply after two seconds and the vendor's request totals 1,200
  input and 180 output tokens
- **THEN** the call's token lines include 1,200 input and 180 output tokens for that turn

### Requirement: Missing usage is an error

When a completed LLM or embedding request returns no usage report, the platform SHALL record no
token line for it, SHALL add a `usage_missing` error naming the catalog id to the call record and
SHALL raise an operator alert. The call SHALL continue.

#### Scenario: Vendor omits usage

- **WHEN** a model returns a complete reply with no usage report
- **THEN** the caller hears the reply and the call continues
- **AND** the call record holds a `usage_missing` error naming the model's catalog id
- **AND** no token line exists for that request

### Requirement: Usage is recorded exactly once

Each usage line SHALL have an id derived from what it measures, so that reporting the same usage
again, or replaying a sealed call record, SHALL NOT add to any quantity or total.

#### Scenario: Replayed record

- **WHEN** the same sealed call record is processed twice
- **THEN** the call's usage lines and the day's totals are the same as after the first time

### Requirement: Metering never blocks a call

Recording usage SHALL NOT delay or fail a call. When the usage store is unavailable, usage SHALL be
kept durably and recorded once the store is back, with no line lost.

#### Scenario: Store down during calls

- **WHEN** the usage store is unavailable while 10 calls complete, then comes back
- **THEN** all 10 calls completed normally
- **AND** their usage lines are recorded after the store returns

### Requirement: Daily totals are rebuildable

The platform SHALL keep daily totals per owner, workspace, meter, provider, key source, origin and
region kind. They SHALL be derived only from usage lines and SHALL be rebuildable from them at any
time with the same result.

#### Scenario: Rebuild matches

- **WHEN** daily totals are rebuilt from usage lines for a past month
- **THEN** every rebuilt total equals the total that existed before the rebuild

### Requirement: Usage API

`Usage/GetUsage` SHALL return usage totals for a time range, grouped by any of day, workspace,
meter, provider, key source and origin. A caller SHALL get only their workspace's usage, or, as a
workspace owner, the usage of every workspace they own.

#### Scenario: Grouped by key source

- **WHEN** a workspace member requests last month's usage grouped by meter and key source
- **THEN** the response has one total per meter and key source for that workspace only

#### Scenario: Another workspace

- **WHEN** a caller requests usage for a workspace they do not belong to
- **THEN** the request fails with `PERMISSION_DENIED`

#### Scenario: Owner across workspaces

- **WHEN** an owner of two workspaces requests usage grouped by workspace
- **THEN** the response has totals for both workspaces

### Requirement: Private-region usage

Private regions SHALL report the same usage lines, marked region kind `private`. Usage lines SHALL
carry quantities and attribution only, never call content.

#### Scenario: Private-region call

- **WHEN** a call ends in a private region
- **THEN** its usage lines reach the control plane with region kind `private`
- **AND** contain no transcript, message text or audio
