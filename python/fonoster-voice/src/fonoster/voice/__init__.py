"""Fonoster Voice SDK for Python (session protocol, asyncio only)."""

from .errors import RemovedMethodError, SessionEndedError, SessionError
from .legacy import LegacyRequest, LegacyResponse
from .server import VoiceServer, voice_asgi_app
from .session import GatherResult, MarkResult, PlayResult, SayResult, Session

__all__ = [
    "GatherResult",
    "LegacyRequest",
    "LegacyResponse",
    "MarkResult",
    "PlayResult",
    "RemovedMethodError",
    "SayResult",
    "Session",
    "SessionEndedError",
    "SessionError",
    "VoiceServer",
    "voice_asgi_app",
]
