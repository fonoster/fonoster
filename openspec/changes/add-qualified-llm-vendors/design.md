# Design

## Goals

Keep it simple: a short list per vendor, one new adapter, and a test that decides what gets listed.

## D1. Candidates

The goal is two or three models per vendor. All of these go through the test first, and nothing is
listed until the results are in.

| Vendor | Candidates | Reasoning |
| --- | --- | --- |
| OpenAI | `gpt-5.4-mini`, `gpt-6-luna`, `gpt-6-sol`, `gpt-6.1-terra` | `none` |
| Anthropic | `claude-haiku-5-5`, `claude-sonnet-5-5` | Haiku: thinking disabled. Sonnet: `between_tools` |
| Google | `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-3.8-flash` | `minimal`; 3.8 Flash: `low` |
| Groq | `openai/gpt-oss-120b`, `openai/gpt-oss-20b` | `low` |

Notes on specific candidates:

- `gpt-6-sol` rather than `gpt-6.1-sol`: same price, but 6.1 has no `none` level and OpenAI says its
  tool calling requires the Responses API, which our adapter doesn't use.
- `gpt-6.1-terra`: OpenAI's page lists Chat Completions but also says tool calling requires the
  Responses API. The test settles it. If tools fail, `gpt-5.6-terra` is the fallback candidate, at a
  higher price.
- `chat-latest` (Instant) is out: it only accepts reasoning effort `medium`, it is a moving alias, and it
  costs far more than the others.
- Gemini 2.5 models are out: Google is retiring them. `gemini-3.5-flash` is currently served by
  `gemini-3.6-flash`, so testing both would be redundant.

### Listed

Chosen on 2026-11-06 from 20 passes of the test, run from the Dominican Republic. The speed bars were
guidance for this list, not a gate, because a US host should be faster. First token is in ms.

| Model | p50 | p95 | Tools % |
| --- | ---: | ---: | ---: |
| `groq/openai/gpt-oss-120b` | 312 | 938 | 100 |
| `openai/gpt-6-sol` | 773 | 1,212 | 100 |
| `openai/gpt-5.4-mini` | 693 | 1,615 | 97.1 |
| `anthropic/claude-haiku-5-5` | 516 | 690 | 92.9 |
| `openai/gpt-6.1-terra` | 904 | 1,423 | 100 |
| `google/gemini-3.1-flash-lite` | 882 | 1,928 | 100 |
| `google/gemini-3.6-flash` | 992 | 1,962 | 100 |
| `openai/gpt-6-luna` | 797 | 2,079 | 98.6 |
| `anthropic/claude-sonnet-5-5` | 1,536 | 1,926 | 97.9 |

Left out:

- `groq/openai/gpt-oss-20b` (tools 86.1%): it books before the caller has given all the details.
- `google/gemini-3.5-flash-lite` (tools 93.9%): 17 of 20 Spanish transfer requests didn't call `transfer`.
- `google/gemini-3.8-flash` (p50 2,492, p95 5,201): too slow for voice.
- `gemini-4-argon`: 2.3 to 29 seconds to first token in 5 direct requests, and it can't go below `low`.
- `gemini-3.7-flash`: served by 3.8 Flash. `gemini-omni-*`: Interactions API only.

Self-hosted installs keep the base catalog (Deepgram and `gpt-5.4-mini`) and add what they want.
Fonoster Cloud applies `ops/cloud/config/catalog.yaml` in its place: the whole list of what Cloud offers,
with nothing retired, so the repository says what production offers. Applying a file never removes a row,
and the registry has no delete command, so production's leftover rows (`gpt-oss-20b`, Llama, the retired
OpenAI models, ElevenLabs) were deleted with SQL on 2026-11-06. No config used them. `gpt-oss-20b` had to go before
Groq is listed, or it would come back. #1241's generator, CI check and removals from Cloud are not part of this
change, and #1241 needs updating for this.

Haiku is listed below the 95% tool bar, on the user's decision. `gpt-5.4-mini` stays the default.

## D2. Adapters

- **OpenAI:** the existing adapter.
- **Groq:** the existing adapter. A model with the new feature `reasoning-low` is sent
  `reasoning_effort: "low"` and `include_reasoning: false`. This is per model because other Groq
  models that installs may have added might reject it.
- **Google:** a new native adapter at `@fonoster/community/google`, on `streamGenerateContent`. Google labels its
  OpenAI-compatible layer beta. Timed directly, the native API was faster than that layer, but the
  full test showed no gain on `gemini-3.5-flash-lite` (p50 858 vs 854 ms). It takes a thinking level directly and sends back
  each function call's thought signature. A bad key comes back as HTTP 400 with `API_KEY_INVALID`, which
  the adapter treats as a rejected key.
- **Anthropic:** a new native adapter at `@fonoster/community/anthropic`, using `fetch` and SSE like
  the OpenAI one. Anthropic's compatibility layer has no prompt caching and Anthropic doesn't
  consider it production-ready. The adapter sends `thinking: {type: "disabled"}`, because thinking
  tokens count against `max_tokens` and delay the first word. With thinking off there are no thinking
  blocks to keep between tool rounds. Sonnet can't turn thinking off, so testing it means carrying
  thinking blocks through tool rounds in a vendor-data field; that comes after Haiku works.

The Anthropic adapter maps our history to the Messages API:

- System messages go in `system`.
- Tool results become `tool_result` blocks in a user message, and consecutive ones are merged.
- Empty assistant text is left out.
- A conversation that opens with the first message from the agent is valid input. Qualification has
  a scenario for it.
- `stop_reason: "refusal"` surfaces as a `ThinkError`.

## D3. Temperature

Several models refuse or ignore temperature:

| Model | Temperature |
| --- | --- |
| `claude-haiku-5-5` | Docs say to omit it; a value below 1 can return a 400 |
| `gpt-6-luna`, `gpt-5.4-mini` | Accepted at reasoning `none`, which is how we run them |
| `groq/openai/gpt-oss-*` | Accepted, no restriction listed |
| `gemini-3.5-flash-lite` | Not documented; Gemini 3.6 and later ignore it, so qualification finds out |

A new soft feature, `fixed-sampling`, marks a model that doesn't take temperature. The resolver
leaves temperature out of the request. The dashboard keeps the control and adds a note that this model
doesn't use it. A stored value stays in the agent and has no effect, so switching models never causes
a 400 and switching back restores it.

We use a feature rather than the catalog's `settings` list because `settings` is empty on every
existing language model entry, including ones operators have added. Treating empty as "no
temperature" would change those installs.

## D4. Prompt caching

| Vendor | What we do | Minimum prompt |
| --- | --- | --- |
| OpenAI | Nothing, automatic | 1,024 tokens on GPT-5.6 and later; varies on earlier models |
| Groq | Nothing, automatic | 128 to 1,024 tokens |
| Google | Nothing, automatic | Not listed for Flash-Lite |
| Anthropic | One top-level `cache_control: {type: "ephemeral"}` | 512 tokens |

Anthropic reports cached tokens outside `input_tokens`, while `TokenUsage.cachedTokens` is part of
`inputTokens`. The adapter sets `inputTokens` to input plus cache read plus cache creation, and
`cachedTokens` to cache read. Cache writes cost 25% more than input and have no meter, so on platform
keys they are metered as plain input. That difference is accepted for now.

The system prompt and tool list must stay stable across a call's requests. They already do.

## D5. Testing models with `applications:eval`

There is no separate tool. The eval command already runs the real `Agent` and state machine, and it
resolves models the way a live call does (D6). Testing a candidate is:

```bash
fonoster applications:eval -f agent.yaml --model openai/gpt-6-luna --repeat 20 \
  --max-first-token-p50 700 --max-first-token-p95 1300 --min-tool-pass 95
```

Changes to the command and what's under it:

| Change | Detail |
| --- | --- |
| `--model` | Replaces the file's `languageModel.model` |
| `--repeat` | Runs the whole eval that many times, one after another, from the client |
| `first_token_ms` | New optional field on `StepEvaluationReport`. The engine measures it, but the stream drops it |
| Summary | First token p50 and p95, step and tool pass rates, and errors. Shown with `--repeat`, and in the JSON output |
| Bars | Optional flags: first token p50 and p95, tool pass, step pass. With none, every scenario must pass |
| `tools: []` | Now means the model must not call a tool on that step. Leaving `tools` out still skips the check |
| Exit code | Non-zero when a scenario fails, a bar is missed, or the eval errors. **This changes behavior** for scripts that run the command today |
| Canned tool results | Optional `result` on `expected.tools[]`, and `toolResults` for any step, returned to the model instead of `{status: "ok"}` |

Only steps with no expected tool count toward first token, because `firstTokenMs` on a tool step
covers two model requests. Those steps are reported separately.

We test candidates with one agent, `mods/conformance/llm/agent.yaml`, and an npm script holding our
bars, `npm run llm:test -- <catalog id>`. It has a system prompt over 1,024 tokens and these scenarios,
in English and Spanish, with the agent opening the call:

1. A question the prompt answers, where no tool should be called.
2. A request that needs one tool, with arguments.
3. Arguments collected over several turns, then the tool.
4. A tool result the reply must repeat correctly.
5. A goodbye that needs `hangup`.
6. A request that needs `transfer`.

Starting bars, to be tuned after the first run:

| Check | Bar |
| --- | --- |
| First token | p50 at most 700 ms, p95 at most 1,300 ms |
| Right tool with valid arguments | At least 95% |
| Steps that pass, reply text included | Reported only: the judge gives different answers for the same reply |
| Language model errors | 0 |

The agent sets `evalsSystemPrompt`. The default judge compares intents and ignores entities, so a reply
with a wrong date would pass it.

The speed bar is on first token at the lowest reasoning level, not tokens per second. Published
throughput often comes from high reasoning levels, where the caller would wait many seconds for the
first word.

The first run happens locally in the dev container, which is enough to compare models. The numbers
reflect where apiserver runs, so final bars need a run from a host in the production region.
Candidates must be in that install's catalog, because evals resolve through it.

## D6. Evals

`sessionThinkFor` looks up `OPENAI_COMPATIBLE` by provider id and never passes catalog features. So
`fonoster applications:eval` sent `max_tokens` to `gpt-5.4-mini`, which refuses it (#1239), and any
provider not named in that table fell through to LangChain. `apiserver` now gives evals the catalog,
and they resolve models with `RegistryLlmResolver`, the same code live calls use. The judge stays on
OpenAI.

## D7. Billing

The launch card charged every language model $0.40 in and $1.60 out per million tokens, below vendor
cost for most listed models, including `gpt-5.4-mini`. Card 2 (`mods/billing/rate-cards/20261110.yaml`)
prices each model at vendor cost, from 2026-11-10. Margin stays in the $0.05 a minute, as with speech.

`llm.tokens.in` held all input and `llm.tokens.cached` the cached part, and each line is rated alone, so a
cached token was billed at both prices. `usageLines` now subtracts cached from input. The Usage and
call pages read "in" as uncached input from then on, and past calls keep their old counts.

A model missing from the card is not billed and raises the existing alert, so the card has no
wildcards for language models. Gemini 3.6 Flash doubles on 2027-01-01 and needs a new card by then.

## Risks

- **Speed on a US host is expected, not measured.** The listed models need a run from there.
- **Published benchmarks are vendor-run and partial.** That is why the decision rests on our test.
- **Google's layer is beta.** The scheduled run would catch a break, and a native adapter is the
  fallback.
- **One fixed agent can't represent every customer.** It sets a floor, not a guarantee.
