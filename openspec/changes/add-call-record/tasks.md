> Build started 2026-10-15 under the owner's overnight go-ahead. Decisions: see build-log.md.

# Tasks

## 1. Conformance assets

- [x] 1.1 Pin the vCon draft version and vendor its JSON schema for validation (LO-B8)
- [ ] 1.2 Fixture calls (scripted sessions plus recorded caller audio), including one with a spoken
      card number and one with a handoff (scripted sessions with synthetic audio done, LO-B8;
      recorded caller audio needs real calls)
- [x] 1.3 Crash harness: kill the gateway mid-call and assert a sealed record appears within the
      seal deadline, with missing parts listed
- [x] 1.4 Verifier tool: checks the signature against the region's published keys and every file
      hash; reports the first mismatching part
- [x] 1.5 Retention and erasure tests: policy expiry, per-call erasure, audit entries
- [x] 1.6 Redaction tests: masked transcript and beeped audio for seeded personal data; original
      access refused without permission (beeps per utterance, LO-B9)

## 2. Writer and storage

- [x] 2.1 Working-record appends from the gateway (session messages, turn decisions, transcript
      segments, deprecation warnings), each durable on its own
- [x] 2.2 Sealing at hangup: assemble the vCon, hash files, sign (JWS) and mark sealed; record
      missing parts
- [x] 2.3 Versioning: post-seal additions create new versions that reference the predecessor
- [x] 2.4 Region object storage plus per-workspace S3-compatible bucket configuration
- [x] 2.5 Control-plane index (call id, workspace, time, size, location, current version)
- [x] 2.6 Region signing keys and a published key history (see open question O2) (file custody
      with rotation, LO-B5)

## 3. Recording and SIP trace

- [x] 3.1 Recording policy setting per workspace and app (`off`, `on`, `on after consent prompt`)
- [x] 3.2 Internal recording listener (`tracks: both`, separate sides) uploading to record storage
- [ ] ~~3.3 SIP trace capture~~ dropped for the first release (MN10, 2026-10-15)

## 4. Privacy

- [x] 4.1 Redaction step producing the redacted version at seal (engine per open question O3)
      (rule-based text, utterance beeps in audio, LO-B9)
- [x] 4.2 Role permission for unredacted access; default reads return the redacted version
- [x] 4.3 Retention policy engine and per-call erasure, all writing audit entries

## 5. Access

- [x] 5.1 API: fetch by `callRef` and version, search by time range, number, app and status
- [x] 5.2 SDK and CTL support for fetching records and downloading files
- [x] 5.3 Dashboard call detail backed by the record, with recording download
- [x] 5.4 Emit `call_record.sealed` (link only) through workspace webhooks
- [x] 5.5 Minimal records for calls that never reach an app, emitting `call.failed`

## 6. Analytics

- [x] 6.1 Loader that fills the analytics store from sealed records (ClickHouse, optional in
      Community) (ClickHouse sink and gateway loader, LO-B6)
- [x] 6.2 Rebuild command that drops and refills the store from records
      (`fonoster-callrecord analytics rebuild`, LO-B6)

## 7. Migration and docs

- [x] 7.1 Move call history off InfluxDB CDRs; serve `ListCalls`/`GetCall` from the index and
      records (behind `callRecords.listCallsFromIndex`; InfluxDB code kept, R-B11)
- [ ] 7.2 Retire the recording-URL convention (`${RECORDING_BASE_URL}/${appRef}_${mediaSessionRef}.wav`)
      in favor of the record's recording reference
- [ ] 7.3 Point users of Autopilot's retired `conversation.ended` webhook (`rework-autopilot`) to
      `call.ended` and `call_record.sealed` (release note)
- [ ] 7.4 Docs: what a call record contains, retention and erasure, redaction, verifying a record
