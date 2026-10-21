# Proposal

## Why

The Calls design has an Answered by column and an "Answered by human" chip, but the answering machine
verdict (`amd.result`) only reached the record's messages part. The vCon and the index didn't carry
it, so the records API couldn't return it and the dashboard left it out (#1066).

## What Changes

- Call record: the first `amd.result` is kept in the vCon's `fonoster.amd` (status, confidence,
  detector, audio used, time) and its status in the index (`amd_status`).
- Records API: search results carry `amdStatus`; ListCalls maps it to the `AmdStatus` enum.
- Dashboard: an Answered by column on Calls, an "Answered by <who>" chip and the verdict on the Call
  answered row of the detail.
