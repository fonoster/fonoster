"""The XFR fixture app on the Python SDK (catalog area XFR, transfers.integration.test.ts).

The number called picks what it does, as the TypeScript fixture in the test does: a cold transfer
with a header, a warm transfer completed after a briefing, or keys and hold driven by the
caller's keys. It prints "listening <port>", then one line per thing its promises and events
gave it.
"""
import asyncio
import os

from fonoster.voice import VoiceServer

SECRET = os.environ["XFR_SECRET"]
TARGET = os.environ["XFR_TARGET"]
COLD, WARM, KEYS = "+15550003001", "+15550003002", "+15550003003"


def log(line: str) -> None:
    print(line, flush=True)


async def on_call(session) -> None:
    if session.to == COLD:
        await session.transfer(TARGET, headers={"X-Customer-Id": "c-42"})
        log("transfer resolved")
    elif session.to == WARM:
        done = asyncio.ensure_future(session.transfer(TARGET, mode="warm"))
        await session.say("I have a caller about a refund.")
        await asyncio.sleep(0.5)
        await session.complete_transfer()
        await done
        log("warm transfer resolved")
    elif session.to == KEYS:
        ended = asyncio.Event()

        async def resume_and_say() -> None:
            await session.resume()
            await session.say("Thanks for waiting.")
            log("said after resume")

        async def on_dtmf(event) -> None:
            digit = event["digit"]
            log(f"dtmf {digit}")
            if digit == "5":
                await session.play_dtmf("12#")
            elif digit == "7":
                await session.hold()
            elif digit == "8":
                await resume_and_say()

        session.on("dtmf", on_dtmf)
        session.on("end", lambda _: ended.set())
        try:
            await asyncio.wait_for(ended.wait(), 20)
        except asyncio.TimeoutError:
            pass


async def main() -> None:
    server = await VoiceServer(port=0, host="127.0.0.1", signing_secret=SECRET).listen(on_call)
    log(f"listening {server.port}")
    await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
