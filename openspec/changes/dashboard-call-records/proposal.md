# Proposal

## Why

The owner found that the call records experience barely works (2026-10-20). Rendering real vCons
(built by the call-record module from its fixture calls) through the dashboard showed why:

- The Calls list read only the first 100 records, with no filters and no paging, although the
  records API searches by status, period and app and pages with a token.
- The detail was titled by the call ref, named the app by its ref, showed the end reason as a code
  (`caller_hangup`) and never said why a failed call failed or its SIP status.
- Every turn had a start and no duration, and a caller's turn started when it ended: the record
  builder stamped caller turns at `turn.ended` and wrote no `duration` (call-record "The record
  contains ... the transcript per turn and per side, with timings").
- The recording needed two clicks (Download, then Save) and could not be played in the page.
- An erased record loaded for about ten seconds (the query retried the refused request) and then
  showed "records API: 410 erased".
- An app's Recent calls filtered the workspace's first 100 calls in the browser instead of asking
  the API for that app's calls.

## What Changes

- Requirements for the Calls list, the call detail, playing recordings, and unavailable records.
- Dashboard: filters (status, period) and Load more on the Calls list; a detail titled by the
  parties with the app's name, how the call ended in words, the failure reason and SIP status, turns
  with start and duration, an inline player with Download; an Erased and a Not found state; Recent
  calls asks the API by `appRef`.
- Call record: each spoken turn starts when that side began speaking and carries a vCon `duration`.
- Local stack: the seeded app records calls, so local calls have a recording to show.

## Impact

- Capability: `dashboard` (requirements added). The call-record change implements an existing
  requirement and needs no spec change.
- Code: `mods/dashboard/src/session/{calls.tsx,sdk-api.ts,types.ts,app-detail.tsx}`,
  `mods/callrecord/src/vcon.ts`, `ops/rebuild/seed.cjs`.
- Catalog: DSH-030 to DSH-033 (mocked, against the records API serving real vCons), and a nightly
  case against the stack.
- Records sealed before this change have no turn durations; the dashboard shows their turns with a
  start only.
