# Workspace webhooks

A workspace webhook sends an HTTPS POST to your server when something happens in the workspace.
One system covers every app type. Payloads are small and point to the call record; they never
carry transcripts, recordings or secrets.

Webhooks replace the Autopilot assistant `eventsHook` (see "Migrating from eventsHook").

## Set up an endpoint

Dashboard: **Webhooks**. CLI:

```sh
fonoster webhooks:create --url https://example.com/hooks -e call.ended -e call_record.sealed
fonoster webhooks:list
fonoster webhooks:update <ref> [--url <url>] [-e <event>...]   # -e replaces the event list
fonoster webhooks:delete <ref>
```

`create` prints the signing secret (`whsec_...`) once. Save it; later calls only show a hint.

Rules:

- The URL must be `https://`. (A self-hosted API server can allow `http://` for local testing with
  `apps.allowInsecureWebhooks: true`.)
- The host must be public. Private, loopback, link-local and internal names are refused when you
  save the endpoint and again on every delivery. Operators who self-host and need to reach an
  internal receiver list it in `FONOSTER_ALLOWED_DESTINATIONS` (comma-separated host names, IPs or
  CIDRs; empty by default) on the services that deliver (the API server and the gateways).
- Redirects are not followed; a 3xx counts as a failed attempt.
- Subscribe only to the events you need. Unknown event types are refused.

## Events

Every request body is JSON with the same envelope:

| Field | Meaning |
| --- | --- |
| `id` | `evt_...`; unique per event and the same on every retry and resend. Use it to deduplicate. |
| `type` | One of the types below. |
| `createdAt` | ISO 8601 time the event was created. |
| `workspaceRef` | The workspace the event belongs to. |
| `data` | The type's fields. |

| Type | When | `data` |
| --- | --- | --- |
| `call.started` | A call reached an app. | `callRef`, `appRef`, `from`, `to`, `direction` (`inbound` or `outbound`) |
| `call.ended` | A call that reached an app ended. | the `call.started` fields plus `durationSeconds`, `endReason` (a session end reason: `caller_hangup`, `app_hangup`, `transfer`, `handoff`, `error`, `timeout`) |
| `call.failed` | A call never reached an app (busy, no answer, rejected, app unreachable, media node error). | `callRef`, `appRef` (may be absent), `from`, `to`, `direction`, `reason` (for example `busy`, `no_answer`, `app_unreachable`, `node_error`) |
| `call_record.sealed` | A new version of the call record was sealed. | `callRef`, `version`, `recordUrl` |
| `provider.deprecated` | A provider, model or voice your workspace uses was deprecated. | `id`, `replacement`, `retireOn` (YYYY-MM-DD) |

Example:

```json
{
  "id": "evt_6f1c0a52-3d1e-4b7f-9a53-0f4d5f6a7b8c",
  "type": "call.ended",
  "createdAt": "2026-10-15T14:03:22.114Z",
  "workspaceRef": "ws_...",
  "data": {
    "callRef": "...",
    "appRef": "...",
    "from": "+15551230001",
    "to": "+15551230002",
    "direction": "inbound",
    "durationSeconds": 83,
    "endReason": "caller_hangup"
  }
}
```

`recordUrl` is a path on the API (`/api/records/<callRef>?version=<n>`, or the base your operator
configured). Fetch it with your access token; see [call records](./call-records.md). Event order is
not guaranteed: a `call_record.sealed` can arrive before `call.ended`.

## Verify signatures

Each request has two headers:

- `X-Fonoster-Timestamp`: Unix time in seconds.
- `X-Fonoster-Signature`: the hex HMAC-SHA256, keyed with your signing secret, of
  `<timestamp>.<raw body>`. During a secret rotation it holds two signatures separated by a comma;
  accept the request if any of them matches.

Always verify the raw body bytes, before any JSON parsing. Reject timestamps more than 300
seconds from your clock, and compare signatures in constant time.

TypeScript (Express, raw body):

```ts
import { createHmac, timingSafeEqual } from "crypto";
import express from "express";

const SECRET = process.env.FONOSTER_WEBHOOK_SECRET!; // whsec_...

function verify(body: string, headers: Record<string, unknown>): boolean {
  const timestamp = Number(headers["x-fonoster-timestamp"]);
  const header = headers["x-fonoster-signature"];
  if (!Number.isFinite(timestamp) || typeof header !== "string") return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const expected = createHmac("sha256", SECRET)
    .update(`${timestamp}.${body}`)
    .digest();
  return header.split(",").some((sig) => {
    const given = Buffer.from(sig.trim(), "hex");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

const app = express();
app.post("/hooks", express.text({ type: "application/json" }), (req, res) => {
  if (!verify(req.body, req.headers)) return res.sendStatus(401);
  const event = JSON.parse(req.body);
  // Deduplicate on event.id, then handle event.type.
  res.sendStatus(200);
});
```

Python (Flask):

```python
import hashlib, hmac, os, time
from flask import Flask, request

SECRET = os.environ["FONOSTER_WEBHOOK_SECRET"].encode()  # whsec_...
app = Flask(__name__)

def verify(body: bytes, headers) -> bool:
    try:
        timestamp = int(headers["X-Fonoster-Timestamp"])
        header = headers["X-Fonoster-Signature"]
    except (KeyError, ValueError):
        return False
    if abs(time.time() - timestamp) > 300:
        return False
    expected = hmac.new(SECRET, f"{timestamp}.".encode() + body, hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(sig.strip(), expected) for sig in header.split(","))

@app.post("/hooks")
def hooks():
    if not verify(request.get_data(), request.headers):
        return "", 401
    event = request.get_json()
    # Deduplicate on event["id"], then handle event["type"].
    return "", 200
```

Node servers using `@fonoster/common` can call `Webhooks.verifyWebhook(body, headers, secret)`,
which does the same check.

## Delivery, retries and order

- A delivery succeeds on any 2xx within 10 seconds. Answer quickly and do the work afterwards.
- Otherwise it is retried with exponential backoff: the first retry after 10 seconds, each gap
  double the last, capped at 1 hour, for up to 24 hours after the first attempt. Then it is marked
  `failed`.
- Delivery is at least once. You can get the same event more than once, and out of order.
  Deduplicate on `id`.
- A deleted endpoint's pending deliveries fail.

## Rotate the secret

```sh
fonoster webhooks:rotate <ref>
```

Prints the new secret and until when the previous one is accepted (24 hours). During that window
each request is signed with both secrets, so you can deploy the new secret without dropping
events. Remove the old one after the window.

## Delivery log and resend

The log lists, for each delivery, the event type, status (`pending`, `succeeded`, `failed`),
attempts, the last HTTP status (0 means no response) and the last and next attempt times, newest
first.

```sh
fonoster webhooks:deliveries [<webhook-ref>] [--page-size 50]   # up to 200
fonoster webhooks:resend <delivery-ref>
```

The dashboard's Webhooks page shows the same log with a Resend button. A resend sends the same
event (same `id`) now, with a fresh timestamp and signature. If it fails it goes back on the retry
schedule.

## Migrating from `eventsHook`

The assistant `eventsHook` (`url`, `headers`, `events`) is removed. Create a workspace webhook
instead:

| `eventsHook` | Workspace webhook |
| --- | --- |
| `conversation.started` | `call.started` |
| `conversation.ended` | `call.ended`, then fetch the transcript from the call record (`call_record.sealed` tells you when it is ready) |
| `all` | subscribe to the events you need |
| `headers` (custom auth) | verify the signature; custom headers are not sent |
| one URL per assistant | one endpoint per workspace, for every app type; filter on `data.appRef` |

The chat history is no longer in the payload. Read it from the call record's transcript.
Converting an old assistant with `eventsHook` logs a reminder with its URL.

Deliveries are signed and retried now: update your receiver to verify the signature and answer 2xx.
