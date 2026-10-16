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
import { expect } from "chai";
import WebSocket from "ws";
import { serveFakes } from "../src/fakes/serve";

describe("@conformance[fakes server]", function () {
  it("serves TTS, a scripted STT and the echo LLM on the given host and ports", async function () {
    const fakes = await serveFakes({
      FAKES_HOST: "127.0.0.1",
      FAKES_TTS_PORT: "0",
      FAKES_STT_PORT: "0",
      FAKES_LLM_PORT: "0",
      FAKES_STT_SCRIPT: JSON.stringify([{ atMs: 20, text: "hello" }])
    });
    try {
      const tts = await fetch(`${fakes.tts.url}/v1/synthesize`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "hi" })
      });
      expect(tts.status).to.equal(200);
      expect((await tts.arrayBuffer()).byteLength).to.be.greaterThan(0);

      const llm = await fetch(`${fakes.llm.url}/v1/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] })
      });
      const body = (await llm.json()) as {
        choices: { message: { content: string } }[];
      };
      expect(body.choices[0].message.content).to.equal("Echo: ping");

      const ws = new WebSocket(
        `${fakes.stt.url.replace("http", "ws")}/v1/listen?codec=pcm16&rate=16000`
      );
      const transcript = await new Promise<string>((resolve, reject) => {
        ws.on("open", () => ws.send(Buffer.alloc(16000 * 2 * 0.04)));
        ws.on("message", (raw) => resolve(JSON.parse(raw.toString()).text));
        ws.on("error", reject);
      });
      ws.close();
      expect(transcript).to.equal("hello");
    } finally {
      await Promise.all([fakes.tts.stop(), fakes.stt.stop(), fakes.llm.stop()]);
    }
  });
});
