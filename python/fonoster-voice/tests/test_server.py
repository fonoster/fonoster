from __future__ import annotations

import asyncio
import json
import time

import pytest
from conftest import case
from fonoster_conformance import FakeAppBridge, signature_headers

from fonoster.voice import (
    Session,
    SessionEndedError,
    VoiceServer,
    voice_asgi_app,
)

SECRET = "unit-secret"
START = {
    "type": "session.start",
    "protocol": "fonoster.session.v1",
    "sessionRef": "s1",
    "callRef": "c1",
    "appRef": "a1",
    "direction": "inbound",
    "from": "+1",
    "to": "+2",
    "metadata": {},
    "handoff": None,
    "audio": {"codec": "pcm16", "rate": 16000},
    "tracks": [{"id": 1, "side": "inbound", "kind": "audio", "codec": "pcm16"}],
    "speech": {"voice": "fake/default", "language": "en-US"},
}


def run(coro):
    return asyncio.run(coro)


async def standalone(handler):
    return await VoiceServer(port=0, host="127.0.0.1", signing_secret=SECRET).listen(handler)


@case("VSD-001")
def test_runs_handler_once_with_valid_signature():
    async def main():
        calls = []

        async def handler(session):
            calls.append(session.call_ref)

        server = await standalone(handler)
        peer = await FakeAppBridge(SECRET).dial(f"ws://127.0.0.1:{server.port}/")
        await peer.send_json(START)
        await asyncio.sleep(0.05)
        await server.close()
        return calls

    assert run(main()) == ["c1"]


@pytest.mark.parametrize(
    "appbridge",
    [FakeAppBridge("wrong"), FakeAppBridge(None), FakeAppBridge(SECRET, timestamp=int(time.time()) - 600)],
    ids=["wrong secret", "no signature", "stale timestamp"],
)
@case("VSD-001")
def test_rejects_bad_signatures_before_the_handler(appbridge):
    async def main():
        calls = []

        async def handler(session):
            calls.append(1)

        server = await standalone(handler)
        try:
            with pytest.raises(Exception, match="401"):
                await appbridge.dial(f"ws://127.0.0.1:{server.port}/")
        finally:
            await server.close()
        return calls

    assert run(main()) == []


@case("VSD-003")
def test_sync_handler_rejected():
    server = VoiceServer(port=0, signing_secret=SECRET)

    def handler(session):  # not async
        pass

    with pytest.raises(TypeError, match="async def"):
        server.handler(handler)


@case("VSD-001")
def test_secret_required_unless_verification_is_off():
    with pytest.raises(ValueError, match="signing_secret"):
        VoiceServer(port=0, signing_secret=None)
    VoiceServer(port=0, verify_signature=False)


@case("VSD-007")
def test_gather_rejects_and_end_fires_when_caller_hangs_up():
    async def main():
        outcome = {}

        async def handler(session):
            session.on("end", lambda e: outcome.setdefault("end", e["reason"]))
            try:
                await session.gather(timeout=5)
            except SessionEndedError as e:
                outcome["error"] = e

        server = await standalone(handler)
        peer = await FakeAppBridge(SECRET).dial(f"ws://127.0.0.1:{server.port}/")
        await peer.send_json(START)
        await asyncio.sleep(0.03)
        await peer.send_json({"type": "session.end", "reason": "caller_hangup"})
        await asyncio.sleep(0.05)
        await server.close()
        return outcome

    outcome = run(main())
    assert isinstance(outcome["error"], SessionEndedError)
    assert outcome["end"] == "caller_hangup"


@case("VSD-007")
def test_crashing_handler_hangs_up():
    async def main():
        async def handler(session):
            raise RuntimeError("boom")

        server = await standalone(handler)
        peer = await FakeAppBridge(SECRET).dial(f"ws://127.0.0.1:{server.port}/")
        await peer.send_json(START)
        await asyncio.sleep(0.05)
        await server.close()
        return [f.data for f in peer.items if f.kind == "json"]

    assert {"type": "hangup"} in run(main())


@case("VSD-003")
def test_removed_methods_are_not_on_the_session():
    class T:
        async def send_text(self, t): ...
        async def send_bytes(self, b): ...
        async def close(self): ...

    session = Session(START, T())
    for name in ("record", "set_audio_filters", "mute", "unmute", "dial"):
        assert not hasattr(session, name), name


@case("VSD-003")
def test_two_argument_handlers_are_refused():
    async def old(req, res): ...

    with pytest.raises(TypeError, match="one argument"):
        VoiceServer(signing_secret=SECRET).handler(old)


@case("VSD-002")
def test_asgi_mount_verifies_and_runs_the_handler():
    async def main():
        calls = []

        async def handler(session):
            calls.append(session.call_ref)
            await session.say("Hi")

        app = voice_asgi_app(handler, signing_secret=SECRET)
        url = "ws://example.com/voice"
        headers = [(k.lower().encode(), v.encode()) for k, v in signature_headers(url, SECRET).items()]
        headers.append((b"host", b"example.com"))
        inbox: asyncio.Queue = asyncio.Queue()
        sent: list[dict] = []
        for event in (
            {"type": "websocket.connect"},
            {"type": "websocket.receive", "text": json.dumps(START)},
        ):
            inbox.put_nowait(event)

        async def receive():
            return await inbox.get()

        async def send(event):
            sent.append(event)
            if event.get("type") == "websocket.send" and "speak" in event.get("text", ""):
                inbox.put_nowait({"type": "websocket.disconnect"})

        scope = {"type": "websocket", "path": "/voice", "root_path": "", "query_string": b"", "headers": headers}
        await asyncio.wait_for(app(scope, receive, send), 2)
        return calls, sent

    calls, sent = run(main())
    assert calls == ["c1"]
    assert sent[0] == {"type": "websocket.accept"}
    assert any(json.loads(e["text"])["type"] == "speak" for e in sent if e.get("type") == "websocket.send")


@case("VSD-003")
def test_amd_result_reaches_the_handler():
    async def main():
        seen = []

        async def handler(session):
            session.on("amd.result", seen.append)
            await asyncio.sleep(0.2)

        server = await standalone(handler)
        peer = await FakeAppBridge(SECRET).dial(f"ws://127.0.0.1:{server.port}/")
        await peer.send_json(START)
        await asyncio.sleep(0.03)
        await peer.send_json(
            {"type": "amd.result", "status": "voicemail", "confidence": 0.9, "detector": "fake", "audioMs": 4000}
        )
        await asyncio.sleep(0.05)
        await server.close()
        return seen

    assert run(main()) == [{"status": "voicemail", "confidence": 0.9, "detector": "fake", "audioMs": 4000}]
