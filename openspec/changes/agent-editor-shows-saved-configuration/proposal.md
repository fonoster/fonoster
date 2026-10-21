# Proposal

## Why

The dashboard's end-to-end test "lists and opens an agent with its saved configuration" guards a
production regression (an application's `Struct` configs failed to decode through the real SDK in
the browser, so the editor opened empty). The behavior it guards, that the editor shows exactly what
was saved, is not a promise in the dashboard spec. While bringing the Dashboard area into the QA
catalog (DSH-004, 2026-10-20) the owner asked for the scenario to be added so the test cites a
requirement rather than a comment.

## What Changes

- One scenario added under "Agent pickers offer the catalog": opening a saved agent shows its saved
  prompt, messages, model, transcriber and voice, through the SDK's decoding.

## Impact

- Capability: `dashboard` (one scenario added; requirement text unchanged).
- Code: none. Test: `mods/dashboard/e2e/community.spec.ts` (DSH-004) cites it.
