"""Mount the voice app into FastAPI. AppBridge dials ws(s)://<host>/voice."""
import os

from fastapi import FastAPI

from fonoster.voice import voice_asgi_app


async def on_call(session):
    await session.say("Hello from FastAPI.")
    await session.hangup()


app = FastAPI()
app.mount("/voice", voice_asgi_app(on_call, signing_secret=os.environ["APP_SIGNING_SECRET"]))
