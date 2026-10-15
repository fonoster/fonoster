# Build log: add-call-record

Decisions taken while building, for the owner to review. Each can be reversed.

## 2026-10-15 (overnight, owner asleep)

### CR1. `@fonoster/callrecord` (new package)

- `CallRecordWriter` implements the gateway's `CallRecordSink`: every entry is appended durably
  (fsync per entry) to a working record; at hangup the record is sealed as version 1.
- Sealing builds a vCon: parties (caller, callee, one agent party per app, so handed-off calls stay
  one record), dialog (caller turns and what the caller heard of each agent output, marked when
  interrupted), analysis (`turn_decisions`, `app_notes` from `record.note`), and an attached part
  `messages.ndjson` (every session message) with a `sha512-` content hash.
- Both the original and a redacted copy are signed as JWS (ES256, general JSON serialization, `kid`
  header). The redacted copy masks card numbers and carries no raw messages.
- `fonoster.missing` lists what the record lacks: `recording` and `sip_trace` (not built yet) and
  `hangup` when the gateway died. `fonoster.complete` is false without a hangup.
- Later additions (`addVersion`) create a new signed version whose `appended` points to the
  previous one; sealed versions are never rewritten.
- `verifyRecord` checks both signatures against a key history and every part hash, and names the
  first mismatch.
- Storage: `RecordStorage` interface with a filesystem implementation; object storage and customer
  buckets (2.4) are not done.

### CR2. Open questions settled for now (see design.md)

- O1: seal deadline 30 s; a sweep (on gateway start and every 10 s) seals records of dead calls.
- O2: PEM keys per region, verification by key history. Custody and publishing still open.
- O3: rule-based redaction (card numbers, digits and spoken digits, EN/ES, Luhn), text only.
- O4: pinned to **draft-ietf-vcon-vcon-core-04** (7 September 2026): `vcon: "0.4.0"`,
  `updated_at`, `amended {uuid, content_hash}` on new versions, `redacted {uuid, type,
  content_hash}` on the redacted copy, `sha512-<base64url>` content hashes, JWS general JSON
  serialization with `uuid` in the unprotected header. Two deviations to review:
  - draft-04 5.2.2 requires `x5c` or `x5u` (a certificate chain) in the JWS header; we sign with a
    bare region key (`kid`) because there is no PKI yet.
  - the draft says `alg` SHOULD be RS256; we use ES256 (smaller, faster; allowed by SHOULD).
  - Fonoster-specific fields sit in a top-level `fonoster` object; the draft's `extensions` /
    `critical` mechanism should declare it.
  Validating against the draft's own JSON Schema (task 1.1) is still to do.

### CR3. Gateway wiring

- `callRecord: {dir, region, signingKey: {kid, privateKeyFile}}` in the gateway YAML turns the
  writer on (`mods/gateway/src/main.ts`).
- Crash harness (1.3): `mods/gateway/test/crash.test.ts` kills a gateway process with SIGKILL
  mid-call; the sweep seals a verifiable record listing `hangup` as missing.
- Found and fixed in the gateway on the way: frames an app sent before its session was attached
  (during media setup) were dropped; they are now buffered and replayed.

### Not done

- 1.1 vCon schema pin, 1.2 fixture calls with recorded audio, 1.5 retention/erasure, 1.6 restricted
  access, 2.4 object storage, 2.5 index, 2.6 key publishing, 3.x recording and SIP trace, 4.x privacy
  beyond text redaction, 5.x access APIs, 6.x analytics, 7.x migration and docs.

## 2026-10-15 (morning, with the owner)

### CR4. Bare region keys plus a published key set (owner decision on O2 / x5c)

- Signed records carry `jku` (the HTTPS URL of the region's key set) in the protected JWS header,
  next to `kid`. The gateway serves the set at `/.well-known/call-record-keys.json` as a JWK Set:
  the current key's public half plus every key in `callRecord.keyHistory`, so records signed before
  a rotation keep verifying. `keyHistoryFromSet()` turns a fetched set into the verifier's input.
- This replaces the draft's x5c/x5u certificate chain with a plain published key list; no CA.

## 2026-10-15 (spec review rulings, with the owner)

A separate reviewer read every rebuild spec; the owner ruled on each finding one by one.

### CR5. SIP traces dropped for now

- Routr per-call pcap was never confirmed. The record carries no SIP trace; failed calls carry
  `reason` and `sipStatus` from media-control instead. HEP/Homer may come later.

### CR6. `jku` kept as is (accepted risk)

- The reviewer noted that a key list at a URL we control is weak evidence in a dispute. The owner
  kept CR4 unchanged; no append-only log or external timestamping for now.

### CR7. Minimal records come from the gateway

- The gateway that owns a call writes the minimal record for calls that never reach an app
  (voice-session "The gateway produces call lifecycle events").

## 2026-10-15 (records stream, rebuild/records)

### R-B1. Working records on local disk, sealed records in object storage

- `FsWorkingStore` keeps the per-call working record (fsync per entry) and the raw recording on
  the gateway's disk; `RecordStore` keeps sealed versions in an `ObjectStore`: `S3ObjectStore`
  (any S3-compatible store; MinIO in tests) or `FsObjectStore` (development, `<dir>/sealed`).
- Layout per call: `current`, `v<n>/vcon.jws.json`, `v<n>/vcon.redacted.jws.json`,
  `v<n>/manifest.json` (parts with hash and size), and `parts/<name>` shared by all versions, so
  a new version does not copy the recording.
- The writer is now async (`seal`, `sweep`, `addVersion`); `close()` seals in the background and
  `flush()` waits. The sweep skips calls still open in this process, so a quiet call can no longer
  be sealed mid-call after 30 s without appends.
- `@aws-sdk/client-s3` (already in the shared node_modules for Autopilot) is now a dependency of
  `@fonoster/callrecord`; nothing was installed.

### R-B2. The recorder runs in the gateway and attaches through listener.attach

- Under a recording policy the gateway binds a `Recorder` (two UDP sockets) and sends
  `listener.attach` with the caller's track and the session participant's track, each to its own
  socket as `L16/16000`. The node sends them unmixed; nothing is mixed in the gateway.
- Each side is appended as raw 16 kHz PCM next to the working record, placed by RTP timestamp
  (silence fills lost packets, late ones are dropped), so a gateway crash keeps what was recorded.
  At seal the two sides become one stereo WAV (left caller, right agent), part `recording.wav`,
  referenced from a vCon `dialog` entry of type `recording` with its `content_hash`; the verifier
  now checks dialog files as well as attachments.
- Track ids come from `call.incoming` (caller) and `participant.joined` (session participant; for
  outbound calls the gateway keeps the room subscription until the callee's `participant.joined`).
- Checked against the Go node (`gonode.test.ts`) and the fake node, which now forwards listener
  forks as RTP (in the session's codec, no transcoding).
- The WAV is built in memory at seal (about 2 MB per minute); streaming upload is for later.

### R-B3. Recording policy lives in the gateway config for now

- `app.recording` > `callRecord.workspaces[<workspace>].recording` > `callRecord.recording` >
  `off`. Apps have no command to change it. Moving the setting into the control plane follows the
  apps (they are in gateway YAML until add-platform).
- `consent`: the gateway answers, speaks `callRecord.consentPrompt` (default "This call will be
  recorded.") with the app's voice, then starts the recording and the app's session. The record
  notes `consentRequested`. What happens when the caller refuses (O6) is still open.

### R-B4. Redacted copies and recordings; a redaction leak fixed

- Beeping audio needs word timings (O3), so a redacted copy with any redaction does not reference
  the recording (`fonoster.recordingWithheld`); downloading it then needs unredacted access.
- Found and fixed: the redacted copy carried the caller's words unmasked inside the
  `turn_decisions` analysis. Every string in the redacted copy's analysis is now redacted.

### R-B5. What counts as missing

- `sip_trace` is no longer listed as missing (CR5). `recording` is listed only when the policy
  asked for one and none was made (`recording.failed` says why).

### R-B6. Minimal records

- `call.started` entries now carry `from`, `to` and `workspaceRef`; unrouted inbound calls and
  failed outbound calls also append `call.started` and `call.failed`. A record without a session
  takes its parties from `call.started` and has `fonoster.status: "failed"` with `failure:
  {reason, sipStatus}`, no dialog and no recording.

### R-B7. The index: NATS from the gateways, Prisma in the control plane

- On every sealed version the writer builds a `RecordIndexEntry` (call id, workspace, app,
  numbers, direction, status, failure, times, region, location, version, size, parts); the
  gateway publishes it on `callrecord.sealed` and the apiserver upserts it (queue group). A lower
  version never overwrites a higher one.
- Models `CallRecord`, `CallRecordAudit`, `CallRecordRetention` in the apiserver schema under
  `// rebuild: records`; migration `20261015120000_add_call_records`, checked on Postgres 16
  (deploy, then `migrate diff` is empty) and the queries smoke-tested with a generated client.
- The records code types the Prisma slice it uses (`RecordsDb`), so it builds before the shared
  client is regenerated. The coordinator must run `prisma generate` for the apiserver after merge.

### R-B8. call_record.sealed comes from the gateway

- `Gateway.onRecordSealed` sends it for every new version (not for erasure tombstones) with
  `recordUrl: <callRecord.recordUrl or /api/records>/<callRef>?version=<n>`; never contents.

### R-B9. Retention and erasure run where the key lives

- The control plane owns policies, audit log and index; the region executes, because only it has
  the files and the signing key: NATS request `callrecord.<region>.maintenance`
  (`delete_parts` or `erase`), served by the gateways (queue group).
- Deleting `recording` or `messages` deletes the file and seals a version whose entry has no
  `url` and a `meta.deleted {part, at, reason, actor}`. Deleting `transcript` also deletes the
  earlier versions' vCons (their manifests stay as a trace).
- Erasure deletes every object of the call and seals a signed tombstone (`status: "erased"`, no
  parties or contents). The index keeps the row with numbers cleared; reads answer 410.
- The apiserver runs retention every `callRecords.retentionIntervalMinutes` (default 60), up to
  500 records per policy per run, reason `retention policy: <part> after <n> days`, actor
  `system:retention`.

### R-B10. Records API over HTTP, not gRPC

- On the HTTP bridge at `/api/records` (so recordings download as files): search, get (redacted
  by default, `?original=true`, `?version=n`), recording download (with `x-content-hash`), audit,
  erase, delete one part, retention GET/PUT. Bearer access token plus `x-accesskey-id`; only that
  workspace's records are visible.
- Unredacted access, deletions and retention changes need `WORKSPACE_OWNER` or `WORKSPACE_ADMIN`
  (no separate permission yet). SDK/CTL (5.2) and the dashboard (5.3) are not done.

### R-B11. ListCalls and GetCall from the index behind a flag

- `callRecords.listCallsFromIndex` (default off) serves both from the index; InfluxDB code is
  untouched. Status mapping: completed → NORMAL_CLEARING; failed busy/no_answer/rejected/no_app →
  USER_BUSY/NO_ANSWER/CALL_REJECTED/NO_ROUTE_DESTINATION, anything else SERVICE_UNAVAILABLE.

### R-B12. Workspace buckets

- `callRecord.workspaces[<workspace>].store` in the gateway. If that bucket fails at seal the
  record goes to the region store and the index location says so (O7 interim; no retry queue).
  The apiserver reads a record from whichever of `callRecords.stores` matches its location.

### R-B13. Analytics is a contract for now

- `AnalyticsSink`, per-call `callMetrics` from the redacted copy, `loadRecord` and
  `rebuildAnalytics` (tested: a rebuild gives the same rows). No ClickHouse sink and no loader
  wired to sealing yet.

### R-B14. Test infrastructure

- `minio/minio` and `quay.io/minio/minio` cannot be pulled here; the S3 test ran against
  `bitnamilegacy/minio:2025.4.22` and is gated by `RECORDS_S3_ENDPOINT`.

## 2026-10-15 (control stream)

### CP-B9. SDK and dashboard on the records API; index on by default

- `callRecords.enabled` and `callRecords.listCallsFromIndex` now default to true (no backward
  compatibility needed).
- SDK `CallRecords` (HTTP, `/api/records`): list, get (version, original), recording download,
  audit, erase, delete part, retention; base URL from the client (`WebClient` url, or Node
  `Client({httpUrl})`, default `https://<endpoint host>`); retries once after a token refresh on
  401. No CTL commands yet.
- Dashboard Calls reads records: turns from the vCon dialog, turn decisions and app notes from
  analysis, warnings from `fonoster.missing`/`failures`; the recording downloads as a blob since
  the API needs the bearer token. Session messages are not shown (the redacted copy has no
  messages part and the API has no route for it). Browsers need same-origin `/api` (Envoy) or
  CORS on the HTTP bridge, which the records router does not set.
