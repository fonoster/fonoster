# @fonoster/ops

Fonoster's own ops: off by default, not for self-hosters. The API server loads this package only
when `features.ops` is on, for the one host that runs Fonoster Cloud. It serves interop alerts,
recordings and live metrics over HTTPS with one bearer token, and runs the interop scan in the
background.

## Configuration

In `config/fonoster.yaml`. Default when absent: off, and these paths don't exist (Express's own 404).

```yaml
features:
  ops:
    enabled: true
    secret: "${OPS_SECRET}"             # required when enabled: s + openssl rand -hex 16
    interop:
      intervalMinutes: 5                # default; positive integer
    databases:                          # all required when enabled
      fonoster: "${OPS_DB_FONOSTER_URL}"
      identity: "${OPS_DB_IDENTITY_URL}"
      routr: "${OPS_DB_ROUTR_URL}"
      billing: "${OPS_DB_BILLING_URL}"
```

- `enabled: true` with no `secret`, or one not matching `^s[0-9a-f]{32}$`: the API server exits at
  start with `invalid apiserver config at <file>: features.ops.secret: ...`, the value not printed.
- `enabled: true` with a database missing: it exits at start naming `features.ops.databases.<key>`.
- `secret: "${OPS_SECRET}"` with the variable unset: the loader's existing error,
  `references undefined environment variable ${OPS_SECRET} and no default was given`. So these
  lines never go in `config/fonoster.example.yaml` or the bundle's `fonoster.yaml`.

A URL on a managed Postgres with a private CA needs `?uselibpqcompat=true&sslmode=require`. pg's bare
`sslmode=require` means verify-full and fails with `DEPTH_ZERO_SELF_SIGNED_CERT`.

The paths are fixed here: Routr's traces at `/var/routr/traces`, state at `/var/lib/fonoster/ops`.

Setting it up on a host is in `ops/cloud/README.md`.

## HTTP

The bearer is checked first on every `/api/ops/*` request, any method. Only the `Authorization`
header counts.

| Request | Status | Body |
| :--- | :--- | :--- |
| No `Authorization: Bearer <token>`, or a wrong one | 401, `WWW-Authenticate: Bearer` | `{"error":"unauthorized"}` |
| `GET /api/ops/interop/alerts`, last pass fine or none finished yet | 200, `application/json` | `{"alerts":[Alert, ...]}`; `{"alerts":[]}` when `state.json` doesn't exist |
| Same, the last pass failed, or `state.json` can't be read | 503 | `{"error":"scan_failed"}` |
| `GET /api/ops/interop/recordings/<file>` | 200, `application/x-ndjson`, `Content-Disposition: attachment; filename="<file>"` | the file's bytes |
| Same, `<file>` fails `^[0-9A-Za-z:.-]+-[A-Za-z0-9._@-]{1,128}\.jsonl$`, or can't be read from the traces folder | 404 | `{"error":"not_found"}` |
| `GET /api/ops/metrics` | 200, `application/json` | one snapshot, schema 1 ([schema/snapshot.v1.json](schema/snapshot.v1.json)) |
| Same, a connection or query fails | 503, `application/json` | `{"schema":1,"ts":"2026-11-05T14:00:00Z","error":"query_failed"}` |
| Any other `/api/ops/*` path or method, with the token | 404 | Express's own |

An Alert, built from `state.json`; failures come first, then evidence, each newest first:

```json
{"kind":"evidence","far_end":"whatsapp","case":"IOP-004","time":"2026-11-05T14:00:00Z","file":"20261105T133702321Z-a84bc1.jsonl"}
{"kind":"failure","far_end":"telnyx","signature":"488 to INVITE","count":3,"time":"2026-11-05T14:00:00Z","file":"20261105T131010000Z-9f2e7d.jsonl"}
```

`time` is the recording's modification time; `count` is that UTC day's calls. What each alert means
is in `mods/conformance/catalog/areas/interop.md`.

## Logs

- A failed scan: `ops: interop scan failed: <path> <error code>`, never a recording's content.
- A recording the scan skipped: `ops: interop scan skipped <file>`, by name only.
- A failed metrics request: `ops: metrics query failed: features.ops.databases.<key>`, never the
  error, so no host, user or URL.

A request logs nothing with a header value.

## What the numbers mean

The route reads each database with a connection that can't write (`default_transaction_read_only`),
opened per request and closed after it.

- `github`: a user with no password column set.
- `verified`: `email_verified`.
- `activated_7d`: a workspace created in the last 7 days with a completed call of 10 seconds or more
  (`activated_loose_7d`: any call).
- `activated_total`: a workspace with a completed call of 10 seconds or more, any time (a deleted
  workspace's calls still count).
- converted: an owner's first grant paid through Stripe (`balance_ledger` kind
  `plan_grant`/`topup_grant`, source `invoice:%`).
- `credits_*`: credits (1 credit = $0.01), rounded down. `purchased`: grants paid through Stripe;
  `free`: every other grant (trial, operator), less what a trial carry-over moved to a new grant;
  `purchased_used` and `free_used`: debits taken from them; `overdraft`: usage no grant has paid
  yet; `expired`: what grants lost when they expired. Refunds aren't in the ledger yet.

The document of the shape is [schema/snapshot.v1.json](schema/snapshot.v1.json).
