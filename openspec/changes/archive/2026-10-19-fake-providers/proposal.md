## Why

In the dev container, vendor keys entered in the dashboard have no effect (#993). The dev overlays
reuse the real providers' names for the fakes: the gateway's `deepgram` is set to `adapter: fake`,
and Autopilot's `openai` and `groq` endpoints point at the fake LLM. A workspace key for Deepgram
or OpenAI is then sent to the fake, and the caller still hears the beep. The services also carry
a `testMode` switch, and the registry special-cases the `fake` adapter, so several layers know
test doubles exist.

## What Changes

- The fakes become one ordinary catalog provider, `fake` (stt, tts, llm), with its own labeled
  models and voice, in `mods/conformance/fakes.catalog.yaml`. Dev and test stacks add that file;
  the production catalog does not list it. Nothing outside the conformance package, the `fake`
  adapter and the stack configs knows it is a fake.
- A catalog provider may name its endpoints (`endpoints: {tts, stt, llm}`, URLs, never a secret).
  The gateway and Autopilot use them when their own config has no override.
- A provider may omit `credentialRef`: it is keyless (the fakes, a local model server), usable by
  every workspace, and the dashboard asks no key for it.
- Catalog entries may carry a `label`. The dashboard shows labels, so it no longer keeps its own
  names for voices and models.
- The gateway builds adapters for catalog providers its YAML does not list: keyless ones always,
  others with the workspace's key.
- The API server applies `catalog.file` and then each of `catalog.files`.
- Removed: the registry's fake-adapter guard and `FONOSTER_TEST_MODE`, `testMode` on the gateway
  and Autopilot.
- The agent editor's model, voice and transcriber pickers offer the catalog (like Streams do)
  instead of a hardcoded list. This drops Google and Anthropic, which Autopilot cannot run.
- The dev overlays stop overriding `deepgram`, `openai` and `groq`, and the dev API server has no
  platform credentials: a fresh workspace is offered only the fake provider, so new agents use it
  and work without keys. Storing a vendor key makes that vendor pickable.

## Capabilities

### Modified Capabilities

- `provider-registry`: endpoints, keyless providers, labels; services reach catalog providers they
  do not configure.
- `conformance`: the fake provider is an ordinary catalog provider; no guard or test mode.
- `self-host-installer`: more than one catalog file.
- `developer-environment`: the dev stack offers fake providers next to the real ones.
- `dashboard`: agent pickers offer the catalog.

## Impact

- `mods/common` (registry, Prisma store, providers proto), `mods/apiserver` (migration, catalog
  config and listing), `mods/sdk` and `mods/types`, `mods/appbridge`, `mods/autopilot`,
  `mods/dashboard`, `mods/conformance`, `ops/bundle` (labels), `.devcontainer`, `ops/rebuild`,
  docs.
- Breaking for configs that set `testMode` on the gateway or Autopilot (both configs are strict)
  and for scripts that set `FONOSTER_TEST_MODE`. Only test and dev stacks do.
