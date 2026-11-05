# ops-api Specification

## Purpose
Fonoster's own ops API (`mods/ops`), off by default: live metrics and interop alerts behind one bearer token.

## Requirements

### Requirement: Metrics are read live with a read-only connection

With `features.ops` on, `GET /api/ops/metrics` SHALL read current numbers from the databases named in `features.ops.databases` on connections that can't write, opened per request and closed after it. A failure SHALL answer 503 with no host, user, database name or SQL in the body or the log.

#### Scenario: Metrics are read live with a read-only connection
- **WHEN** the bearer's `GET /api/ops/metrics` runs against real migrated databases
- **THEN** it answers one snapshot of schema 1 with the databases' numbers, a write through its connection fails with SQLSTATE 25006, and after failed requests it holds no connection; a database that doesn't exist answers 503 with `{schema, ts, error: "query_failed"}` and no detail
