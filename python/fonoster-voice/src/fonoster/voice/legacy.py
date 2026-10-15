"""The ``(req, res)`` handler form, a thin wrapper over the session (voice-sdk S1)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .errors import RemovedMethodError
from .session import Session


@dataclass
class LegacyRequest:
    app_ref: str
    call_ref: str
    session_ref: str
    ingress_number: str
    caller_number: str
    call_direction: str
    metadata: dict[str, Any] = field(default_factory=dict)
    handoff: dict[str, Any] | None = None


def legacy_request(session: Session) -> LegacyRequest:
    return LegacyRequest(
        app_ref=session.app_ref,
        call_ref=session.call_ref,
        session_ref=session.session_ref,
        ingress_number=session.to,
        caller_number=session.from_,
        call_direction="TO_PSTN" if session.direction == "outbound" else "FROM_PSTN",
        metadata=session.metadata,
        handoff=session.handoff_payload,
    )


class LegacyResponse:
    """Every surviving method forwards to the session, so both forms send the same messages."""

    def __init__(self, session: Session):
        self.session = session

    async def answer(self) -> None:
        await self.session.answer()

    async def say(self, text: str, **options: Any):
        return await self.session.say(text, **options)

    async def stop_say(self) -> None:
        await self.session.stop_say()

    async def play(self, url: str, **options: Any):
        return await self.session.play(url, **options)

    async def play_dtmf(self, digits: str) -> None:
        await self.session.play_dtmf(digits)

    async def gather(self, **options: Any):
        return await self.session.gather(**options)

    async def hangup(self) -> None:
        await self.session.hangup()

    async def transfer(self, to: str, **options: Any) -> None:
        await self.session.transfer(to, **options)

    async def dial(self, to: str) -> None:
        """Deprecated alias of a cold transfer."""
        await self.session.transfer(to)

    async def hold(self, **options: Any) -> None:
        await self.session.hold(**options)

    async def resume(self) -> None:
        await self.session.resume()

    async def handoff(self, app: str, payload: dict[str, Any] | None = None) -> None:
        await self.session.handoff(app, payload)

    def record(self, *_: Any, **__: Any):
        raise RemovedMethodError("record", "recording is now an app policy (call record settings)")

    def set_audio_filters(self, *_: Any, **__: Any):
        raise RemovedMethodError("set_audio_filters", "audio filters are now part of the app's configuration")

    def mute(self, *_: Any, **__: Any):
        raise RemovedMethodError("mute", "use hold() so the caller hears nothing")

    def unmute(self, *_: Any, **__: Any):
        raise RemovedMethodError("unmute", "use resume() after hold()")
