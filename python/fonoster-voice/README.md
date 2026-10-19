# fonoster-voice

The Fonoster Voice SDK for Python. Apps receive each call as a session over the Fonoster session
protocol (`fonoster.session.v1`) from AppBridge. Asyncio only.

```python
import os
from fonoster.voice import VoiceServer

server = VoiceServer(port=3000, signing_secret=os.environ["APP_SIGNING_SECRET"])

@server.handler
async def on_call(session):
    result = await session.say("Hi! What can I do for you?")
    answer = await session.gather(timeout=5)
    await session.say(f"You said: {answer.speech}")
    await session.hangup()

server.run()
```

Mount into FastAPI or any ASGI app with `app.mount("/voice", voice_asgi_app(on_call, signing_secret=...))`.

The SDK passes the same conformance scenarios as the TypeScript SDK (`@fonoster/voice`):
see `mods/conformance/scenarios/voice-sdk`.

## Install

```sh
pip install fonoster-voice
```

Requires Python 3.11 or newer. The only dependency is `websockets`. The package ships type
information (`py.typed`). Handlers must be `async def`; a plain `def` handler is rejected.

## Examples and docs

See `examples/` for `say`/`gather`/`transfer`, barge-in, a FastAPI mount and token streaming, and
`docs/voice-sdk.md` and `docs/migrating-to-sessions.md` in the repository.

## Build and publish

```sh
cd python
uv build fonoster-voice            # or: python -m build fonoster-voice
uv publish fonoster-voice/dist/*   # needs a PyPI token
```

The version tracks the npm packages (`@fonoster/voice`); release them together.
