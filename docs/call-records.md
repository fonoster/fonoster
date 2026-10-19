# Call records

Every call that reaches a session leaves one call record: who took part, what was said, what the
agent decided, and the recording if recording was on. Calls that never reach an app (busy, no
answer, rejected, app unreachable) get a smaller record with the failure reason.

A record is a [vCon](https://datatracker.ietf.org/doc/draft-ietf-vcon-vcon-core/) (a conversation
container format), pinned to `draft-ietf-vcon-vcon-core-04` (`"vcon": "0.4.0"`), signed with the
region's key. Records stay in the region (or the workspace bucket) where the call ran. The control
plane keeps only an index entry (call, time, parties, status, size, location, version).

## What a record contains

| vCon section | Content |
| --- | --- |
| `parties` | The caller (`tel`, role `caller`), the callee (role `callee`) and one `agent` party per app that took the call (a handoff stays one record). |
| `dialog` | The recording (type `recording`, with a `url` and `content_hash`) when recording was on, and one text entry per turn: what the caller said, and what the caller heard of each agent output (marked when interrupted). |
| `analysis` | `turn_decisions` (the turn detector's events and outcomes) and `app_notes` (notes the app wrote into the record). |
| `attachments` | `messages.ndjson`: every session message in both directions, in order (audio frames excluded). Original copy only. |
| `fonoster` | Fonoster fields: `callRef`, `region`, times, `endReason`, `status` (`completed`, `failed`, `incomplete`), `direction`, `workspaceRef`, `appRefs`, `failure` (`reason`, `sipStatus`), `recording` policy, `complete` and `missing`. |

`fonoster.missing` lists what the record lacks: `hangup` (AppBridge died mid-call; a sweep
sealed the record 30 seconds after the last entry) or `recording` (a recording was asked for and
none was made). Not included: logs, LLM prompts and responses, per-turn audio, and SIP traces.

A record is sealed at hangup as version 1. Anything added later (a deletion, an addition) creates
a new version that points to the previous one. A sealed version is never edited. The
`call_record.sealed` [webhook](./webhooks.md) fires for every new version.

## Two copies: original and redacted

Every version has both:

- **Redacted** (the default everywhere): payment card numbers (digits or spoken digits in English
  and Spanish, Luhn-checked) are replaced by `[card number]` in the transcript, turn decisions and
  notes. It carries no raw messages. If a redaction was made and the recording is referenced, the
  turn that carried it is beeped on its own side in a separate recording file. If the redacted
  turn cannot be located in the recording, the redacted copy withholds the recording
  (`fonoster.recordingWithheld`).
- **Original**: unredacted, with `messages.ndjson` and the plain recording. Only workspace owners
  and admins can read it.

Redaction covers text and recognizes card numbers only; other personal data is not masked.

## Read records

Dashboard: **Calls**. CLI:

```sh
fonoster records:list [--after <date>] [--before <date>] [--number <n>] [--app <ref>] [--status <s>] [--page-size <n>] [--page-token <t>]
fonoster records:get <callRef> [--version <n>] [--original]
fonoster records:download <callRef> [--part recording|vcon|signed] [-o <file>] [--version <n>] [--original]
```

`--original` needs the owner or admin role. The SDK has `CallRecords` with the same operations;
the HTTP API is under `/api/records` with `Authorization: Bearer <access token>` and
`x-accesskey-id: <workspace>`:

| Request | Does |
| --- | --- |
| `GET /api/records` | Search: `after`, `before`, `number`, `appRef`, `status`, `pageSize`, `pageToken`. |
| `GET /api/records/<callRef>` | The record; `?version=n`, `?original=true`. |
| `GET /api/records/<callRef>/recording` | The recording (WAV). The `x-content-hash` header carries its hash. |

## Recordings

Recording is a policy, not an app decision: `off`, `on`, or `consent` (the caller hears a consent
prompt first). AppBridge applies the first one set of: the app, the workspace, the region
default, and `off`. Apps cannot override it. The file is a stereo WAV at 16 kHz: left channel the
caller, right channel the agent.

Download it with `fonoster records:download <callRef>` (saves `<callRef>.wav`) or from the call
page in the dashboard. The default download is the redacted copy's recording (beeped, if
anything was redacted). Use `--original` for the unbeeped file.

## Retention and erasure

By default records are kept forever. Owners and admins can change that. Every deletion is audited:
what, when, why and by whom. Deleting a part writes a new signed version that records the removal.

- **Retention policy** per part: `recording`, `transcript` or `messages`, in days. For example,
  delete recordings after 90 days and keep the rest. The control plane runs it hourly
  (`callRecords.retentionIntervalMinutes`), up to 500 records per policy per run.
- **Delete one part** of one call. Deleting the `transcript` also deletes `messages` (the raw
  messages contain the same words) and the vCons of earlier versions. Deleting `recording` also
  deletes the beeped copy.
- **Erase a call**: deletes every object of the call and seals a signed tombstone with no parties
  or contents. The index keeps the row with the numbers cleared; reads then answer 410.
- **Audit**: who deleted what and why.

The SDK exposes these as `getRetention`, `setRetention`, `deletePart`, `eraseRecord` and
`getAudit`. Over HTTP:

```sh
# retention: one part, in days; days null removes the policy
curl -X PUT $API/api/records/retention -H "Authorization: Bearer $TOKEN" -H "x-accesskey-id: $WORKSPACE" \
  -H 'content-type: application/json' -d '{"part":"recording","days":90}'
# erase a call, or delete one part, with a reason
curl -X DELETE $API/api/records/$CALL_REF -H ... -H 'content-type: application/json' -d '{"reason":"erasure request"}'
curl -X DELETE $API/api/records/$CALL_REF/parts/recording -H ... -d '{"reason":"..."}'
curl $API/api/records/$CALL_REF/audit -H ...
```

There are no CLI commands for retention, erasure or the audit log yet; the dashboard has none either. Use the SDK or
the HTTP API. The region executes deletions, because only it holds the files.

## Verify a record

Each version is signed twice (original and redacted) as a JWS in general JSON serialization with
ES256. The protected header has `alg`, `typ` (`vcon+jws`), `kid` (the signing key) and, when the
region publishes its keys, `jku` (the URL of its key set). Every referenced file (the recording,
`messages.ndjson`) has a `content_hash` in the vCon: `sha512-` plus the base64url SHA-512 of the
file.

1. Download the signed record: `fonoster records:download <callRef> --part signed`
   (`<callRef>.vcon.jws.json`; add `--original` for the original's signature).
2. Read `jku` and `kid` from the protected header and fetch the key set from `jku`. The region
   publishes it at `/.well-known/call-record-keys.json` as a JWK Set: its current key plus every
   earlier key, so records signed before a rotation still verify.
3. Verify the signature over `<protected>.<payload>` with the key whose `kid` matches.
4. Compare each referenced file's hash with the vCon's `content_hash`.

```js
const { createPublicKey, verify, createHash } = require("crypto");
const jws = require("./call.vcon.jws.json");
const sig = jws.signatures[0];
const header = JSON.parse(Buffer.from(sig.protected, "base64url"));

(async () => {
  const set = await (await fetch(header.jku)).json();
  const jwk = set.keys.find((k) => k.kid === header.kid);
  const ok = verify(
    "sha256",
    Buffer.from(`${sig.protected}.${jws.payload}`),
    { key: createPublicKey({ key: jwk, format: "jwk" }), dsaEncoding: "ieee-p1363" },
    Buffer.from(sig.signature, "base64url")
  );
  console.log("signature", ok ? "valid" : "INVALID");

  const vcon = JSON.parse(Buffer.from(jws.payload, "base64url"));
  const rec = vcon.dialog.find((d) => d.type === "recording");
  const wav = require("fs").readFileSync("call.wav"); // the matching copy's recording
  const hash = "sha512-" + createHash("sha512").update(wav).digest("base64url");
  console.log("recording", rec && hash === rec.content_hash ? "matches" : "DIFFERS");
})();
```

Inside the platform, `verifyRecord(sealed, keyHistory)` in `@fonoster/callrecord` checks both
signatures and every file hash and names the first mismatch; `keyHistoryFromSet(set)` turns a
fetched key set into its `keyHistory` argument.

Limits to know: the signing key is a bare region key published at a URL the region controls (no
certificate chain, no external timestamp), so a record proves integrity against the published key
set, not against a third-party authority. Part `url`s in the vCon are relative (`parts/<name>`);
download files through the API.

## Operator notes

- AppBridge config `callRecord` turns records on: `dir` (working records), `region`, `signingKey`
  (`{dir, jku}` for a key directory, or `{kid, privateKeyFile}`), `store` (S3-compatible bucket;
  default a local `sealed` folder for development), `recording`, `workspaces.<ref>.{recording,store}`,
  `consentPrompt`, `recordUrl`.
- Keys: `fonoster-callrecord keys rotate|list|retire|publish --dir <dir>`. Rotation takes effect
  without a restart. Retiring deletes an old private key but keeps its public half published.
- Apiserver `callRecords`: `enabled`, `stores`, `retentionIntervalMinutes`.
- Optional ClickHouse analytics are loaded from redacted copies and can be rebuilt with
  `fonoster-callrecord analytics rebuild`.
