# Proposal

## Why

Autopilot agents can pick one language model: `openai/gpt-5.4-mini`. Live calls have a single
OpenAI-compatible client, so Anthropic and Gemini can't take a call, and Groq is missing from the
shipped catalog. Vapi, Retell and Jambonz all offer these vendors.

We won't compete on the length of the list. A voice agent needs a model that is fast and good at
tool calling, so the catalog should hold only models that have proved both.

## What Changes

- Autopilot: live calls can run on Anthropic, Google, OpenAI and Groq. Each model runs at the lowest reasoning level it allows.
- `fonoster applications:eval` gains `--model`, `--repeat`, a speed and tool-calling summary, optional
  bars and a failing exit code. Anyone can test an agent across models, and we use it with one fixed
  agent to test candidates before listing them.
- The catalog: the models listed were chosen from that test's results (design D1), since a run from
  the Dominican Republic overstates first-token times for a host in the US.
- Fonoster Cloud lists all nine, from one catalog file in the repository that replaces the base one
  there. Self-hosted installs keep the base catalog and can add the rest.
- Billing: a new rate card, from 2026-11-10, prices language model tokens by model at vendor cost.
  `llm.tokens.in` now holds uncached input, which stops cached tokens being billed twice.
- Dashboard: "Fonoster key" becomes "Platform key" on the Usage page.
- Prompt caching: Anthropic requests ask for it, and the other vendors cache automatically.
- Evals: models resolve through the catalog with `RegistryLlmResolver`, so evals run the way live calls do.
  This also fixes evals sending `max_tokens` to reasoning models.
- Dashboard: Temperature stays visible, with a note on models that don't use it.

## Not in this change

- A CI check that blocks untested catalog models. For now, the eval result goes in the pull request.
- Cache hit rate in the eval summary.
- Failover between models, and a deadline on language model requests. A stalled vendor can still
  cause dead air.
- A reasoning setting on agents. Reasoning adds silence before the reply, so it stays at the lowest
  level the model allows.
- `priority` or service tiers.
- Speech-to-speech models.
- Knowledge base changes, including moving per-turn knowledge after the history. Until that happens,
  a turn with knowledge misses most of the prompt cache.
- Removing the LangChain chat layer. This change leaves it unused for these vendors; removal is a
  follow-up, because `@fonoster/autopilot` exports it.
