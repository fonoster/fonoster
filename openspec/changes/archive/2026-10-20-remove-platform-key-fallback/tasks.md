# Tasks

## 1. AppBridge (mods/appbridge, mods/common)

- [x] 1.1 `key_unavailable` in `ERROR_CODES`; regenerate `schema/session.v1.json`; verify the schema test and that apps receive it as a normal error
- [x] 1.2 `Catalog.prepare`: record `key` / `none` / `failed` per provider with a 3 s budget; resolutions and `credentialFor` return a `KeyUnavailable` result for `failed`; verify unit tests: error → failed, 4 s → failed, undefined → none (platform key), key → workspace key
- [x] 1.3 `Call.run`: before dialing, check the app's voice, STT and filter providers (D2); on failure record `call.failed` `{reason: key_unavailable, provider}`, send the webhook, `reject(503)` inbound or hang up outbound (D3), minimal record; counter `fonoster.appbridge.keys.unavailable`; verify tests with a failing key source for each scenario of the spec delta (store fails, slow store, no key stored, noise cancelling)
- [x] 1.4 `speak` (and play of a voice) for a `failed` provider answers `error` `key_unavailable`, `fatal: false`, and calls no vendor; verify the "provider first needed mid-call" scenario

## 2. Autopilot and evals

- [x] 2.1 `LayeredCredentials.resolve` throws `KeyUnavailableError` when a workspace source throws; `createAutopilot` notes reason `key_unavailable`; verify tests: system error message spoken, hang-up, note reason, no request to the model
- [x] 2.2 `evalKeys` wraps lookup errors as `key_unavailable`; verify the eval error test

## 3. Docs

- [x] 3.1 Vendor keys page (docs-site/workspace/provider-keys.mdx) and the session protocol reference list `key_unavailable` and what happens; verify the docs build has no broken links

## Workflow follow-up

- Archive after merge; next change: `add-stripe-fake`.
