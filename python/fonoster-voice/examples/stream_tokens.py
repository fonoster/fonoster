"""Stream model tokens into speech with an async iterator."""
import os

from fonoster.voice import VoiceServer

server = VoiceServer(port=3000, signing_secret=os.environ.get("APP_SIGNING_SECRET"))


async def reply(question):
    for token in ["You ", "asked ", f'"{question}". ', "Here is my answer."]:
        yield token


@server.handler
async def on_call(session):
    await session.say("Ask me anything.")
    q = await session.gather(timeout=6)
    if q.speech:
        await session.say(reply(q.speech))
    await session.hangup()


if __name__ == "__main__":
    server.run()
