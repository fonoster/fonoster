## Why

A call's facts are scattered today, and most of them are thrown away:

- The CDR lives in InfluxDB.
- The recording URL is built by string convention (`${RECORDING_BASE_URL}/${appRef}_${mediaSessionRef}.wav`).
- Autopilot sends the chat history once, in a `conversation.ended` webhook, and then it's gone.
- Logs sit in log files.

Nothing ties these together, nothing proves they weren't altered, and nothing keeps them.

Calls are business data. They feed collections disputes, quality reviews, turn-taking research and
product decisions, so they must not be disposable. The rebuild gives every call one durable record
in an open format, the IETF vCon, which becomes the system of record for what happened on the call.

## What Changes

- **One vCon per call.** It holds:
    - parties and timing
    - the recording, referenced by URL and content hash
    - the transcript
    - every session message in both directions (audio is covered by the recording)
    - turn decisions with their outcomes
    - provider substitutions and deprecation warnings
    - the SIP trace (pcap) as an attachment

  Full logs, LLM exchanges and per-turn audio clips are **not** included.
- **Built live, sealed at hangup.** Components append their parts during the call, so a crash
  mid-call still yields a record. At hangup the record is assembled, hashed, signed and sealed.
  Later additions (a summary, an eval score) are new versions; a sealed version is never edited.
- **Stored where the call happened.** The record lives in the object storage of the call's region
  or cell, so private regions keep their data on their own network. A workspace can choose its own
  S3-compatible bucket instead. The control plane keeps only an index: call id, time, size and
  location.
- **Kept forever by default.** A workspace may set a retention policy, for example deleting
  recordings after 90 days while keeping transcripts. Single calls can be erased. Every deletion is
  explicit and audited.
- **Original plus redacted copy.** The sealed original has restricted access. A redacted copy
  (masked transcript, beeped audio) is what most people and tools use. Redaction is a workspace
  setting.
- **Provably untampered.** Every recording and trace is referenced by content hash, and every
  sealed vCon is signed with its region's key (JWS).
- **Recording becomes a policy.** Full-call recording is a workspace or app setting (on, off, or
  on after a consent prompt), applied by the platform through an internal listener.
- **Access through the API and the dashboard.** Fetch by id, search, and view or download,
  including the SIP trace. When a record is sealed, a `call_record.sealed` workspace webhook
  (`add-workspace-webhooks`) carries the call ref and a link to fetch it. No continuous export in v1.
- **Calls that never reach an app get a minimal record.** Rejected, busy, unanswered and
  unreachable-app calls, and calls lost to a media node crash before a session opened, get a record
  with parties, timing, the failure reason and the edge SIP trace, and fire `call.failed`.
- **Analytics is derived.** The analytics store (ClickHouse, optional in Community; decision D4) is
  built from sealed vCons and can always be rebuilt from them.
- **BREAKING:** the recording-URL convention and InfluxDB CDRs are superseded by the call record,
  and Autopilot's `conversation.ended` webhook (with its `chatHistory` and `recordingUrl`) is retired
  in favor of workspace webhooks (`rework-autopilot`, `add-workspace-webhooks`). The migration is
  covered in the tasks.

## Capabilities

### New Capabilities

- `call-record`: the per-call vCon. Covers contents, live building and sealing, versioning,
  storage location, retention and erasure, redaction, integrity, recording policy, access, and
  the derived analytics store.

### Modified Capabilities

None. No existing spec covers call records.

## Impact

- **Depends on:** `voice-session` (the session messages, listeners and `callRef` the record is
  built from) and `turn-taking` (turn decisions and outcomes).
- **New components:**
    - a call-record writer in the gateway's region
    - an internal recording listener
    - a redaction step
    - region signing keys
    - a control-plane index
- **Affected code (when built):**
    - `mods/apiserver`: CDR publishing, InfluxDB calls, `ListCalls`/`GetCall`
    - `mods/autopilot`: `sendConversationEndedEvent`, the recording URL
    - `mods/sdk` and `mods/ctl`: call record access
    - `mods/dashboard`: the call detail view
- **Storage:** object storage per region becomes required, not optional.
- **Privacy:** recordings and traces contain personal data. Access control, redaction and erasure
  are part of this change, not follow-ups.
