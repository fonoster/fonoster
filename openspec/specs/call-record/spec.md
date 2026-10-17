# call-record Specification

## Purpose
The sealed, signed record of each call: what it captures and how it is stored and verified.
## Requirements
### Requirement: Every session produces exactly one call record

The platform SHALL produce exactly one call record, in vCon format, for every call that reaches a
session. The record SHALL be identified by the call's `callRef`.

#### Scenario: A normal call leaves one record

- **WHEN** a call connects to an app, exchanges messages and the caller hangs up
- **THEN** exactly one call record exists for that `callRef`
- **AND** it validates against the pinned vCon schema
- **AND** it records the vCon draft version it follows

#### Scenario: A handed-off call still has one record

- **WHEN** an app hands the call to a second app with a payload
- **THEN** the call still has exactly one record
- **AND** the record lists both apps in order, with the handoff payload

### Requirement: The record contains the call's parties, timing, transcript, messages and turns

A sealed call record SHALL contain:

- the parties
- the start, answer and end times
- the direction
- the transcript per turn and per side, with timings
- every session message in both directions, in order, with timestamps (audio frames excluded)
- the turn decisions with their outcomes
- any provider substitution or deprecation warning

SIP traces are out of scope for the first release (media-node MN10, owner decision 2026-10-15).

It SHALL NOT contain full log output, LLM prompts or responses, or per-turn audio clips.

#### Scenario: Session messages are captured both ways

- **WHEN** an app sends `speak` and the gateway answers with `output.started` and `output.done`
- **THEN** the record contains all three messages, in order, with their `id` and timestamps
- **AND** contains no audio frame payloads

#### Scenario: Turn decisions carry outcomes

- **WHEN** the gateway emits `turn.ended` and the caller resumes speaking within the cut-off window
  after the agent starts
- **THEN** the record holds that turn decision marked as a false cut-off

#### Scenario: A deprecated model used on a call is recorded

- **WHEN** a call uses a catalog id that is deprecated
- **THEN** the record contains a deprecation warning naming that catalog id

#### Scenario: LLM exchanges are excluded

- **WHEN** an Autopilot call makes LLM requests with a system prompt
- **THEN** the record contains the agent's spoken text
- **AND** contains neither the system prompt nor the raw LLM requests and responses

### Requirement: The record is built during the call and sealed at hangup

Components SHALL append their parts to a working record during the call, and each append SHALL be
durable on its own. At hangup the platform SHALL seal the record within the configured seal
deadline. A sealed record SHALL never be modified.

#### Scenario: Sealing after a normal hangup

- **WHEN** a call ends
- **THEN** a sealed record is available within the seal deadline
- **AND** its status is `sealed`

#### Scenario: A gateway crash mid-call still yields a sealed record

- **WHEN** the gateway serving a call is killed mid-call after messages have been exchanged
- **THEN** a sealed record exists for that call within the seal deadline after the call ends
- **AND** it contains every message appended before the crash
- **AND** it lists the parts that could not be collected as missing

#### Scenario: A sealed record cannot be edited

- **WHEN** anything tries to change a sealed version
- **THEN** the change is refused
- **AND** the sealed version's content and signature are unchanged

### Requirement: Additions after sealing create new versions

Any change after sealing (a summary, an eval result, a redaction, a retention deletion) SHALL create
a new version that references its predecessor, and the previous version SHALL stay readable unless a
deletion removed its contents.

#### Scenario: Adding a post-call summary

- **WHEN** a summary is added to a sealed record
- **THEN** a new version exists that contains the summary and references the prior version
- **AND** the prior version is unchanged and still verifies

### Requirement: Records are stored in the call's region or the workspace's bucket

A record and its files SHALL be stored in the object storage of the region or cell where the call
happened, unless the workspace has configured its own S3-compatible bucket, in which case they SHALL
be stored there. The control plane SHALL store only an index entry: call id, workspace, time, size,
location and current version.

#### Scenario: Private region keeps its data

- **WHEN** a call happens in a private region
- **THEN** the record and recording are stored only in that region's storage
- **AND** the control plane holds only the index entry

#### Scenario: Customer bucket

- **WHEN** a workspace has configured its own bucket and a call completes
- **THEN** the record and its files are written to that bucket
- **AND** the index entry points there

### Requirement: Retention follows workspace policy and deletions are audited

Records SHALL be kept indefinitely unless the workspace sets a retention policy. Policies SHALL be
settable per part (recording, transcript, messages). Erasure of a single call SHALL be
supported. Every deletion SHALL be explicit and SHALL produce an audit entry stating what was
deleted, when, why and by whom.

#### Scenario: Default retention keeps everything

- **WHEN** a workspace has no retention policy
- **THEN** its records and files are never deleted automatically

#### Scenario: Recordings expire, transcripts stay

- **WHEN** a workspace policy deletes recordings after 90 days and a record is older than that
- **THEN** the recording file is deleted and a new version records its removal
- **AND** the transcript, messages and metadata remain
- **AND** an audit entry names the policy as the reason

#### Scenario: Erasing one call

- **WHEN** an authorized user requests erasure of a call
- **THEN** that call's files and contents are deleted from storage
- **AND** an audit entry records the request, the requester and the time

### Requirement: Redacted copies protect personal data

When redaction is enabled for a workspace, sealing SHALL produce a redacted version alongside the
original:

- personal data masked in the transcript and messages
- the same spans beeped in the audio

The original SHALL be readable only by roles granted unredacted access. Default reads SHALL return
the redacted version.

#### Scenario: A card number is masked

- **WHEN** redaction is on and a caller speaks a card number during a fixture call
- **THEN** the redacted version's transcript shows the number masked
- **AND** the redacted recording has the matching span beeped
- **AND** the original still contains it

#### Scenario: Restricted original

- **WHEN** a user without unredacted access fetches the record
- **THEN** they receive the redacted version
- **AND** a request for the original is refused

### Requirement: Records are hashed and signed

Every file a record references SHALL be referenced with its content hash. Every sealed version SHALL
be signed with the region's key as a JWS. Signatures SHALL remain verifiable after the region's key
rotates.

#### Scenario: Verifying a record

- **WHEN** a sealed record is verified with the region's published key
- **THEN** the signature is valid
- **AND** every referenced file's hash matches its stored content

#### Scenario: Tampering is detected

- **WHEN** a byte of a stored recording or of the sealed vCon is changed
- **THEN** verification fails and names the part that does not match

### Requirement: Recording is applied by policy

Full-call recording SHALL be controlled by a workspace or app setting (`off`, `on`, `on after
consent prompt`) and SHALL be applied by the platform through an internal listener with both sides
kept separate. Apps SHALL NOT be able to override the policy.

#### Scenario: Recording on

- **WHEN** the policy is `on` and a call completes
- **THEN** the record references a recording with both sides and its content hash

#### Scenario: Recording off

- **WHEN** the policy is `off`
- **THEN** no recording is made and the record has no recording reference

#### Scenario: Consent prompt

- **WHEN** the policy is `on after consent prompt`
- **THEN** the caller hears the consent prompt before recording starts
- **AND** the record notes that consent was requested

### Requirement: Records are available through the API and the dashboard

The API SHALL fetch a record by `callRef` (latest or a given version) and search records by time
range, number, app and status, within the caller's workspace. The dashboard SHALL display a record
and offer download of its recording. When a record is sealed, the platform SHALL
emit the `call_record.sealed` workspace webhook with the call ref and a link to fetch the record,
and MUST NOT include record contents in the webhook. Continuous export is not part of this version.

#### Scenario: Fetch and search

- **WHEN** a workspace member searches by number and time range
- **THEN** the matching records from that workspace are returned
- **AND** records from other workspaces are never returned

#### Scenario: Seal notification

- **WHEN** a record is sealed for a workspace subscribed to `call_record.sealed`
- **THEN** the workspace receives one `call_record.sealed` webhook with the `callRef` and a fetch link
- **AND** the webhook body contains no transcript or recording

### Requirement: Calls that never reach an app get a minimal record

The platform SHALL seal a minimal record for every call that never reaches an app: rejected,
busy, unanswered, app unreachable after retry and fallback, or lost to a media node crash before a
session opens. The gateway that owns the call writes it (voice-session). The record holds the
parties, timing and failure reason (from media-control's `reason` and `sipStatus`, or
`app_unreachable`, `no_app` or `node_error`). It MUST NOT contain a recording or transcript,
and it SHALL use the same storage, retention, signing and index as any record. The platform SHALL
emit the `call.failed` workspace webhook for it.

#### Scenario: Busy outbound call

- **WHEN** an outbound call gets `486 Busy Here` and no session opens
- **THEN** a sealed record exists with both parties, timing, failure reason `busy` and `sipStatus: 486`
- **AND** the record has no recording and no transcript
- **AND** its signature verifies with the region key
- **AND** a `call.failed` webhook is delivered with the same `callRef`

#### Scenario: App unreachable

- **WHEN** an inbound call's app URL fails every connection attempt and the fallback is a spoken message and hangup
- **THEN** the sealed record has failure reason `app_unreachable`

### Requirement: The analytics store is derived from records

The analytics store SHALL be filled only from sealed records and SHALL be rebuildable from them at
any time.

#### Scenario: Rebuilding analytics

- **WHEN** the analytics store is dropped and rebuilt from sealed records
- **THEN** call counts, durations and turn metrics match the values before the drop

