# Running the conformance suites

The conformance framework (`openspec/changes/archive/2026-10-17-add-conformance-framework`) holds the rebuild to its
contracts. Scenario files in `mods/conformance/scenarios` script one side of a contract (session
protocol, Twilio protocol, voice SDK, media-control, Autopilot) and say what the other side must
send back. Any implementation, in any language, passes or fails the same files. The format is in
`mods/conformance/SCENARIOS.md`; the fake providers are in `mods/conformance/PROVIDERS.md`.

## Layers

| Layer | Plays | Under test | Needs |
| --- | --- | --- | --- |
| Fake node | Fake Roomr node and fake STT, TTS and LLM | AppBridge (TypeScript) | NATS |
| Go node | A SIP caller bot, the test plays AppBridge | `go/roomr` | NATS, Go 1.26 |
| Real stack | Caller bot through Routr, real AppBridge and node | Everything together | Routr, node, appbridge (nightly, not yet automated: conformance task 2.5 and 3.11) |

## Quick start

NATS is the message bus for AppBridge and Roomr node suites. Use a throwaway server and never
point tests at a shared one.

```sh
docker run -d --name conformance-nats -p 4222:4222 nats:2.11.8
export CONFORMANCE_NATS_URL=nats://127.0.0.1:4222 LOGS_LEVEL=none
npm install && npm run build
```

### Fake node (no containers other than NATS)

```sh
npx mocha --exit --timeout 30000 \
  mods/appbridge/test/conformance.test.ts \
  mods/appbridge/test/integration.test.ts \
  mods/appbridge/test/crash.test.ts \
  mods/autopilot/test/session/fullstack.test.ts
```

`mods/conformance/test` checks every scenario file against the schema and the OpenSpec specs, the
runner, the fakes and the SDK scenarios, and runs without NATS (`nats.test.ts` needs it):

```sh
npx mocha 'mods/conformance/test/**/*.test.ts' --exit --timeout 30000
```

### Go Roomr node

```sh
cd go/roomr
test -z "$(gofmt -l .)" && GOTOOLCHAIN=local go vet ./...
GOTOOLCHAIN=local go test -race ./...          # e2e tests run when CONFORMANCE_NATS_URL is set
cd ../.. && npx mocha --exit --timeout 30000 \
  mods/conformance/test/media-control.test.ts \
  mods/conformance/test/media-control-go.test.ts \
  mods/appbridge/test/gonode.test.ts
```

`media-control.test.ts` runs the same `media-control` files against the fake node;
`media-control-go.test.ts` runs them against the real Go node, which is how both are kept in step.

### Real stack

Real SIP calls need Routr and the whole platform up (the dev container's `npm run dev`, or
`ops/rebuild/stack up`). The caller bot
(`go/roomr/cmd/sipcaller`) places the calls; the nightly end-to-end suite is still to be wired
(conformance tasks 2.5 and 3.11). Until then, run the Go node against AppBridge with
`mods/appbridge/test/gonode.test.ts`, which is the closest automated check.

### Timing, load, turn-taking and Pipecat (nightly)

```sh
CONFORMANCE_TIMING_RUNS=200 CONFORMANCE_REPORT_DIR=reports npx mocha --timeout 0 mods/appbridge/test/timing.test.ts
npx tsx mods/appbridge/scripts/scale.ts --calls 100 --seconds 60
npx tsx mods/appbridge/scripts/replay.ts
python -m pip install -r python/pipecat-golden/requirements.txt
PIPECAT_PYTHON=python npx mocha --timeout 60000 mods/appbridge/test/pipecat.test.ts
```

The pass bars (T1 at 50 ms p95, and so on) hold only on dedicated runners. Shared CI runners
report trends.

## Python SDK and runner

```sh
cd python
uv venv .venv --python 3.12
uv pip install --python .venv/bin/python -e fonoster-conformance -e "fonoster-voice[test]"
.venv/bin/python -m pytest fonoster-conformance/tests fonoster-voice/tests
```

## Running the scenarios from a third-party SDK

Your SDK is under test when the scenario's `role` is `appbridge`: the runner plays AppBridge and dials
your app. For each `voice-sdk` scenario you ship one fixture app per name in
`mods/conformance/scenarios/voice-sdk/FIXTURES.md` (for example `say-hello`, `gather-echo`) and the
runner starts it.

Use the Python package as a library, or port its runner (`runner.py`) to your language:

```python
import asyncio
from fonoster_conformance import FakeAppBridge, load_scenarios, run_scenario
from fonoster.voice import VoiceServer   # replace with your SDK

SECRET = "sdk-conformance"

async def main():
    for scenario in load_scenarios("voice-sdk"):
        fixture = FIXTURES[scenario["fixture"]]   # the app for this fixture, written in your SDK
        server = await VoiceServer(port=0, host="127.0.0.1", signing_secret=SECRET).listen(fixture)
        try:
            appbridge = FakeAppBridge(signing_secret=SECRET)
            result = await run_scenario(scenario, lambda: appbridge.dial(f"ws://127.0.0.1:{server.port}/"))
            print(scenario["name"], result.status, result.reason or "")
        finally:
            await server.close()

asyncio.run(main())
```

(`python/fonoster-voice/tests/test_conformance.py` is the complete working example, including every
fixture.) Rules for a runner in a new language:

1. Load scenarios from the published `@fonoster/conformance` package of the same version and
   validate each against `schema/scenario.schema.json`. Do not keep private copies. The Python
   runner reads the directory from `FONOSTER_CONFORMANCE_DIR`, defaulting to this repository.
2. Implement the matcher exactly as in `SCENARIOS.md`.
3. Fail, never skip silently, anything the runner does not understand.
4. Sign the connection with `X-Fonoster-Timestamp` and `X-Fonoster-Signature`.

## CI

`.github/workflows/conformance.yaml`:

| Job | When | Runs |
| --- | --- | --- |
| `suites` | Pull requests touching a contract, nightly, manual | Go node, appbridge, SDK, media-control and Autopilot suites on NATS |
| `python` | Same | Python SDK and runner |
| `nightly` | Nightly and manual (`workflow_dispatch`) | Timing, load, turn-taking replay and the Pipecat golden test; reports are uploaded as the `conformance-reports` artifact |

Live provider tests run by hand with your own provider keys (never put them in the repository):
`DEEPGRAM_API_KEY=… ELEVENLABS_API_KEY=… npm run live-check -w @fonoster/appbridge`. Still to add:
dedicated runners for the nightly job (task 4.2).
