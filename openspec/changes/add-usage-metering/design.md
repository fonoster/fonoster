# Design

## Context

See proposal.md for why. The overall model (metering records facts, billing prices them; billing
is a separate service added later) is in the planning doc "Metering & Billing: How It Works"
(2026-10-19). Current state that shapes this design (paths under `mods/`):

- **AppBridge owns the call.** `Call` is built at `appbridge/src/AppBridge.ts:320`. `startedAt` is
  set at construction (`session/Call.ts:185`). There is no answer timestamp, only `answeredBy`,
  set in `attach()` (`Call.ts:550-555`) and, for outbound calls, on the media `call.answered` event
  (`AppBridge.ts:589-603`). `finish()` (`Call.ts:634`) computes `durationSeconds` from
  `startedAt`, so it includes ringing.
- **Speech call sites.** TTS is synthesized at `session/OutputQueue.ts:370`. STT frames enter at
  `Call.callerAudio` (`Call.ts:1050`), go through the filter chain (`Call.ts:1063-1068`) and then
  to the adapter. Frames are 20 ms (`OutputQueue.ts:22-23`). Resolutions carry the catalog id
  (`<provider>/<id>`) but no provider field (`speech/Catalog.ts:32-49`).
- **Key source.** `Catalog.usesWorkspaceKey(provider, ws)` (`Catalog.ts:226`) answers the speech
  side and has no callers. In Autopilot, `LayeredCredentials.get` (`autopilot/src/session/llm.ts:53-63`)
  returns only the key string, so Autopilot cannot tell the workspace key from the platform key.
- **No token counts anywhere.** `ThinkChunk` (`community/src/llm.ts:30-32`) has text and tool
  calls only, and the OpenAI adapter streams without `stream_options`. Embeddings run in
  `autopilot/src/knowledge/AbstractKnowledgeBase.ts:64-67,78`.
- **Autopilot reaches AppBridge only over the session WebSocket** (`session.start` at
  `Call.ts:780`). It has no NATS connection. `record.note` is the precedent for a message reserved
  for Fonoster's own apps.
- **Evals run inside the apiserver** (`applications/buildService.ts`, keys from
  `applications/evalKeys.ts`), through `autopilot/src/models/evaluations/*`.
- **Call records.** The index entry (`callrecord/src/indexEntry.ts:26-48`) is published on
  `callrecord.sealed` (`AppBridge.ts:288-295`). The apiserver consumes it durably
  (`apiserver/src/records/createIndexRecord.ts`, stream `FONOSTER_RECORD_INDEX`, durable
  `apiserver-call-records`) with `consumeDurable` (`apiserver/src/core/durableConsumer.ts:55`, a
  work-queue stream with a 24 h max age). Private-region agents forward the same index entries
  (`region-agent/src/agent.ts:223`).
- **Test calls.** `TestCallVerifier.check` (`appbridge/src/testCalls.ts:78-93`) returns `{ok:true}`
  both for a valid test token and for a call with no token, so origin is lost.

## Goals / Non-Goals

**Goals:**

- One durable path per kind of usage, with no second write for the same fact.
- Counting adds no latency to a call: counters are in-memory increments, flushed at seal time.
- Everything downstream of usage lines can be rebuilt.

**Non-Goals:**

- Prices, rate cards, balances, billable flags or admission control (billing change).
- Removing the platform-key fallback in `Catalog` (the `remove-platform-key-fallback` change). Until
  then a fallback is recorded truthfully as `keySource: platform`.
- Replacing `RegionUsage` (minutes per private region). It stays until billing reads `usage_daily`.
- Real-time usage during a call. Totals update when a call is sealed.

## Decisions

### D1. Call usage rides in the sealed record

AppBridge keeps a `CallUsage` accumulator per call: a map keyed by
`(meter, provider, model, keySource)` holding a quantity. At `finish()` it
writes the lines into the working record. The sealed record and the index entry both carry
`usage: UsageLine[]`, so the lines are signed with the record.

The apiserver's existing record-index consumer writes the index row and the usage lines in one
transaction. No new consumer and no extra NATS publish are needed for calls. Private regions need
no change, since their agents already forward index entries.

*Alternative:* publish each counter to NATS as it changes. Rejected: many small events per call, a
second source of truth beside the record, and lost events when AppBridge dies before publishing.
The record is already written durably part by part (call-record spec).

### D2. `call.seconds` from a new `answeredAt`

Set `answeredAt` where `answeredBy` is set (`attach()`, and the outbound `call.answered` handler).
`call.seconds = round((endedAt - answeredAt) / 1000)`, and there is no line when `answeredAt` is
unset. `durationSeconds` in the index keeps its meaning (from start), so analytics and the
dashboard don't change.

### D3. What each counter measures

| Meter | Measured at | Rule |
| --- | --- | --- |
| `stt.seconds` | frames handed to the STT adapter after filters | frames × 20 ms, per STT resolution; whole seconds at seal, rounded up |
| `tts.characters` | `OutputQueue` before `adapter.synthesize` | Unicode code points of the text sent; played files and pre-recorded media are not counted |
| `nc.seconds` | each filter slot in `createAudioFilterChain` | frames processed × 20 ms, per filter provider; a slot that failed open stops counting |
| `amd.detections`, `amd.seconds` | `AmdListener.run` after classification | 1 detection per classification; seconds = the result's `audioMs` / 1000 |
| `recording.seconds` | `CallRecording.start` / `stop` | wall time between them, summed over restarts |
| `llm.tokens.*`, `embedding.tokens` | Autopilot, reported with `usage.report` (D4) | vendor counts only (D6) |
| `eval.*` (`llm.tokens.*`, origin `eval`) | apiserver eval path (D5) | same as LLM |
| `storage.bytes` | nightly job in the apiserver (D8) | bytes held per workspace that day |

The provider is the catalog id's prefix. The model is the catalog id when the line has one; for TTS it is the voice's catalog id, since apps name a voice, not a model. With no STT model configured, the line names the deployment's default STT provider.

### D4. Autopilot reports tokens with `usage.report`

The LLM and embedding adapters in `community` gain an optional final `usage` chunk
(`{inputTokens, outputTokens, cachedTokens}`). OpenAI-compatible adapters ask for it with
`stream_options: {include_usage: true}`. `LayeredCredentials.get` returns `{key, source}`, with
`source` `workspace` or `platform`.

Autopilot sends `usage.report` after each turn, summed per provider, model and key source.
Embeddings report the knowledge-base load and each search. AppBridge accepts the message only from
`AUTOPILOT` apps and only for the allowed meters (voice-session delta), then adds the lines to
`CallUsage`.

*Alternative:* give Autopilot a NATS connection and publish to `USAGE`. Rejected: a new dependency
for Autopilot, and the tokens would not be in the signed record.

### D5. `USAGE` stream for usage outside a call

Subject `usage.<workspaceRef>.<meter>`, JetStream stream `FONOSTER_USAGE`, durable
`apiserver-usage`, created by `consumeDurable` with a **7-day** max age (calls keep the 24 h record
stream, but they can be replayed from stored records; see Risks). The eval path publishes one
message per step with `origin: eval` and an id built from `evalRunId + step + meter + provider`.

### D6. Vendor counts only, and draining

Token counts are never estimated (owner, 2026-10-20). Every LLM vendor we ship or plan reports usage
on streams: OpenAI-compatible APIs in a final chunk when `stream_options.include_usage` is set,
Anthropic in `message_start` and a cumulative `message_delta`, and Gemini in `usageMetadata`.
OpenAI warns that an interrupted or cancelled stream may not deliver the final usage chunk, and a
voice agent cancels streams on every barge-in. So Autopilot no longer aborts the HTTP stream when it
stops a reply. It stops consuming text for speech and history, and a background reader drains the
stream to its end and takes the usage chunk. The extra cost is the rest of the interrupted reply's
output tokens, bounded by the agent's `maxTokens`. A drain has a 30 s deadline; when it expires the
request is recorded as `usage_missing`.

A completed request without a usage report produces no token line. It adds a `usage_missing`
record error naming the catalog id (sent as a `record.note` of kind `usage_missing`) and increments
the OpenTelemetry counter `fonoster.usage.missing{catalog_id}`, which the operator alert reads. Checking
that a model reports usage before offering it, and retiring one that stops, are operator tasks done
outside the platform with the existing registry commands.

### D7. Deterministic ids and the ledger

Id = `usg_` + base32(sha256(scope + "|" + meter + "|" + provider + "|" + model + "|" +
keySource))[0..26]. The scope is the `callRef`, the eval step key, or `workspaceRef + day` for
storage. Prisma models:

- `UsageEvent` (`usage_events`): `id` primary key, `ownerRef`, `workspaceRef`, `appRef?`,
  `callRef?`, `region`, `regionKind`, `origin`, `meter`, `unit`, `quantity` (Decimal), `provider?`,
  `model?`, `keySource?`, `occurredAt`, `recordedAt`.
- `UsageDaily` (`usage_daily`): unique on `(ownerRef, workspaceRef, day, meter, provider, model,
  keySource, origin, regionKind)` with `quantity`.

Ingest: `INSERT … ON CONFLICT (id) DO NOTHING`. Only when a row was inserted is `usage_daily`
incremented, in the same transaction, so a replay changes nothing. The owner is resolved at ingest
from the workspace's owner.

Rebuild: `fonoster-usage rebuild --from <day> --to <day>`, a bin in `@fonoster/apiserver`, deletes
the range in `usage_daily` and recomputes it with one `INSERT … SELECT … GROUP BY`.

### D8. Storage snapshot

A nightly job sums `size` from the call-record index per workspace and region kind and writes one
`storage.bytes` line per workspace per day (id scope `workspaceRef + day`). It reads only index
metadata, so it works the same for private regions.

### D9. Origin from the test path

`TestCallVerifier.check` returns `{ok: true, test: boolean}`. AppBridge passes
`origin: test ? "browser_test" : "call"` into `Call`, and every usage line of the call carries it.

### D10. `Usage/GetUsage`

`usage.proto`: `GetUsage(GetUsageRequest{from_day, to_day, group_by[], all_owned})` returns
`rows[]{day?, workspace_ref?, meter, unit, provider?, model?, key_source?, origin?, quantity}`. The workspace comes from the caller's access key. `all_owned` requires the caller to
be the owner and spans every workspace they own (checked in Identity). The service reads only
`usage_daily`. It is registered in `apiserver/src/core/services.ts` and not allow-listed as public.
The SDK gets `Usage.getUsage`.

### D11. Dashboard

Add a `Usage` entry to `NAVIGATION` (`dashboard/src/app/shell/nav.ts`) and a screen in
`screens.tsx`. The page uses `useQuery` over `sdk.usage.getUsage` and copies the list page pattern
of `session/calls.tsx`. It reads no billing capability. The design is drawn in `designs/dashboard.pen`
before coding (Pencil first, the project rule).

## Risks / Trade-offs

- [AppBridge dies before sealing] → Usage is only as durable as the working record, which is
  appended durably. The recovery seal (call-record spec) writes the usage that was flushed. Flush
  `CallUsage` into the working record every 60 s as well, so a crash loses at most a minute.
- [Record stream max age is 24 h; apiserver down longer loses index messages] → Records are in
  object storage; `fonoster-usage rebuild` gets a `--from-records` mode that re-reads sealed
  records for a period.
- [Owner changes after ingest] → `ownerRef` is a fact at the time of use. Billing later attributes
  by the line's owner, which is the correct owner for that period.
- [Draining costs output tokens on every barge-in] → Bounded by `maxTokens`; most of an
  interrupted reply is usually generated already. Measured in conformance and visible as
  `llm.tokens.out`.
- [Groq's streaming usage is confirmed only by secondhand sources] → Operators verify it against the
  live API before offering Groq models on platform keys.
- [A drain holds a vendor connection after the turn moved on] → One drain per interrupted request,
  30 s deadline, closed when the session ends.
- [An Autopilot bug under-reports tokens] → A conformance scenario compares reported tokens with
  the fake LLM's fixed counts (task 8).
- [`usage_daily` hot rows for busy workspaces] → One row per day per dimension combination; the
  increments are per call, not per frame.

## Migration Plan

1. Ship the Prisma migration (new tables only, no change to existing ones).
2. Deploy the apiserver before AppBridge: it accepts index entries with or without `usage`.
3. Deploy AppBridge and Autopilot. Calls sealed before this have no usage. No backfill:
   `RegionUsage` keeps the old minutes.
4. Rollback: older services ignore the new `usage` field and the `USAGE` stream. The tables stay
   and are harmless.

## Open Questions

- How the Usage page shows long periods (more than 3 months): daily bars or monthly totals. This
  can be settled during the Pencil design.
