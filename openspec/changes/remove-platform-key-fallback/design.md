# Design

## Context

See proposal.md for why. Today (paths under `mods/`):

- `appbridge/src/speech/Catalog.ts` `prepare(workspaceRef)` looks up every keyed provider's
  workspace key at session start, racing each lookup against a 1-second timer and turning errors
  into `undefined` (`.catch(() => undefined)`). `undefined` means "no key", so the session silently
  uses the platform key. `forWorkspace`, `resolveVoice`, `resolveStt`, `defaultStt` and
  `credentialFor` then pick the workspace adapter or the platform one.
- `Call.run` (`appbridge/src/session/Call.ts`) awaits `catalog.prepare` after recording
  `call.started` and before dialing the app, so a refusal there happens before the call is answered.
  The no-app path in `AppBridge.ts` shows the pattern for a refusal: record `call.failed`, send
  `Webhooks.callFailed`, `call.reject(<sip status>)`.
- Autopilot's `LayeredCredentials` (`autopilot/src/session/llm.ts`) already lets a throwing
  workspace source propagate. `createAutopilot` catches it, notes `llm.unavailable`, speaks the
  system error message and hangs up. So Autopilot does not fall back; it only names the reason
  generically.
- Evals: `apiserver/src/applications/evalKeys.ts` lets a throwing lookup propagate into an eval
  error.

## Goals / Non-Goals

**Goals:** one rule everywhere (Cloud and self-hosted alike): an unreadable workspace key never means
the platform key. Reject before answering whenever the failure is known at session start.

**Non-Goals:** retries inside a call; a circuit breaker for the key store; changing what happens
when a workspace simply has no key.

## Decisions

### D1. Three outcomes per provider, not two

`prepare` records each lookup as `key`, `none` or `failed`. Resolution uses the workspace key for
`key`, the platform key for `none`, and refuses for `failed` (a `KeyUnavailable` result carrying the
provider). The per-lookup budget becomes 3 s (one attempt): long enough for a busy database, short
enough to fail a ringing call quickly.

*Alternative:* retry once within the budget. Rejected: a key store that just failed rarely recovers
within the same second, and the caller is waiting.

### D2. Which failures reject the call

Before dialing the app, `Call.run` checks the providers the app is configured to use: the provider of
`speech.voice`, the STT provider (`speech.sttModel`'s provider, or the default STT provider), and
the providers of `filters`. Any `failed` among them: record `call.failed` `{reason: key_unavailable,
provider}`, send the webhook, `reject(503)`, seal a minimal record. A failed provider the app does
not name at session start does not reject the call; if the app later asks for it (`speak` with
another voice), that command gets `error` `key_unavailable`, `fatal: false`.

*Alternative:* reject whenever any keyed provider failed. Rejected: one unused vendor's outage would
take down every call of every workspace that has keys.

### D3. Outbound calls

The same check runs when an outbound call is answered and `run` starts. The callee has already
answered, so the call is hung up rather than rejected, with the same `call.failed` reason.

### D4. Autopilot and evals name the reason

`LayeredCredentials.resolve` wraps a throwing workspace source in `KeyUnavailableError(ref)`.
`createAutopilot` notes `{type: "llm.unavailable", reason: "key_unavailable"}` for it, and keeps the
existing message and hang-up. `evalKeys` wraps lookup errors the same way, so the eval error text
names `key_unavailable`.

### D5. The error code

`key_unavailable` joins `ERROR_CODES` in `common/src/session/schema.ts`, and `session.v1.json` is
regenerated. Apps that don't know the code see an ordinary non-fatal `error`.

## Risks / Trade-offs

- [A key store outage fails every call of workspaces with their own keys] → That is the decision:
  correctness of whose key is used over availability. The `call.failed` reason and a counter
  `fonoster.appbridge.keys.unavailable{provider}` make the outage visible at once.
- [Workspaces without keys are unaffected] → Their lookups answer `none` quickly, unless the store is
  down. Then the lookup fails too, and they are rejected as well. Accepted for the same reason; the
  store is the platform's database, which calls already depend on.

## Migration Plan

Deploy AppBridge, Autopilot and the apiserver in any order; each enforces its own part. Rollback
restores the fallback.
