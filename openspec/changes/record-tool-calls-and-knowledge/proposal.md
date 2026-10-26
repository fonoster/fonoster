# Proposal

## Why

The call detail design shows each tool call with its method, HTTP status, latency, parameters and
response, and "Searched knowledge" rows with the query, the source and the top match. Autopilot's
`autopilot.turn` note carried only `toolCalls: [{ name, ok }]` and knowledge searches weren't
recorded, so the dashboard showed tool names and ok or failed, nothing more (#1067).

Bringing it up also found that the knowledge base handed the model `[object Object]` instead of the
passages it found (LangChain documents joined as strings).

## What Changes

- Autopilot: each `toolCalls` entry of the turn note keeps `name` and `ok` and adds `startedAtMs`,
  the HTTP `method`, `status`, `durationMs`, and the `parameters` and `response` (or `error`) as
  JSON text. A new `knowledgeSearches` field holds each search: `query`, `startedAtMs`, up to three
  `passages` (`text`, `source`, `score`; the first one's `source` is the top match's document),
  `durationMs`, and `timedOut` or `failed` (with a short `error`) when the reply went without it.
- Size caps: parameters, responses and errors at 2048 characters; queries and passages at 500;
  knowledge errors at 200. A cut drops a trailing run of digits or digit words only when, with what
  follows the cut, it is long enough (13+) to be part of a card number; amounts and words stay.
- Logs: without a call record, the turn is logged with tool names, outcomes, counts and durations
  only, never parameters, responses, errors, queries or passages.
- No secrets: the tool's URL and headers (where tenant credentials live) are never recorded.
- Redaction: details are text, so the call record's redacted copy masks them like the transcript
  (app notes are already redacted string by string).
- Knowledge bases return passages with their document and score (`searchKnowledgeBase`), and the
  model gets the passage text. **Behavior change:** the prompt now includes the passage text (it
  was `[object Object]`), each passage capped at 1,000 characters (the splitter's chunk size), on
  both the session path and the legacy `queryKnowledgeBase`/`createChain` path.
- Dashboard: tool rows show the method, status, latency and an expandable parameters and response;
  "Searched knowledge" rows show the query, the source and the top match, or that the search
  failed. Rows sit at the time the call or search started (older records: at the turn note).
