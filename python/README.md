# Python packages

| Package | Purpose |
| --- | --- |
| `fonoster-voice` | The Python Voice SDK on the session protocol (`rework-voice-sdk`), asyncio only |
| `fonoster-conformance` | Python runner for the shared conformance scenarios in `mods/conformance` |

Both read the scenario files from `mods/conformance` in this repository (or from
`FONOSTER_CONFORMANCE_DIR`, pointing at the published `@fonoster/conformance` package of the same
version).

```sh
cd python
uv venv .venv --python 3.12
uv pip install --python .venv/bin/python -e fonoster-conformance -e "fonoster-voice[test]"
.venv/bin/python -m pytest fonoster-conformance/tests fonoster-voice/tests
```
