"""The voice-sdk conformance scenarios, run against this SDK with the shared scenario files.

Each fixture is the app described in mods/conformance/scenarios/voice-sdk/FIXTURES.md, written
idiomatically in Python (snake_case, timeouts in seconds).
"""

from __future__ import annotations

import asyncio

import pytest
from fonoster_conformance import FakeGateway, load_scenarios, run_scenario

from fonoster.voice import SessionError, VoiceServer

SECRET = "sdk-conformance"


async def tokens(pieces):
    for p in pieces:
        yield p


async def failing_tokens():
    yield "Hello"
    raise RuntimeError("the model stopped")


async def say_hello(session):
    await session.say("Hello from the SDK.")
    await session.hangup()


async def say_hello_legacy(req, res):
    await res.answer()
    await res.say("Hello from the SDK.")
    await res.hangup()


async def say_reports_interruption(session):
    r = await session.say("Your balance is forty two dollars.")
    if r.interrupted:
        await session.say(f"You heard: {r.heard_text}")


async def gather_echo(session):
    r = await session.gather(finish_on_key="#")
    if r.speech is not None:
        await session.say(f"You said: {r.speech}")
    else:
        await session.say(f"You pressed: {r.digits}")


async def session_info(s):
    await s.say(f"Call {s.call_ref} to {s.to} from {s.from_} ({s.direction}, app {s.app_ref})")


async def say_voice_override(s):
    await s.say("Hola", voice="elevenlabs/rachel", language="es")


async def say_stream(s):
    await s.say(tokens(["Hello", " there", "!"]))
    await s.hangup()


async def say_stream_fails(s):
    try:
        await s.say(failing_tokens())
    except RuntimeError:
        await s.say("The stream failed.")


async def stop_say(s):
    s.on("dtmf", lambda _: s.stop_say())
    r = await s.say("This is a long message.")
    if r.interrupted:
        await s.say(f"Stopped after: {r.heard_text}")


async def gather_max_digits(s):
    r = await s.gather(max_digits=4)
    await s.say(f"You pressed: {r.digits}")


async def gather_timeout(s):
    r = await s.gather(timeout=0.3)
    await s.say("No input." if r.speech is None and r.digits is None else "Got input.")


async def dtmf_listener(s):
    s.on("dtmf", lambda d: s.say(f"Key {d['digit']}"))
    await s.say("Welcome to the menu.")


async def partials(s):
    await s.subscribe(["transcript.partial"])
    s.on("transcript.partial", lambda p: s.say(f"Heard {p['text']}"))


async def transfer_cold(s):
    await s.transfer("+15551234567")


async def transfer_warm(s):
    t = asyncio.create_task(s.transfer("+15551234567", mode="warm"))
    await asyncio.sleep(0)
    await s.say("Connecting you now.")
    await s.complete_transfer()
    await t


async def handoff(s):
    await s.handoff("app-escalation", {"reason": "angry caller"})


async def legacy_dial(req, res):
    await res.dial("+15551234567")


async def audio_mark(s):
    s.on("dtmf", lambda _: s.audio.clear())
    for _ in range(3):
        await s.audio.send(bytes(640))
    m = await s.audio.mark("r1")
    await s.say("Cleared." if m.cleared else "Heard.")


async def say_error(s):
    try:
        await s.say("Hi")
    except SessionError as e:
        await s.say(f"Error: {e.code}")


async def say_then_gather(s):
    r = await s.say("Please enter your PIN.")
    g = await s.gather(max_digits=4)
    await s.say(f"PIN {g.digits} (heard: {r.heard_text})")


async def record_note(s):
    await s.note({"kind": "turn", "firstTokenMs": 420})


FIXTURES = {
    "record-note": record_note,
    "say-hello": say_hello,
    "say-hello-legacy": say_hello_legacy,
    "say-reports-interruption": say_reports_interruption,
    "gather-echo": gather_echo,
    "session-info": session_info,
    "say-voice-override": say_voice_override,
    "say-stream": say_stream,
    "say-stream-fails": say_stream_fails,
    "stop-say": stop_say,
    "gather-max-digits": gather_max_digits,
    "gather-timeout": gather_timeout,
    "dtmf-listener": dtmf_listener,
    "partials": partials,
    "transfer-cold": transfer_cold,
    "transfer-warm": transfer_warm,
    "handoff": handoff,
    "legacy-dial": legacy_dial,
    "audio-mark": audio_mark,
    "say-error": say_error,
    "say-then-gather": say_then_gather,
}

SCENARIOS = load_scenarios("voice-sdk")


@pytest.mark.parametrize("scenario", SCENARIOS, ids=[s["name"] for s in SCENARIOS])
def test_scenario(scenario):
    fixture = FIXTURES.get(scenario["fixture"])
    assert fixture is not None, f"fixture {scenario['fixture']} is not implemented"

    async def main():
        server = await VoiceServer(port=0, host="127.0.0.1", signing_secret=SECRET).listen(fixture)
        try:
            gateway = FakeGateway(signing_secret=SECRET)
            return await run_scenario(scenario, lambda: gateway.dial(f"ws://127.0.0.1:{server.port}/"))
        finally:
            await server.close()

    result = asyncio.run(main())
    assert result.status == "passed", result.reason
