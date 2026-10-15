"""Barge-in: say() resolves with interrupted=True when the caller talks over it."""
import os

from fonoster.voice import VoiceServer

server = VoiceServer(port=3000, signing_secret=os.environ.get("APP_SIGNING_SECRET"))


@server.handler
async def on_call(session):
    result = await session.say("Your balance is forty two dollars, and your next payment is due soon.")
    if result.interrupted:
        await session.say(f"Sorry, go ahead. I had only said: {result.heard_text}")

    # Kept even if the caller talks: their speech is held for the next gather().
    await session.say("This call may be recorded.", interruptible=False)
    reply = await session.gather(timeout=5)
    await session.say(f"You said: {reply.speech}" if reply.speech else "Goodbye.")
    await session.hangup()


if __name__ == "__main__":
    server.run()
