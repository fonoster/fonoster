# Proposal

## Why

The call detail design shows each tool call with its method, HTTP status, latency, parameters and
response, and "Searched knowledge" rows with the query, the source and the top match. Autopilot's
`autopilot.turn` note carried only `toolCalls: [{ name, ok }]` and knowledge searches weren't
recorded, so the dashboard showed tool names and ok or failed, nothing more (#1067).

Bringing it up also found that the knowledge base handed the model `[object Object]` instead of the
passages it found (LangChain documents joined as strings).

## What Changes

- Autopilot: each `toolCalls` entry of the turn note keeps `name` and `ok` and adds the HTTP
  `method`, `status`, `durationMs`, and the `parameters` and `response` (or `error`) as JSON text.
  A new `knowledgeSearches` field holds each search: `query`, `source` (the top match's document),
  up to three `passages` (`text`, `source`, `score`), `durationMs`, and `timedOut` when the reply
  went without it.
- Size caps: parameters, responses and errors at 2048 characters; queries and passages at 500; a
  cut never leaves part of a number behind.
- No secrets: the tool's URL and headers (where tenant credentials live) are never recorded.
- Redaction: details are text, so the call record's redacted copy masks them like the transcript
  (app notes are already redacted string by string).
- Knowledge bases return passages with their document and score (`searchKnowledgeBase`), and the
  model gets the passage text.
- Dashboard: tool rows show the method, status, latency and an expandable parameters and response;
  "Searched knowledge" rows show the query, the source and the top match.
