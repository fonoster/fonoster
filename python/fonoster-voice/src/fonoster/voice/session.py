"""One call's session over the fonoster.session.v1 protocol (voice-sdk S8), asyncio only.

Verbs are conveniences: each sends one command and resolves on the event that answers it. The
command ids and messages are the same as the TypeScript SDK's, so both pass the same scenarios.
"""

from __future__ import annotations

import asyncio
import inspect
import json
from dataclasses import dataclass
from typing import Any, AsyncIterable, Awaitable, Callable, Protocol

from .errors import SessionEndedError, SessionError

DEFAULT_GATHER_TIMEOUT = 4.0
#: Commands that make AppBridge start listening (speech recognition and turn events).
SPEECH_COMMANDS = {"speak", "play", "subscribe", "listen.update"}
MAX_BUFFERED_INPUTS = 32


@dataclass
class SayResult:
    interrupted: bool
    heard_text: str
    heard_ms: float


@dataclass
class PlayResult:
    interrupted: bool
    heard_ms: float


@dataclass
class GatherResult:
    speech: str | None = None
    digits: str | None = None


@dataclass
class MarkResult:
    cleared: bool


class Transport(Protocol):
    async def send_text(self, text: str) -> None: ...
    async def send_bytes(self, data: bytes) -> None: ...
    async def close(self) -> None: ...


Callback = Callable[[dict[str, Any]], Any]


class _Gather:
    def __init__(self, speech: bool, dtmf: bool, max_digits: int | None, finish_on_key: str | None,
                 timeout: float, future: asyncio.Future):
        self.speech = speech
        self.dtmf = dtmf
        self.max_digits = max_digits
        self.finish_on_key = finish_on_key
        self.timeout = timeout
        self.future = future
        self.digits = ""
        self.timer: asyncio.TimerHandle | None = None


class _Audio:
    def __init__(self, session: "Session"):
        self._session = session
        self._frame_callbacks: list[Callable[[bytes, int], Any]] = []

    def on_frame(self, callback: Callable[[bytes, int], Any]) -> None:
        self._frame_callbacks.append(callback)

    async def send(self, frame: bytes) -> None:
        await self._session._transport.send_bytes(frame)

    async def mark(self, name: str) -> MarkResult:
        s = self._session
        if s._ended_reason:
            raise SessionEndedError(s._ended_reason)
        future = asyncio.get_running_loop().create_future()
        s._marks.setdefault(name, []).append(future)
        await s._send({"type": "mark", "name": name})
        return await future

    async def clear(self) -> None:
        await self._session._send({"type": "clear"})


class Session:
    def __init__(self, start: dict[str, Any], transport: Transport):
        self.session_ref: str = start["sessionRef"]
        self.call_ref: str = start["callRef"]
        self.app_ref: str = start["appRef"]
        self.direction: str = start["direction"]
        self.from_: str = start["from"]
        self.to: str = start["to"]
        self.metadata: dict[str, Any] = start.get("metadata") or {}
        #: The payload of the handoff that started this session, or None.
        self.handoff_payload: dict[str, Any] | None = start.get("handoff")
        self.speech: dict[str, Any] = start.get("speech") or {}
        self.audio_format: dict[str, Any] = start.get("audio") or {}
        self.tracks: list[dict[str, Any]] = start.get("tracks") or []
        self.audio = _Audio(self)

        self._transport = transport
        self._seq = 0
        self._outputs: dict[str, tuple[asyncio.Future, str, list[float | None]]] = {}
        # Outputs sent with interruptible=False; the SDK does not clear them on barge-in.
        self._kept: set[str] = set()
        self._tasks: set[asyncio.Task] = set()
        self._commands: dict[str, asyncio.Future] = {}
        self._marks: dict[str, list[asyncio.Future]] = {}
        self._end_waiters: list[tuple[list[str], asyncio.Future]] = []
        self._listeners: dict[str, list[Callback]] = {}
        self._gather: _Gather | None = None
        self._buffered: list[dict[str, Any]] = []
        self._last_warm_transfer: str | None = None
        self._ended_reason: str | None = None
        self._listening = False

    # ---- properties -------------------------------------------------------------------

    @property
    def ended(self) -> bool:
        return self._ended_reason is not None

    # ---- speech -----------------------------------------------------------------------

    async def say(
        self,
        text: str | AsyncIterable[str],
        *,
        voice: str | None = None,
        language: str | None = None,
        interruptible: bool | None = None,
        preempt: bool | None = None,
    ) -> SayResult:
        """Speaks text, or a stream of text pieces as one utterance, and reports what was heard."""
        id_ = self._next_id("say")
        fields = _compact(voice=voice, language=language, interruptible=interruptible, preempt=preempt)
        if interruptible is False:
            self._kept.add(id_)
        if isinstance(text, str):
            future = self._await_output(id_, text)
            await self._send({"type": "speak", "id": id_, "text": text, "last": True, **fields})
            return await future

        future = self._await_output(id_, "")
        full = ""
        try:
            async for piece in text:
                full += piece
                await self._send({"type": "speak", "id": id_, "text": piece, "last": False, **fields})
        except Exception:
            # End the utterance so AppBridge does not wait for more pieces.
            await self._send({"type": "speak", "id": id_, "text": "", "last": True, **fields})
            self._outputs.pop(id_, None)
            future.cancel()
            raise
        if id_ in self._outputs:
            f, _, started = self._outputs[id_]
            self._outputs[id_] = (f, full, started)
        await self._send({"type": "speak", "id": id_, "text": "", "last": True, **fields})
        return await future

    async def stop_say(self) -> None:
        """Cuts the agent off: every pending say and play resolves as interrupted."""
        await self._send({"type": "clear"})

    async def play(self, url: str, *, loop: bool | None = None, interruptible: bool | None = None,
                   preempt: bool | None = None) -> PlayResult:
        id_ = self._next_id("play")
        if interruptible is False:
            self._kept.add(id_)
        future = self._await_output(id_, "")
        await self._send({"type": "play", "id": id_, "url": url,
                          **_compact(loop=loop, interruptible=interruptible, preempt=preempt)})
        r = await future
        return PlayResult(r.interrupted, r.heard_ms)

    async def gather(self, *, source: str = "speech_and_dtmf", max_digits: int | None = None,
                     finish_on_key: str | None = None, timeout: float = DEFAULT_GATHER_TIMEOUT) -> GatherResult:
        """Waits for speech (turn.ended) or digits (dtmf), whichever comes first. ``timeout`` is in seconds."""
        if self._ended_reason:
            raise SessionEndedError(self._ended_reason)
        if self._gather:
            raise RuntimeError("a gather is already pending")
        # AppBridge listens only after a Speech-layer command; a gather may be the first one.
        if source != "dtmf" and not self._listening:
            await self._send({"type": "listen.update"})
        future = asyncio.get_running_loop().create_future()
        g = _Gather(source != "dtmf", source != "speech", max_digits, finish_on_key, timeout, future)
        self._gather = g
        self._arm(g)
        backlog, self._buffered = self._buffered, []
        for item in backlog:
            if self._gather is not g:
                break
            self._feed(item)
        return await future

    async def subscribe(self, events: list[str]) -> None:
        await self._send({"type": "subscribe", "events": list(events)})

    def on(self, event: str, callback: Callback) -> "Session":
        self._listeners.setdefault(event, []).append(callback)
        return self

    def off(self, event: str, callback: Callback) -> "Session":
        if callback in self._listeners.get(event, []):
            self._listeners[event].remove(callback)
        return self

    # ---- control ----------------------------------------------------------------------

    async def play_dtmf(self, digits: str) -> None:
        await self._command({"type": "dtmf.send", "digits": digits})

    async def transfer(self, to: str, *, mode: str | None = None, headers: dict[str, str] | None = None) -> None:
        """Transfers the call; returns when AppBridge ends the session with reason transfer."""
        id_ = self._next_id("transfer")
        if mode == "warm":
            self._last_warm_transfer = id_
        await self._until_end(["transfer"], id_,
                              {"type": "transfer", "id": id_, "to": to, **_compact(mode=mode, headers=headers)})

    async def complete_transfer(self) -> None:
        if not self._last_warm_transfer:
            raise RuntimeError("no warm transfer is pending")
        await self._send({"type": "transfer.complete", "id": self._last_warm_transfer})

    async def hold(self, *, music: str | None = None) -> None:
        await self._command({"type": "hold", **_compact(music=music)})

    async def resume(self) -> None:
        await self._command({"type": "resume"})

    async def handoff(self, app: str, payload: dict[str, Any] | None = None) -> None:
        id_ = self._next_id("handoff")
        await self._until_end(["handoff"], id_, {"type": "handoff", "id": id_, "app": app, "payload": payload or {}})

    async def hangup(self) -> None:
        if self._ended_reason:
            return
        await self._until_end(["app_hangup", "caller_hangup", "closed"], None, {"type": "hangup"})

    async def note(self, data: dict[str, Any]) -> None:
        """Adds a note to the call record (record.note).

        Internal: reserved for Fonoster's own apps (Autopilot); not part of the public SDK and may change.
        """
        await self._command({"type": "record.note", "data": data})

    async def answer(self) -> None:
        """Returns at once: AppBridge answers the call on connect."""

    # ---- incoming ---------------------------------------------------------------------

    def receive(self, data: bytes | str) -> None:
        if isinstance(data, bytes):
            track, frame = data[0], data[1:]
            for cb in self.audio._frame_callbacks:
                self._call(cb, frame, track)
            return
        try:
            msg = json.loads(data)
        except ValueError:
            return
        if isinstance(msg, dict):
            self._on_message(msg)

    def closed(self) -> None:
        self._finish("closed")

    def _on_message(self, msg: dict[str, Any]) -> None:
        t = msg.get("type")
        if t == "output.started":
            entry = self._outputs.get(msg.get("id"))
            if entry:
                entry[2][0] = asyncio.get_running_loop().time()
        elif t == "output.done":
            entry = self._outputs.pop(msg.get("id"), None)
            if entry and not entry[0].done():
                started = entry[2][0]
                heard = (asyncio.get_running_loop().time() - started) * 1000 if started else 0
                entry[0].set_result(SayResult(False, entry[1], heard))
        elif t == "output.interrupted":
            entry = self._outputs.pop(msg.get("id"), None)
            if entry and not entry[0].done():
                entry[0].set_result(SayResult(True, str(msg.get("heardText", "")), float(msg.get("heardMs", 0))))
        elif t == "mark":
            futures = self._marks.get(msg.get("name"), [])
            if futures:
                f = futures.pop(0)
                if not f.done():
                    f.set_result(MarkResult(msg.get("cleared") is True))
        elif t == "error":
            self._on_error(msg)
        elif t == "session.end":
            self._finish(str(msg.get("reason", "closed")))
        elif t == "dtmf":
            self._emit("dtmf", {"digit": msg.get("digit")})
            self._input({"type": "dtmf", "digit": str(msg.get("digit"))})
        elif t == "turn.ended":
            self._emit(t, {k: v for k, v in msg.items() if k != "type"})
            self._input({"type": "turn.ended", "text": str(msg.get("text", ""))})
        elif t == "turn.user_started":
            self._barge_in()
            self._emit(t, {})
            self._input({"type": "turn.user_started"})
        elif t in (
            "turn.likely_ended",
            "turn.resumed",
            "turn.backchannel",
            "transcript.partial",
            "turn.estimate",
            "amd.result",
        ):
            self._emit(t, {k: v for k, v in msg.items() if k != "type"})
        # Unknown types are ignored (additive-only protocol).

    def _on_error(self, msg: dict[str, Any]) -> None:
        error = SessionError(str(msg.get("code")), str(msg.get("message", msg.get("code"))), msg.get("fatal") is True)
        rel = msg.get("relatesTo")
        output = self._outputs.pop(rel, None) if rel else None
        command = self._commands.pop(rel, None) if rel else None
        if output and not output[0].done():
            output[0].set_exception(error)
        elif command and not command.done():
            command.set_exception(error)
        else:
            self._emit("error", {"code": error.code, "message": error.message, "fatal": error.fatal})
        if error.fatal:
            self._finish("error")

    # ---- gather -----------------------------------------------------------------------

    def _input(self, item: dict[str, Any]) -> None:
        if self._gather:
            self._feed(item)
        elif item["type"] != "turn.user_started":
            self._buffered.append(item)
            if len(self._buffered) > MAX_BUFFERED_INPUTS:
                self._buffered.pop(0)

    def _feed(self, item: dict[str, Any]) -> None:
        g = self._gather
        assert g is not None
        if item["type"] == "turn.user_started":
            # The caller is talking: wait for the end of the turn instead of timing out mid-sentence.
            if g.speech and not g.digits and g.timer:
                g.timer.cancel()
            return
        if item["type"] == "turn.ended":
            # First input wins: once digits started, speech is ignored.
            if g.speech and not g.digits:
                self._end_gather(GatherResult(speech=item["text"]))
            return
        if not g.dtmf:
            return
        if g.finish_on_key and item["digit"] == g.finish_on_key:
            return self._end_gather(GatherResult(digits=g.digits))
        g.digits += item["digit"]
        if g.max_digits and len(g.digits) >= g.max_digits:
            return self._end_gather(GatherResult(digits=g.digits))
        self._arm(g)

    def _arm(self, g: _Gather) -> None:
        if g.timer:
            g.timer.cancel()
        g.timer = asyncio.get_running_loop().call_later(
            g.timeout, lambda: self._end_gather(GatherResult(digits=g.digits) if g.digits else GatherResult())
        )

    def _end_gather(self, result: GatherResult) -> None:
        g = self._gather
        if not g:
            return
        if g.timer:
            g.timer.cancel()
        self._gather = None
        if not g.future.done():
            g.future.set_result(result)

    # ---- internals --------------------------------------------------------------------

    def _next_id(self, kind: str) -> str:
        self._seq += 1
        return f"{kind}-{self._seq}"

    async def _send(self, message: dict[str, Any]) -> None:
        if self._ended_reason:
            raise SessionEndedError(self._ended_reason)
        if message.get("type") in SPEECH_COMMANDS:
            self._listening = True
        await self._transport.send_text(json.dumps(message))

    async def _command(self, message: dict[str, Any]) -> None:
        await self._send({**message, "id": self._next_id(str(message["type"]).replace(".", "-"))})

    def _barge_in(self) -> None:
        """The app owns interruption (appbridge B22): clear when every playing output is interruptible."""
        playing = [i for i, entry in self._outputs.items() if entry[2][0] is not None]
        if playing and not any(i in self._kept for i in playing):
            task = asyncio.get_running_loop().create_task(self._send({"type": "clear"}))
            self._tasks.add(task)
            task.add_done_callback(self._tasks.discard)

    def _await_output(self, id_: str, text: str) -> asyncio.Future:
        if self._ended_reason:
            raise SessionEndedError(self._ended_reason)
        future = asyncio.get_running_loop().create_future()
        self._outputs[id_] = (future, text, [None])
        return future

    async def _until_end(self, reasons: list[str], id_: str | None, message: dict[str, Any]) -> None:
        if self._ended_reason:
            raise SessionEndedError(self._ended_reason)
        future = asyncio.get_running_loop().create_future()
        self._end_waiters.append((reasons, future))
        if id_:
            self._commands[id_] = future
        await self._send(message)
        await future

    def _finish(self, reason: str) -> None:
        if self._ended_reason:
            return
        self._ended_reason = reason
        ended = SessionEndedError(reason)
        for reasons, future in self._end_waiters:
            if not future.done():
                if reason in reasons:
                    future.set_result(None)
                else:
                    future.set_exception(ended)
        self._end_waiters = []
        for future, _, _ in self._outputs.values():
            if not future.done():
                future.set_exception(ended)
        self._outputs.clear()
        self._commands.clear()
        for futures in self._marks.values():
            for f in futures:
                if not f.done():
                    f.set_result(MarkResult(True))
        self._marks.clear()
        if self._gather:
            g, self._gather = self._gather, None
            if g.timer:
                g.timer.cancel()
            if not g.future.done():
                g.future.set_exception(ended)
        self._emit("end", {"reason": reason})
        asyncio.ensure_future(self._transport.close())

    def _emit(self, event: str, data: dict[str, Any]) -> None:
        for cb in list(self._listeners.get(event, [])):
            self._call(cb, data)

    def _call(self, cb: Callable[..., Any], *args: Any) -> None:
        try:
            result = cb(*args)
            if inspect.isawaitable(result):
                task = asyncio.ensure_future(result)
                task.add_done_callback(lambda t: t.cancelled() or t.exception())
        except Exception:  # noqa: BLE001 - a listener's failure must not break the session
            pass


def _compact(**fields: Any) -> dict[str, Any]:
    return {k: v for k, v in fields.items() if v is not None}
