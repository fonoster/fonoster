## 1. Registry

- [x] 1.1 `ProviderEntry.endpoints` ({tts, stt, llm}); validated in add and apply (URL scheme, no user info)
- [x] 1.2 `credentialRef` optional (keyless); `label` on providers, models and voices
- [x] 1.3 Remove the fake-adapter guard, `testMode` and `FONOSTER_TEST_MODE`
- [x] 1.4 Prisma: `endpoints`, nullable `credential_ref`, `label` columns + migration; store reads and writes them
- [x] 1.5 CLI: `--endpoints`, `--label`, `--credential-ref` optional
- [x] 1.6 Tests

## 2. API server

- [x] 2.1 `catalog.files`, applied after `catalog.file`
- [x] 2.2 Catalog listing: keyless providers usable without a credential; `keyless` and `label` on items (proto, SDK, types)
- [x] 2.3 Tests

## 3. Gateway (appbridge)

- [x] 3.1 Provider config from the YAML merged over the catalog entry (adapter, capabilities, endpoints); YAML urls win
- [x] 3.2 Catalog providers missing from the YAML: keyless built lazily, others with the workspace's key
- [x] 3.3 Remove `testMode` and the fake checks from config, schema and tests
- [x] 3.4 Tests

## 4. Autopilot

- [x] 4.1 LLM endpoint order: config `endpoints[id]`, `endpoints[adapter]`, catalog `endpoints.llm`, adapter default
- [x] 4.2 Keyless provider (no `credentialRef`): no credential lookup
- [x] 4.3 Remove `testMode` from the hosted config and tests
- [x] 4.4 Tests

## 5. Catalogs and stacks

- [x] 5.1 `mods/conformance/fakes.catalog.yaml`: keyless provider `fake` with endpoints at `fakes:7001-7003`, labeled models `fake/stt`, `fake/tts`, `fake/llm` and voice `fake/default`
- [x] 5.2 Labels in `ops/bundle/config/catalog.yaml` (the dashboard's former names)
- [x] 5.3 Dev overlays: drop the deepgram/openai/groq overrides and `testMode`; `catalog.files` and `registry.platformCredentials: []`
- [x] 5.4 `ops/rebuild/stack`: same, fakes catalog mounted; vendor keys still become platform keys
- [x] 5.5 Bundle test: the production catalog has no fake provider

## 6. Dashboard

- [x] 6.1 Agent form stores catalog ids (voice, STT model, LLM model); provider derived from the id
- [x] 6.2 Configure tab pickers from `getCatalog()`, showing labels; unavailable saved items shown
- [x] 6.3 New-agent defaults from the catalog (templates, create dialog); agents list voice label
- [x] 6.4 Vendor keys screen skips keyless providers; Streams pickers show labels
- [x] 6.5 Mock API, fixtures, stories and tests updated

## 7. Docs, specs and verification

- [x] 7.1 `docs/operators/registry.md`: endpoints, keyless, labels, `catalog.files`; no test mode
- [x] 7.2 Typecheck, lint and tests of the touched packages
- [ ] 7.3 Dev container check: fresh workspace agent works with fakes; Deepgram key + switch uses Deepgram
- [x] 7.4 Sync the delta specs and archive the change
