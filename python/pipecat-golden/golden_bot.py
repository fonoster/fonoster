"""An unmodified Pipecat bot for the Twilio flavor golden test (gateway task 1.6).

It uses Pipecat's own pieces only: parse_telephony_websocket, TwilioFrameSerializer and
FastAPIWebsocketTransport. Behaviour, driven by caller keypresses:
  - on start: plays a 4 s tone (the caller must hear it)
  - "1": interrupts (Pipecat sends Twilio "clear")
  - "9": ends the pipeline (EndTaskFrame); with --auto-hang-up the serializer POSTs to base_url
Status lines (JSON) go to stdout so the test can follow along.
"""

from __future__ import annotations

import argparse
import json
import math
import sys

import uvicorn
from fastapi import FastAPI, WebSocket
from pipecat.frames.frames import (
    EndTaskFrame,
    Frame,
    InputAudioRawFrame,
    InputDTMFFrame,
    InterruptionFrame,
    OutputAudioRawFrame,
    StartFrame,
)
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.runner.utils import parse_telephony_websocket
from pipecat.serializers.twilio import TwilioFrameSerializer
from pipecat.transports.websocket.fastapi import FastAPIWebsocketParams, FastAPIWebsocketTransport

RATE = 16000


def status(event: str, **fields) -> None:
    print(json.dumps({"event": event, **fields}), flush=True)


def tone(seconds: float) -> bytes:
    n = int(RATE * seconds)
    return b"".join(
        int(8000 * math.sin(2 * math.pi * 440 * i / RATE)).to_bytes(2, "little", signed=True) for i in range(n)
    )


class GoldenBot(FrameProcessor):
    def __init__(self):
        super().__init__()
        self.audio_in = 0

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)
        if isinstance(frame, StartFrame):
            await self.push_frame(frame, direction)
            await self.push_frame(OutputAudioRawFrame(audio=tone(4.0), sample_rate=RATE, num_channels=1))
            status("speaking")
            return
        if isinstance(frame, InputAudioRawFrame):
            self.audio_in += 1
            if self.audio_in == 25:
                status("caller_audio", frames=self.audio_in)
            return
        if isinstance(frame, InputDTMFFrame):
            digit = frame.button.value
            status("dtmf", digit=digit)
            if digit == "1":
                await self.push_frame(InterruptionFrame())
                status("interrupted")
            elif digit == "9":
                status("ending")
                # Ask the task to end gracefully (Pipecat's idiom); the EndFrame it sends down
                # triggers auto_hang_up in the serializer, or the transport closes the socket.
                await self.push_frame(EndTaskFrame(), FrameDirection.UPSTREAM)
            return
        await self.push_frame(frame, direction)


def build_app(args) -> FastAPI:
    app = FastAPI()

    @app.websocket("/ws")
    async def ws(websocket: WebSocket):
        await websocket.accept()
        transport_type, call_data = await parse_telephony_websocket(websocket)
        status("connected", transport=transport_type, stream=call_data["stream_id"], call=call_data["call_id"])
        serializer = TwilioFrameSerializer(
            stream_sid=call_data["stream_id"],
            call_sid=call_data["call_id"],
            account_sid=args.account_sid,
            auth_token=args.auth_token,
            base_url=args.base_url,
            params=TwilioFrameSerializer.InputParams(auto_hang_up=args.auto_hang_up),
        )
        transport = FastAPIWebsocketTransport(
            websocket=websocket,
            params=FastAPIWebsocketParams(
                audio_in_enabled=True, audio_out_enabled=True, add_wav_header=False, serializer=serializer
            ),
        )
        task = PipelineTask(
            Pipeline([transport.input(), GoldenBot(), transport.output()]),
            params=PipelineParams(audio_in_sample_rate=RATE, audio_out_sample_rate=RATE),
        )
        await PipelineRunner(handle_sigint=False).run(task)
        status("finished")

    return app


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--port", type=int, required=True)
    p.add_argument("--base-url", required=True)
    p.add_argument("--account-sid", required=True)
    p.add_argument("--auth-token", required=True)
    p.add_argument("--auto-hang-up", action="store_true")
    args = p.parse_args()
    status("listening", port=args.port)
    uvicorn.run(build_app(args), host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    sys.exit(main())
