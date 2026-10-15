# fonoster-voice

The Fonoster Voice SDK for Python. Apps receive each call as a session over the Fonoster session
protocol (`fonoster.session.v1`) from the VoiceSessionGateway. Asyncio only.

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

The SDK passes the same conformance scenarios as the TypeScript SDK (`@fonoster/voice/session`):
see `mods/conformance/scenarios/voice-sdk`.
