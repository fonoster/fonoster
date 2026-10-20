/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type { Protocol } from "./types";

/**
 * The smallest server for each protocol, shown beside the New app form. Both
 * are condensed from the docs: docs-site/streams/voice-sdk.mdx (Fonoster) and
 * docs-site/streams/bring-your-app.mdx (Pipecat over Twilio Media Streams).
 */
export const STARTERS: Record<
  Protocol,
  /** `run`: one command per line, each in its own terminal. */
  { file: string; code: string; run: string; docs: string }
> = {
  fonoster: {
    file: "server.js",
    code: `const { VoiceServer } = require("@fonoster/voice");

new VoiceServer({
  port: 3000,
  signingSecret: process.env.APP_SIGNING_SECRET,
  publicUrl: process.env.PUBLIC_URL
}).listen(async (session) => {
  await session.say("Thanks for calling. How can I help?");
  const answer = await session.gather({ timeout: 6000 });
  await session.say(\`You said \${answer.speech ?? "nothing"}. Goodbye.\`);
  await session.hangup();
});`,
    run: "ngrok http 3000\nAPP_SIGNING_SECRET=… PUBLIC_URL=wss://… node server.js",
    docs: "streams/voice-sdk"
  },
  twilio: {
    file: "bot.py",
    code: `from fastapi import FastAPI, WebSocket
from pipecat.runner.utils import parse_telephony_websocket
from pipecat.serializers.twilio import TwilioFrameSerializer

app = FastAPI()

@app.websocket("/ws")
async def ws(websocket: WebSocket):
    await websocket.accept()
    _, call = await parse_telephony_websocket(websocket)
    serializer = TwilioFrameSerializer(
        stream_sid=call["stream_id"],
        call_sid=call["call_id"],
        params=TwilioFrameSerializer.InputParams(auto_hang_up=False),
    )
    # Build your Pipecat pipeline with this serializer, as for Twilio.`,
    run: "ngrok http 8000\nuvicorn bot:app --port 8000",
    docs: "streams/bring-your-app"
  }
};
