"""Runs fonoster.scenario.v1 scenarios. Mirrors mods/conformance/src/runner/runScenario.ts.

This runner covers what SDK suites need (role "appbridge"): send, send_audio, expect, expect_none,
expect_audio, expect_close, wait and close. Steps that need the fakes harness (inject, assert,
caller) fail with a clear reason instead of passing.
"""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import math
import time
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable

from websockets.asyncio.client import ClientConnection, connect

from .match import get_path, interpolate, match

FRAME_MS = 20
ACTIONS = ("send", "send_audio", "expect", "expect_none", "expect_audio", "expect_close", "wait",
           "inject", "assert", "close", "caller")


def now_ms() -> float:
    return time.monotonic() * 1000


class StepFailure(Exception):
    pass


@dataclass
class Frame:
    at: float
    kind: str  # "json" | "binary" | "text"
    data: Any


class Peer:
    """A WebSocket connection whose received frames are logged with arrival times."""

    def __init__(self, ws: ClientConnection):
        self.ws = ws
        self.items: list[Frame] = []
        self.closed: tuple[float, int | None] | None = None
        self._changed = asyncio.Event()
        self._reader = asyncio.create_task(self._read())

    async def _read(self) -> None:
        try:
            async for message in self.ws:
                at = now_ms()
                if isinstance(message, bytes):
                    self.items.append(Frame(at, "binary", message))
                else:
                    try:
                        data = json.loads(message)
                        kind = "json" if isinstance(data, dict) else "text"
                    except ValueError:
                        data, kind = message, "text"
                    self.items.append(Frame(at, kind, data))
                self._notify()
        except Exception:
            pass
        self.closed = (now_ms(), self.ws.close_code)
        self._notify()

    def _notify(self) -> None:
        self._changed.set()
        self._changed = asyncio.Event()

    async def wait_until(self, check: Callable[[], Any], deadline: float) -> Any:
        while True:
            event = self._changed
            v = check()
            if v is not None:
                return v
            remaining = (deadline - now_ms()) / 1000
            if remaining <= 0:
                return check()
            try:
                await asyncio.wait_for(event.wait(), remaining)
            except asyncio.TimeoutError:
                return check()

    async def send_json(self, data: dict[str, Any]) -> None:
        await self.ws.send(json.dumps(data))

    async def send_binary(self, data: bytes) -> None:
        await self.ws.send(data)

    async def close(self) -> None:
        await self.ws.close()


def signature_headers(url: str, secret: str, timestamp: int | None = None) -> dict[str, str]:
    ts = int(time.time()) if timestamp is None else timestamp
    sig = hmac.new(secret.encode(), f"{ts}.{url}".encode(), hashlib.sha256).hexdigest()
    return {"X-Fonoster-Signature": sig, "X-Fonoster-Timestamp": str(ts)}


class FakeAppBridge:
    """Dials an app the way AppBridge does, with a signed request."""

    def __init__(self, signing_secret: str | None = None, timestamp: int | None = None):
        self.signing_secret = signing_secret
        self.timestamp = timestamp

    async def dial(self, url: str) -> Peer:
        headers = signature_headers(url, self.signing_secret, self.timestamp) if self.signing_secret else {}
        ws = await connect(url, additional_headers=headers, open_timeout=5)
        return Peer(ws)


@dataclass
class Result:
    name: str
    status: str
    reason: str | None = None
    steps: list[dict[str, Any]] = field(default_factory=list)


def _bytes_per_ms(audio: dict[str, Any]) -> float:
    codec = str(audio.get("codec", "pcm16")).lower()
    rate = int(audio.get("rate", 16000))
    return rate / 1000 * (1 if codec in ("pcmu", "mulaw", "ulaw") else 2)


def _tone(ms: int, audio: dict[str, Any]) -> bytes:
    # 440 Hz tone or silence in the session format (pcm16 only; enough for SDK suites).
    rate = int(audio.get("rate", 16000))
    n = round(rate * ms / 1000)
    out = bytearray()
    for i in range(n):
        s = round(8000 * math.sin(2 * math.pi * 440 * i / rate))
        out += int(s).to_bytes(2, "little", signed=True)
    return bytes(out)


async def run_scenario(
    scenario: dict[str, Any],
    connect_peer: Callable[[], Awaitable[Peer]],
    default_timeout_ms: float = 5000,
) -> Result:
    result = Result(scenario["name"], "passed")
    if scenario.get("skip"):
        return Result(scenario["name"], "skipped", scenario["skip"])
    if scenario.get("setup"):
        return Result(scenario["name"], "failed", "scenario has setup but this runner has no harness")

    peer: Peer | None = None
    try:
        peer = await connect_peer()
        await _Run(scenario, peer, default_timeout_ms, result).execute()
    except Exception as e:  # noqa: BLE001 - every failure becomes the scenario's reason
        result.status = "failed"
        result.reason = str(e)
    finally:
        if peer and not peer.closed:
            await peer.close()
    return result


class _Run:
    def __init__(self, scenario: dict[str, Any], peer: Peer, timeout: float, result: Result):
        self.s = scenario
        self.peer = peer
        self.timeout = timeout
        self.result = result
        self.ignore = set(scenario.get("ignore", []))
        self.vars: dict[str, Any] = {"scenario": scenario["name"]}
        self.labels: dict[str, float] = {}
        self.cursor = 0
        self.prev_end = now_ms()
        self.audio: dict[str, Any] | None = None

    async def execute(self) -> None:
        self.prev_end = now_ms()
        for i, step in enumerate(self.s["steps"], start=1):
            action = next(a for a in ACTIONS if a in step)
            try:
                await self.step(step, action)
                self.result.steps.append({"step": i, "action": action, "ok": True})
            except StepFailure as e:
                self.result.steps.append({"step": i, "action": action, "ok": False, "error": str(e)})
                label = f' "{step["label"]}"' if "label" in step else ""
                raise StepFailure(f"step {i} ({action}{label}): {e}") from None
            self.prev_end = now_ms()
            if "label" in step:
                self.labels[step["label"]] = self.prev_end

    def anchor(self, step: dict[str, Any]) -> float:
        if "from" in step:
            return self.labels[step["from"]]
        return self.prev_end

    def deadline(self, step: dict[str, Any], anchor: float) -> float:
        if "within_ms" in step:
            return anchor + step["within_ms"]
        return max(anchor, now_ms()) + self.timeout

    def check_timing(self, step: dict[str, Any], anchor: float, at: float) -> None:
        elapsed = at - anchor
        if "not_before_ms" in step and elapsed < step["not_before_ms"]:
            raise StepFailure(f"arrived after {elapsed:.0f} ms, expected not before {step['not_before_ms']} ms")
        if "within_ms" in step and elapsed > step["within_ms"]:
            raise StepFailure(f"arrived after {elapsed:.0f} ms, limit {step['within_ms']} ms")
        if "budget_ms" in step:
            raise StepFailure("budget_ms needs a harness that reports provider delays")

    async def step(self, step: dict[str, Any], action: str) -> None:
        if action == "send":
            data = interpolate(step["send"], self.vars)
            if data.get("type") == "session.start":
                self.audio = data.get("audio")
            await self.peer.send_json(data)
        elif action == "send_audio":
            await self.send_audio(step["send_audio"])
        elif action == "expect":
            await self.expect(step)
        elif action == "expect_none":
            await self.expect_none(step)
        elif action == "expect_audio":
            await self.expect_audio(step)
        elif action == "expect_close":
            anchor = self.anchor(step)
            closed = await self.peer.wait_until(lambda: self.peer.closed, self.deadline(step, anchor))
            if not closed:
                raise StepFailure("the connection is still open")
            want = step["expect_close"].get("code")
            if want is not None and closed[1] != want:
                raise StepFailure(f"closed with code {closed[1]}, expected {want}")
            self.check_timing(step, anchor, closed[0])
        elif action == "wait":
            await asyncio.sleep(step["wait"]["ms"] / 1000)
        elif action == "close":
            await self.peer.close()
        else:
            raise StepFailure(f"this runner has no harness for {action} steps")

    def type_of(self, data: dict[str, Any]) -> str | None:
        t = data.get("type")
        return t if isinstance(t, str) else None

    async def expect(self, step: dict[str, Any]) -> None:
        pattern = interpolate(step["expect"], self.vars)
        anchor = self.anchor(step)
        state = {"scanned": self.cursor, "closest": None}

        def check() -> Any:
            items = self.peer.items
            while state["scanned"] < len(items):
                i = state["scanned"]
                state["scanned"] += 1
                frame = items[i]
                if frame.kind != "json":
                    continue
                t = self.type_of(frame.data)
                if t and t in self.ignore:
                    continue
                reason = match(pattern, frame.data)
                if reason is None:
                    return (i, frame, None)
                if step.get("next"):
                    return (i, frame, reason)
                if t is not None and t == pattern.get("type"):
                    state["closest"] = reason
            if self.peer.closed:
                return ("closed",)
            return None

        found = await self.peer.wait_until(check, self.deadline(step, anchor))
        if not found or found[0] == "closed":
            why = "the peer closed the connection" if found else "timed out"
            closest = f"; closest: {state['closest']}" if state["closest"] else ""
            raise StepFailure(f"no frame matched {json.dumps(pattern)} ({why}{closest})")
        index, frame, mismatch = found
        if mismatch:
            raise StepFailure(f"the next frame did not match: {json.dumps(frame.data)} ({mismatch})")
        self.cursor = index + 1
        self.check_timing(step, anchor, frame.at)
        for name, path in (step.get("capture") or {}).items():
            value = get_path(frame.data, path)
            if value is None:
                raise StepFailure(f"capture {name}: {path} is not in the matched frame")
            self.vars[name] = value

    async def expect_none(self, step: dict[str, Any]) -> None:
        pattern = interpolate(step["expect_none"], self.vars)
        state = {"scanned": self.cursor}

        def check() -> Any:
            items = self.peer.items
            while state["scanned"] < len(items):
                frame = items[state["scanned"]]
                state["scanned"] += 1
                if frame.kind != "json":
                    continue
                t = self.type_of(frame.data)
                if t and t in self.ignore:
                    continue
                if match(pattern, frame.data) is None:
                    return frame
            return None

        violation = await self.peer.wait_until(check, now_ms() + step["for_ms"])
        if violation:
            raise StepFailure(f"unexpected frame {json.dumps(violation.data)}")

    async def expect_audio(self, step: dict[str, Any]) -> None:
        spec = step["expect_audio"]
        want = spec.get("ms")
        pattern = {"$gte": want} if isinstance(want, (int, float)) else (want or {"$gt": 0})
        anchor = self.anchor(step)
        if not self.audio:
            raise StepFailure("audio format unknown: no session.start seen")
        per_ms = _bytes_per_ms(self.audio)

        def check() -> Any:
            total = 0.0
            for f in self.peer.items:
                if f.kind != "binary" or f.at < anchor:
                    continue
                total += len(f.data) / per_ms
                if match(pattern, round(total)) is None:
                    return f.at
            return None

        at = await self.peer.wait_until(check, self.deadline(step, anchor))
        if at is None:
            raise StepFailure(f"not enough audio, expected {json.dumps(pattern)}")
        self.check_timing(step, anchor, at)

    async def send_audio(self, source: dict[str, Any]) -> None:
        if not self.audio:
            raise StepFailure("audio format unknown: no session.start seen")
        if source.get("kind") == "file":
            raise StepFailure("this runner does not send audio files")
        ms = source.get("ms", FRAME_MS)
        pcm = _tone(ms, self.audio) if source.get("kind", "tone") == "tone" else bytes(int(ms * _bytes_per_ms(self.audio)))
        size = int(_bytes_per_ms(self.audio) * FRAME_MS)
        track = bytes([source.get("track", 1)])
        start = now_ms()
        for n, i in enumerate(range(0, len(pcm), size)):
            if source.get("realtime", True):
                delay = (start + n * FRAME_MS - now_ms()) / 1000
                if delay > 0:
                    await asyncio.sleep(delay)
            await self.peer.send_binary(track + pcm[i : i + size])
