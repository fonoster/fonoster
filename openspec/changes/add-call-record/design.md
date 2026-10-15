## Context

Today a call leaves four unconnected traces:

1. **A CDR in InfluxDB**, written from Routr's `call.started` and `call.ended` events on NATS. It has
   no `appRef`; see dashboard gap 5.1.
2. **A recording** whose URL Autopilot builds by convention:
   `${RECORDING_BASE_URL}/${appRef}_${mediaSessionRef}.wav`. Nothing checks that the file exists or
   that it's the right one.
3. **The chat history**, sent once in the `conversation.ended` webhook and then discarded.
4. **Log lines** spread across the apiserver, Autopilot and Asterisk.

The rebuild moves calls onto sessions (`voice-session`): every event and command is a message with
a `callRef`, the gateway is the one place that sees all of them, and listeners can tap audio. That
makes a single, complete record cheap to build.

vCon is an IETF draft format for conversation records. A vCon has four sections:

- **parties:** who took part
- **dialog:** recordings, inline or by URL with a content hash
- **analysis:** transcripts and other derived data
- **attachments:** anything else

It supports signing (JWS) and redacted or appended versions natively.

## Goals / Non-Goals

**Goals**

- Every call that reaches a session leaves exactly one record, even if a component crashes
  mid-call.
- The record is complete enough to settle a dispute, debug a carrier problem and train
  turn-taking. It's also trustworthy enough to show a third party.
- Records stay in the region where the call happened.
- Retention is a policy the workspace controls, never an accident of storage.

**Non-Goals**

- Full logs, LLM prompts and responses, and per-turn audio clips (decision V1).
- Pushing record contents to customers (continuous export). Deferred past v1; v1 only notifies
  with a `call_record.sealed` webhook carrying a link (decision V6).
- Real-time analytics on live calls. The record is about what happened; listeners cover live use.
- Defining the analytics schema. It is derived, and specified with the analytics work.

## Decisions

### V1. What the record contains

| vCon section | Content |
| --- | --- |
| `parties` | Caller and callee: number or SIP URI, and role (caller, agent app, transfer target) |
| `dialog` | Start, answer and end times; direction; recording reference (URL plus content hash) when recording is on |
| `analysis` | Transcript (per turn, per side, with timings); turn decisions and their outcomes; provider substitutions and deprecation warnings |
| `attachments` | Every session message in both directions, in order with timestamps (audio frames excluded); SIP trace (pcap, captured at the Routr edge only, MN10); app and handoff chain |

**Excluded:** full logs (noisy and large), LLM exchanges (they carry the customer's system prompt,
which is their IP), and per-turn clips (they duplicate the recording).

**Rejected alternative:** a minimal record with only metadata and a recording. It can't answer
"why did the agent cut the caller off?" or "what did the carrier send?", and those are the
questions that matter.

### V2. Where records are stored

A record lives in the object storage of the region or cell where the call happened. A workspace may
configure its own S3-compatible bucket, and its records then go there. The control plane holds only
an index entry: call id, workspace, time, size, location and current version.

**Why:** private regions (decision D9) must keep data on the customer's network, and some
enterprises require their own account.

**Rejected alternatives:**

- Always our storage: it breaks private regions.
- Always the customer's bucket: onboarding becomes painful.

### V3. Retention

Records are kept forever by default. A workspace may set a retention policy per part, for example
"delete recordings after 90 days, keep transcripts and metadata". Erasure of a single call is
supported, as privacy laws require.

Every deletion, whether by policy or on request, is explicit and audited: what was deleted, when,
why and by whom. Deleting a part writes a new version that records the removal. Nothing disappears
silently.

**Rejected alternatives:**

- A fixed default period: data could expire before anyone uses it.
- Never deleting anything: it conflicts with the right to erasure.

### V4. Built live, sealed at hangup, versioned afterwards

During the call, the gateway and its listeners append parts to a working record. The parts are
session messages, turn decisions, transcript segments, the recording upload and the SIP trace. Each
append is durable on its own.

At hangup the writer assembles the vCon, computes content hashes, signs it and marks it **sealed**.
The working record of a crashed component is still sealed when the call ends. The sealing step
records any missing parts as missing instead of waiting forever.

Anything added after sealing (a summary, an eval result, a redaction, a retention deletion) creates
a **new version** that references the previous one. A sealed version is never edited.

**Rejected alternative:** writing the record once at the end. A crash before hangup loses the
whole call.

### V5. Original plus redacted copy

When redaction is enabled for a workspace, sealing produces two versions:

- **The original:** restricted to roles allowed to see unredacted data.
- **A redacted version:** personal data (card numbers, national ids and similar) masked in the
  transcript and messages, and beeped in the audio.

The API, dashboard and analytics use the redacted version by default.

**Rejected alternatives:**

- Redacting before storing: the original is lost forever, which is bad for disputes.
- No redaction in v1: it's unsafe for collections and payments.

### V6. Access: API, dashboard and a seal webhook

The API fetches a record by `callRef` (latest version, or a given version) and searches by:
- time range
- number
- app
- workspace
- status

The dashboard shows the record and lets users download the recording and the SIP trace (item 11:
users get their own traces for troubleshooting). Access follows workspace roles. Unredacted
originals need an explicit permission.

When a record is sealed, the workspace webhook `call_record.sealed` (`add-workspace-webhooks`)
delivers the call ref and a link to fetch the record; the webhook never carries the record itself.
There's no continuous export in v1.

### V7. Integrity: hashes always, signatures on seal

Every referenced file (recording, SIP trace) carries a content hash in the vCon. Every sealed
version is signed with its region's key as a JWS, so anyone holding the region's public key can
verify that a record is complete and unaltered.

**Rejected alternative:** hashes only. They catch corruption but can't prove who produced the
record, and that matters in collections disputes.

### V8. Recording is a policy, implemented as a listener

Full-call recording is a workspace or app setting: `off`, `on`, or `on after consent prompt`. The
platform applies it, not app code, so it can't be forgotten. It's implemented as an internal
listener on the session (`tracks: both`, kept as separate sides) that uploads to the record's
storage and appends the reference and hash. Apps can neither turn recording off when policy says
on, nor turn it on when policy says off.

### V9. The analytics store is derived

The analytics store (ClickHouse, optional in Community; decision D4) is filled from sealed vCons.
Analytics is a view of the records, never a second source of truth: it can be dropped and rebuilt
from the vCons at any time.

### V10. Calls that never reach an app get a minimal record

Rejected, busy and unanswered calls, calls whose app is unreachable after the retry and fallback,
and calls lost to a media node crash before a session opened all get a record. It holds parties,
timing, the failure reason and the edge SIP trace, with no recording and no transcript. It uses
the same storage, retention, signing and index as any record, and the `call.failed` workspace
webhook fires for it. The SIP trace of a failed call is often the most useful evidence in a carrier
dispute. Rejected: only an index entry and the event, which would lose that trace.

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| **Storage cost grows without bound** (forever by default) | Retention policies per part; recordings dominate cost and can expire while transcripts stay |
| **Personal data in traces and recordings** | Restricted originals, redacted copies, audited erasure, region-local storage |
| **Signing keys are high-value** | One key per region; open question O2 covers custody and rotation |
| **Sealing races** (a part arrives after seal) | It becomes a new version, never an edit, so ordering stays safe |
| **Redaction misses** (false negatives) | Originals are kept, so redaction can be re-run when the engine improves |
| **vCon is still a draft** | We pin a draft version and record it in every vCon; see O4 |

## Open Questions

1. **O1. Seal deadline.** How many seconds after hangup must a record be sealed? Proposal: 30 s,
   measured by the conformance suite.
2. **O2. Signing keys.** Custody (KMS, Vault or file) and rotation period. Old signatures must stay
   verifiable after rotation, so we need a published key history per region.
3. **O3. Redaction engine.** Which detector (rules, a model or a vendor) and which languages.
   How are beeps aligned with audio when transcript timings are coarse?
4. **O4. vCon version.** Which IETF draft we pin, and how we handle a later standard version.
5. **O6. Consent prompt.** Who supplies the wording and language, and what happens if the caller
   refuses (end the call, or continue without recording)?
6. **O7. Customer bucket failures.** If a workspace bucket is unreachable at seal, do we buffer in
   region storage and retry, and for how long?
