# @fonoster/conformance

The conformance harness for the Fonoster rebuild contracts (`openspec/changes/archive/2026-10-17-add-conformance-framework`).
Suites talk to an implementation only through its public contract, so a rewrite in any language
passes or fails the same suite unchanged.

What is here:

| Part | Where | Purpose |
| --- | --- | --- |
| Scenario files | `scenarios/<contract>/*.yaml` | Language-neutral cases shared by every runner |
| Scenario format | `SCENARIOS.md`, `schema/scenario.schema.json` | The `fonoster.scenario.v1` format and its JSON Schema |
| Fake provider protocol | `PROVIDERS.md` | What every implementation's `fake` adapters speak |
| TypeScript runner | `src/runner` | `runScenario(scenario, { connect, harness })` |
| Fake app | `src/fakes/FakeApp.ts` | WebSocket server the gateway dials; verifies signatures |
| Fake gateway | `src/fakes/FakeGateway.ts` | Dials an SDK app with a signed request, for SDK suites |
| Fake media node | `src/fakes/FakeMediaNode.ts` | `media-control` commands (in process or over NATS), RTP caller audio out, agent audio recorded |
| Fake providers | `src/fakes/providers` | Deterministic TTS (HTTP), STT (WebSocket) and LLM (OpenAI-compatible) with injectable delays and failures |
| Harness | `src/fakes/FakesHarness.ts` | The fakes as a runner `Harness`: setup, injection, provider-time accounting, named assertions |

## Using the scenarios from another language

The scenario files and the schema ship in the npm package (`scenarios/`, `schema/`). The Python SDK
suite and the Go media node runner load them from the published package of the same version, and
must not keep private copies. Validate every file against `schema/scenario.schema.json` before
running it.

## Running a scenario

```ts
import { FakeGateway, loadScenarios, runScenario } from "@fonoster/conformance";

for (const scenario of loadScenarios("voice-sdk")) {
  const gateway = new FakeGateway({ signingSecret: process.env.APP_SECRET });
  const result = await runScenario(scenario, { connect: () => gateway.dial("ws://localhost:3000") });
  console.log(result.name, result.status, result.reason ?? "");
}
```

## Tests

The package's own tests check every scenario file against the schema and the OpenSpec specs, the
runner, the fakes, and the voice-sdk scenarios against a minimal reference app. The NATS test runs
only when `CONFORMANCE_NATS_URL` is set.

```
npx mocha 'mods/conformance/test/**/*.test.ts'
```
