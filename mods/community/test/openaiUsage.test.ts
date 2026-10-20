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
import * as http from "http";
import { AddressInfo } from "net";
import { expect } from "chai";
import { ThinkChunk } from "../src/llm";
import { OpenAiCompatibleThink } from "../src/openai";

// Token usage from OpenAI-compatible streams (add-usage-metering D6): the adapter asks for it with
// stream_options.include_usage and ends the stream with one usage chunk when the vendor reports it.

const chunk = (o: Record<string, unknown>) => `data: ${JSON.stringify(o)}\n\n`;
const content = (text: string, extra: Record<string, unknown> = {}) =>
  chunk({ choices: [{ index: 0, delta: { content: text } }], ...extra });

describe("@fonoster/community OpenAI-compatible usage", function () {
  let server: http.Server;
  let url: string;
  let replay: string[] = [];
  let lastBody: Record<string, unknown> = {};

  before(async () => {
    server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (d) => (body += d));
      req.on("end", () => {
        lastBody = JSON.parse(body);
        res.writeHead(200, { "content-type": "text/event-stream" });
        replay.forEach((l) => res.write(l));
        res.end("data: [DONE]\n\n");
      });
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(() => server.close());

  const run = async () => {
    const think = new OpenAiCompatibleThink(
      { baseUrl: url, apiKey: "k" },
      "m",
      {
        temperature: 0,
        maxTokens: 50
      }
    );
    const out: ThinkChunk[] = [];
    for await (const c of think.stream(
      [{ role: "user", content: "hi" }],
      [],
      new AbortController().signal
    ))
      out.push(c);
    return out;
  };

  it("asks for usage and reports OpenAI's final usage chunk, cached tokens included", async () => {
    replay = [
      content("Hello "),
      content("there."),
      chunk({
        choices: [],
        usage: {
          prompt_tokens: 1200,
          completion_tokens: 340,
          total_tokens: 1540,
          prompt_tokens_details: { cached_tokens: 800 }
        }
      })
    ];
    const out = await run();
    expect(lastBody.stream_options).to.deep.equal({ include_usage: true });
    expect(out).to.deep.equal([
      { type: "text", text: "Hello " },
      { type: "text", text: "there." },
      {
        type: "usage",
        usage: { inputTokens: 1200, outputTokens: 340, cachedTokens: 800 }
      }
    ]);
  });

  it("takes usage sent on the last content chunk, as some servers do", async () => {
    replay = [
      content("Hi."),
      content("", { usage: { prompt_tokens: 9, completion_tokens: 2 } })
    ];
    expect((await run()).pop()).to.deep.equal({
      type: "usage",
      usage: { inputTokens: 9, outputTokens: 2, cachedTokens: 0 }
    });
  });

  it("ends without a usage chunk when the vendor reports none", async () => {
    replay = [content("Hi.")];
    expect((await run()).map((c) => c.type)).to.deep.equal(["text"]);
  });
});
