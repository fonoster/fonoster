# Proposal

## Why

Recent deliveries on the Webhooks page shows a delivery's type, id, attempts and status, but not
the body Fonoster sent. A developer whose receiver rejects a webhook has to switch to the SDK or
CLI, or log on their own server, to see it (#1271). The API and SDK return the event with each
delivery since #1270.

## What Changes

- Dashboard: a delivery row opens a read-only drawer (a click on the row, or Tab and Enter on the
  event type). The drawer shows the status, attempts and last response, the endpoint, when it was
  sent, and the event as `JSON.stringify(event, null, 2)` with Copy body and a note that the body
  can't be used to check a signature. No actions besides Copy body.

## Impact

- `mods/dashboard` (Webhooks page). No API, SDK or CLI change.
- Case DSH-067.
