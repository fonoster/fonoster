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
