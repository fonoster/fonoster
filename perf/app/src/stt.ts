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
// The fake STT of the fake provider protocol (mods/conformance/PROVIDERS.md, after
// mods/conformance/src/fakes/providers/FakeStt.ts), unscripted: a final transcript every
// `finalEveryMs` of audio received, for the whole stream. `config` and `finalize` are ignored.
import { WebSocketServer } from "ws";

const TEXT = "tell me more";

export function startStt(port: number, finalEveryMs: number) {
  const server = new WebSocketServer({
    host: "127.0.0.1",
    port,
    path: "/v1/listen"
  });
  server.on("connection", (socket, req) => {
    const query = new URL(req.url ?? "/", "http://stt").searchParams;
    const language = query.get("language") ?? "en-US";
    const codec = query.get("codec") ?? "pcm16";
    const rate = Number(query.get("rate") ?? (codec === "pcmu" ? 8000 : 16000));
    const bytesPerMs = (rate * (codec === "pcmu" ? 1 : 2)) / 1000;
    let heardMs = 0;
    let lastFinalMs = 0;
    socket.on("message", (data, isBinary) => {
      if (!isBinary) return;
      heardMs += (data as Buffer).length / bytesPerMs;
      if (heardMs - lastFinalMs < finalEveryMs) return;
      socket.send(
        JSON.stringify({
          type: "transcript",
          text: TEXT,
          final: true,
          language,
          confidence: 0.9,
          startMs: Math.round(lastFinalMs),
          endMs: Math.round(heardMs)
        })
      );
      lastFinalMs = heardMs;
    });
    socket.on("error", () => undefined);
  });
}
