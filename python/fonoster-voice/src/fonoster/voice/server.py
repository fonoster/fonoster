"""Accepts VoiceSessionGateway sessions over WebSocket (voice-sdk S7)."""

from __future__ import annotations

import asyncio
import inspect
import json
import logging
import os
from typing import Any, Awaitable, Callable

from websockets.asyncio.server import Server, ServerConnection, serve
from websockets.exceptions import ConnectionClosed
from websockets.http11 import Request

from .legacy import LegacyResponse, legacy_request
from .session import Session
from .signature import verify_signature

logger = logging.getLogger("fonoster.voice")

Handler = Callable[..., Awaitable[None]]


def _check_handler(handler: Handler) -> int:
    if not inspect.iscoroutinefunction(handler):
        raise TypeError("voice handlers must be async def functions")
    return len(inspect.signature(handler).parameters)


async def _run_handler(handler: Handler, arity: int, session: Session) -> None:
    try:
        if arity >= 2:
            await handler(legacy_request(session), LegacyResponse(session))
        else:
            await handler(session)
    except Exception as e:  # noqa: BLE001
        if session.ended:
            return
        # An app that crashes hangs up the call rather than leaving the caller in silence.
        logger.error("voice handler failed: %s", e)
        try:
            await session.hangup()
        except Exception:  # noqa: BLE001
            pass


class _WsTransport:
    def __init__(self, ws: Any):
        self.ws = ws

    async def send_text(self, text: str) -> None:
        await self.ws.send(text)

    async def send_bytes(self, data: bytes) -> None:
        await self.ws.send(data)

    async def close(self) -> None:
        await self.ws.close()


class VoiceServer:
    def __init__(
        self,
        port: int = 3000,
        host: str = "0.0.0.0",
        *,
        signing_secret: str | None = None,
        verify_signature: bool = True,
        public_url: str | None = None,
        path: str | None = None,
        start_timeout: float = 5.0,
    ):
        self.port = port
        self.host = host
        self.path = path
        self.public_url = public_url
        self.start_timeout = start_timeout
        self.secret = signing_secret or os.environ.get("APP_SIGNING_SECRET")
        self.verify = verify_signature
        if self.verify and not self.secret:
            raise ValueError("VoiceServer needs signing_secret (or APP_SIGNING_SECRET), or verify_signature=False")
        self._handler: Handler | None = None
        self._arity = 1
        self._server: Server | None = None

    def handler(self, fn: Handler) -> Handler:
        """Decorator form of ``listen``'s registration."""
        self._arity = _check_handler(fn)
        self._handler = fn
        return fn

    async def listen(self, handler: Handler | None = None) -> "VoiceServer":
        """Starts serving; returns once listening."""
        if handler is not None:
            self.handler(handler)
        if self._handler is None:
            raise ValueError("register a handler first")
        self._server = await serve(self._connection, self.host, self.port, process_request=self._process_request)
        self.port = self._server.sockets[0].getsockname()[1]
        logger.info("voice server listening on %s", self.port)
        return self

    def run(self) -> None:
        """Blocks serving forever (for scripts)."""

        async def main() -> None:
            await self.listen()
            await asyncio.Future()

        asyncio.run(main())

    async def close(self) -> None:
        if self._server:
            self._server.close()
            await self._server.wait_closed()

    def _candidate_urls(self, path: str, host: str | None) -> list[str]:
        if self.public_url:
            return [self.public_url]
        return [f"{scheme}://{host}{path}" for scheme in ("ws", "wss")]

    def _process_request(self, connection: ServerConnection, request: Request):
        if self.path and request.path.split("?")[0] != self.path:
            return connection.respond(404, "Not Found\n")
        if not self.verify:
            logger.warning("accepted a session connection without signature verification (development only)")
            return None
        headers = dict(request.headers.raw_items())
        host = request.headers.get("X-Forwarded-Host") or request.headers.get("Host")
        reason = verify_signature(self._candidate_urls(request.path, host), headers, self.secret or "")
        if reason:
            logger.warning("rejected a session connection: signature %s", reason)
            return connection.respond(401, "Unauthorized\n")
        return None

    async def _connection(self, ws: ServerConnection) -> None:
        await run_session(_WsTransport(ws), _iterate(ws), self._handler, self._arity, self.start_timeout)


async def _iterate(ws: ServerConnection):
    try:
        async for message in ws:
            yield message
    except ConnectionClosed:
        return


async def run_session(transport: Any, messages: Any, handler: Handler | None, arity: int, start_timeout: float) -> None:
    """Reads session.start, runs the handler and feeds the session until the socket closes."""
    session: Session | None = None
    task: asyncio.Task | None = None
    iterator = messages.__aiter__()
    try:
        while session is None:
            message = await asyncio.wait_for(iterator.__anext__(), start_timeout)
            if isinstance(message, bytes):
                continue
            try:
                start = json.loads(message)
            except ValueError:
                continue
            if isinstance(start, dict) and start.get("type") == "session.start":
                session = Session(start, transport)
        assert handler is not None
        task = asyncio.create_task(_run_handler(handler, arity, session))
        async for message in iterator:
            session.receive(message)
    except (asyncio.TimeoutError, StopAsyncIteration):
        pass
    finally:
        if session:
            session.closed()
        if task:
            try:
                await asyncio.wait_for(asyncio.shield(task), 1)
            except Exception:  # noqa: BLE001
                pass


def voice_asgi_app(handler: Handler, *, signing_secret: str | None = None, verify_signature_: bool = True,
                   public_url: str | None = None):
    """An ASGI app to mount into FastAPI/Starlette (``app.mount("/voice", voice_asgi_app(...))``)."""
    arity = _check_handler(handler)
    secret = signing_secret or os.environ.get("APP_SIGNING_SECRET")
    if verify_signature_ and not secret:
        raise ValueError("voice_asgi_app needs signing_secret (or APP_SIGNING_SECRET)")

    async def app(scope: dict[str, Any], receive: Callable, send: Callable) -> None:
        if scope["type"] != "websocket":
            await send({"type": "http.response.start", "status": 426, "headers": []})
            await send({"type": "http.response.body", "body": b"WebSocket required"})
            return
        await receive()  # websocket.connect
        headers = {k.decode().lower(): v.decode() for k, v in scope.get("headers", [])}
        path = scope.get("root_path", "") + scope.get("path", "")
        query = scope.get("query_string", b"").decode()
        full = path + (f"?{query}" if query else "")
        if verify_signature_:
            host = headers.get("x-forwarded-host") or headers.get("host")
            urls = [public_url] if public_url else [f"{s}://{host}{full}" for s in ("ws", "wss")]
            reason = verify_signature(urls, headers, secret or "")
            if reason:
                logger.warning("rejected a session connection: signature %s", reason)
                await send({"type": "websocket.close", "code": 1008})
                return
        else:
            logger.warning("accepted a session connection without signature verification (development only)")
        await send({"type": "websocket.accept"})

        class Transport:
            closed = False

            async def send_text(self, text: str) -> None:
                if not self.closed:
                    await send({"type": "websocket.send", "text": text})

            async def send_bytes(self, data: bytes) -> None:
                if not self.closed:
                    await send({"type": "websocket.send", "bytes": data})

            async def close(self) -> None:
                if not self.closed:
                    self.closed = True
                    await send({"type": "websocket.close", "code": 1000})

        async def messages():
            while True:
                event = await receive()
                if event["type"] == "websocket.disconnect":
                    return
                if event["type"] == "websocket.receive":
                    yield event.get("bytes") if event.get("bytes") is not None else event.get("text")

        await run_session(Transport(), messages(), handler, arity, 5.0)

    return app
