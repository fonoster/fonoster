"""Greet, ask, and transfer to a person on request."""
import os
import re

from fonoster.voice import VoiceServer

server = VoiceServer(port=3000, signing_secret=os.environ.get("APP_SIGNING_SECRET"))


@server.handler
async def on_call(session):
    await session.say("Thanks for calling. Say sales or support, or press 0 for an operator.")
    answer = await session.gather(source="speech_and_dtmf", timeout=6)  # seconds in Python

    if answer.digits == "0" or re.search(r"operator|person|human", answer.speech or "", re.I):
        await session.say("One moment, I am connecting you.")
        await session.transfer("+15551234567")  # resolves when the session ends with "transfer"
        return

    await session.say(f"You said {answer.speech}. Goodbye." if answer.speech else "Goodbye.")
    await session.hangup()


if __name__ == "__main__":
    server.run()
