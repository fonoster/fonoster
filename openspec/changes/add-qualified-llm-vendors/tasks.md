# Tasks

## 1. Evals resolve through the catalog

- [x] 1.1 Evals resolve the model with `RegistryLlmResolver` and the catalog (unit test: `max_completion_tokens` on a reasoning model)

## 2. `applications:eval` tests models

- [x] 2.1 `first_token_ms` on `StepEvaluationReport`: proto, payload, types, SDK (unit test)
- [x] 2.2 Optional `result` on `expected.tools[]`, returned to the model by the eval tool port (unit test)
- [x] 2.3 `--model` and `--repeat`, with the summary in pretty and JSON output (unit test)
- [x] 2.4 Bar flags and a non-zero exit code (unit test)
- [x] 2.5 `mods/conformance/llm/agent.yaml` and `npm run llm:test`; tried on the fake LLM in the dev container with the CLI's flags
- [x] 2.5a Step results are reported without a bar, because the same reply passes on one run and fails on another
- [x] 2.6 Baseline run on `openai/gpt-5.4-mini` in the dev container, 20 passes

## 3. Adapters needed for testing

- [x] 3.1 Feature `reasoning-low` in `features.ts`, the resolver and the adapter, with its check in `llmConformance.test.ts`
- [x] 3.2 Feature `fixed-sampling` in `features.ts` and the resolver, with its check; temperature optional in the adapter
- [x] 3.3 `@fonoster/community/anthropic`: streaming, tool rounds, message mapping, errors, caching and usage, in `ADAPTERS` (tests against a stand-in; new APT case); `llmConformance.test.ts` accepts any adapter with an `llm` factory
- [x] 3.4 Carry thinking blocks through tool rounds for `claude-sonnet-5-5` (test against a stand-in)
- [x] 3.5 `@fonoster/community/google`, native: streaming, tool rounds with thought signatures, errors, usage, in `ADAPTERS` (tests against a stand-in; new APT case)

## 4. First test run and decisions

- [x] 4.1a Run every candidate in `design.md` D1 locally at 20 passes and share the report
- [x] 4.1b Give `check_availability` a canned result on every step, and log in again on each pass of a long run
- [x] 4.1d Rerun every candidate with those fixes and the native Google adapter
- [ ] 4.1c Run the chosen models from a production-region host
- [x] 4.2 Decide which models get listed (design D1); no labeled tier
- [ ] 4.3 Set the final bars from the production-region run

## 5. Listing

- [x] 5.1 Write Cloud's whole catalog to `ops/cloud/config/catalog.yaml`, from production's entries, with `ops/cloud/compose.catalog.yaml` replacing the base file there; the base catalog is unchanged
- [x] 5.1a Check it against production with `registry plan`: only the intended changes
- [x] 5.2 `anthropic`, `google` and `groq` credentials in `autopilot.yaml`, as listed
- [x] 5.3 Dashboard shows a note on Temperature and drops the summary's temperature for `fixed-sampling` models (vitest)
- [x] 5.4 Rate card 2 from 2026-11-10: each listed model at vendor cost (unit test)
- [x] 5.5 `llm.tokens.in` holds uncached input, so cached tokens are billed once (unit test)
- [x] 5.6 "Fonoster key" becomes "Platform key" and the Usage page names Anthropic and Google (vitest)
- [x] 5.6a Delete production's rows that are not in the Cloud catalog (done 2026-11-06; a restart before the deploy re-adds the two retired OpenAI rows from the base file)
- [ ] 5.7 Before 2027-01-01, add a rate card with the new Gemini 3.6 Flash price
- [ ] 5.8 In the production inventory, add the catalog files and the Groq, Anthropic and Google keys (`ops/cloud/README.md`)
- [ ] 5.9 Update #1241 for this lineup: it still retires Groq from Cloud

## 6. Docs

- [x] 6.1 `docs-site/autopilot/test.mdx` and the CLI reference (new flags, exit code), `docs-site/reference/providers.mdx`, `docs-site/autopilot/build-an-agent.mdx`, `docs-site/self-hosting/provider-catalog.mdx` (new features, vendors), changelog
- [x] 6.2 Correct `docs/operators/registry.md`, which lists adapters that don't exist
