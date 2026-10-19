# Docs checkpoint — reference/providers

Started: 2026-10-19
Current stage: 7 — Wire (done; awaiting owner review)

**Purpose:** Look-up page for the default provider catalog (providers, STT and TTS models, voices with languages, LLMs), where catalog IDs go, how deprecation and retirement reach a developer, and a pointer to BYO keys.

**Diátaxis type:** reference
**Reader:** developers building on Fonoster

**Placement:** new `docs-site/reference/providers.mdx` · slug `reference/providers` · nav group `Reference`

**Sources:**
- ops/bundle/config/catalog.yaml
- mods/common/src/registry/Registry.ts (deprecate, retire, resolve), prisma.ts (usage = saved apps/agents)
- mods/apiserver/src/providers/createProvidersHandlers.ts (retired hidden), registryUsage.ts
- mods/apiserver/src/applications/session/appModel.ts (checkCatalogIds)
- mods/ctl/src/commands/providers/catalog.ts
- mods/community/src/openai/index.ts (OPENAI_COMPATIBLE)
- docs/providers.md, docs-site/workspace/provider-keys.mdx

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | no gates (BRIEF) |
| 4 | Assets | skipped | reference page, no picture needed |
| 5 | Draft | done | |
| 6 | Proof | done | renders 200 on :3334 |
| 7 | Wire | done | nav entry listed in report; docs.json not edited |

## Unverified
- Whether Fonoster Cloud's catalog equals the seed: not established, so the page says 'default catalog'.
- Meaning of 'multi' (several languages in one call).
- Ollama on self-hosted installs.

## Decision log
- 2026-10-19 — Listed the retired Groq Llama model so readers searching for it find the replacement.
- 2026-10-19 — Left out per-model 'settings' (stability etc.): no developer surface sets them.
