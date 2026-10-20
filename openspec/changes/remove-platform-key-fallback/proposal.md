# Proposal

## Why

When AppBridge cannot read a workspace's own vendor key (the key store errors, or answers after one
second), it silently uses the platform's key instead (`Catalog.prepare`). The call works, but the
workspace pays for usage on a key it did not choose, and once billing exists it would be charged for
it. The owner decided on 2026-10-19: **no fallback; the call fails with `key_unavailable`**. This
also has to land before the billing service, so usage metered as `keySource: platform` always means
the workspace had no key of its own.

## What Changes

- A workspace key lookup that **fails or times out** is no longer the same as "no key stored". Only a
  lookup that answers "no key" lets a session use the platform key.
- AppBridge looks keys up at session start with a 3-second budget (was 1 second). When a lookup fails
  for a provider the app is configured to use (its voice, its STT, its audio filters), AppBridge
  **rejects the call before answering**: SIP 503, `call.failed` with `reason: key_unavailable` naming
  the provider, and a minimal call record.
- When a provider whose lookup failed is first needed mid-call (a `speak` with another voice),
  AppBridge answers that command with an `error` of the new code `key_unavailable` (not fatal).
- Autopilot: a failed lookup of the workspace's LLM key ends the call as today (system error message,
  hang-up), with the record note reason `key_unavailable` instead of `llm.unavailable`.
- Evals: a failed workspace key lookup returns an eval error naming `key_unavailable`.
- The session protocol gains the error code `key_unavailable`.

## Capabilities

### New Capabilities

### Modified Capabilities

- `provider-registry`: a workspace key that cannot be read never falls back to the platform key.

## Impact

- `mods/appbridge`: `Catalog.prepare` records failed lookups per provider; `Call.run` rejects with 503
  and `key_unavailable`; resolutions for a failed provider return `key_unavailable`.
- `mods/common`: `key_unavailable` in `ERROR_CODES` (session schema, exported `session.v1.json`).
- `mods/autopilot`: `KeyUnavailableError` from `LayeredCredentials` when a workspace source throws;
  the note's reason.
- `mods/apiserver`: eval key lookup errors named `key_unavailable`.
- No change for workspaces without their own keys, or when the key store answers.
