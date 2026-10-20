# Proposal

## Why

Fonoster measures almost nothing a call consumes: only call duration is recorded. TTS characters,
STT seconds, LLM tokens and noise-cancelling seconds are counted nowhere, and nothing says whether a
vendor was called with the workspace's own key or the platform's. Cloud billing needs these facts
before it can price anything. Self-hosters need them to see their own vendor usage. Metering comes
first because every later piece (the Stripe fake, the billing service) reads what it records.

The model, agreed with the owner on 2026-10-19: **metering records facts; billing prices them
later.** Metering never decides a price or whether something is billable. This change is the
open-source half and runs in every edition.

## What Changes

- A code-defined **meter registry**: each meter's name, unit, how it aggregates and which component
  reports it. Adding a meter only adds an entry.
- A **`usage.v1` contract** for usage lines. Every line carries owner, workspace, app, call, region
  and region kind, **origin** (`call`, `browser_test`, `eval`, `api`), **provider**, model and
  **keySource** (`platform` or `workspace`), the last recorded per provider.
- **Token counts only from the vendor, never estimated.** A completed request with no usage report
  records a `usage_missing` error and alerts operators; only models that report usage can be active
  in the catalog. After a barge-in, Autopilot reads the rest of the response silently so its usage
  still arrives.
- **Counting in the components that do the work.** AppBridge counts call seconds from answer, STT
  seconds, TTS characters, noise-cancelling seconds, AMD detections and seconds, and recording
  seconds. Autopilot counts LLM tokens (in, out, cached) and embedding tokens. The eval runner
  counts eval LLM tokens.
- **Call usage travels in the sealed call record**: a `usage` block in the record and its index
  entry, so per-call usage is signed and auditable. Usage outside a call (evals, storage snapshots)
  is published on a durable JetStream stream, `USAGE`.
- **apiserver ledger**: `usage_events` (append-only, idempotent on deterministic ids) and
  `usage_daily` (rebuildable from `usage_events` at any time).
- **`Usage/GetUsage` RPC**: usage for a workspace or owner by period, grouped by day, workspace,
  meter, provider, key source or origin.
- **Dashboard Usage page** (`/usage`), shown in every edition: minutes, AI usage split by key
  source, test minutes apart from real calls.

Out of scope, each its own later change: removing the platform-key fallback (`key_unavailable`),
the Stripe fake, the billing service (rater, balance, Stripe, admission control) and the Billing
page.

## Capabilities

### New Capabilities

- `usage-metering`: the meter registry, the `usage.v1` contract, what each component reports, the
  usage ledger and its rebuild, and the `GetUsage` API.

### Modified Capabilities

- `call-record`: a sealed record and its index entry carry the call's usage lines.
- `dashboard`: a Usage page in the sidebar, shown in every edition.
- `voice-session`: a reserved `usage.report` message lets Autopilot add its model token usage to
  the call.
- `autopilot`: after a barge-in, the interrupted model response is read to its end, unspoken, so its
  usage is received.
- `provider-registry`: `llm` models must declare the hard feature `usage`; a model whose vendor stops
  reporting usage is alerted and deprecated by an operator.

## Impact

- `mods/appbridge`: counters at the speech, filter, AMD and recording call sites; usage block on
  the working record; browser-test origin carried into the call; `usage.report` from Autopilot.
- `mods/autopilot`: token usage from the LLM adapters' final usage chunk; drain on barge-in;
  embeddings; eval runner.
- `mods/community`: LLM and embedding adapters return token usage when the vendor reports it.
- `mods/callrecord`: `usage` in the record and in `RecordIndexEntry`.
- `mods/common`: `usage` feature in the registry vocabulary and its check; meter registry, `usage.v1` types, `usage.proto` (`Usage/GetUsage`).
- `mods/apiserver`: Prisma models `UsageEvent` and `UsageDaily` with a migration; consumers of
  sealed records and of `USAGE`; the `Usage` gRPC service and its auth rule.
- `mods/sdk`: a `Usage` wrapper over `GetUsage`.
- `mods/dashboard`: Usage page and sidebar entry.
- NATS: new JetStream stream `USAGE`.
- No price, rate card or billable flag anywhere in this change.
