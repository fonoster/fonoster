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
import { adapterFor } from "../src";
import { OpenAiCompatibleThink } from "../src/openai";

// GPT-5.1 and later (catalog feature `reasoning`, #1239) take max_completion_tokens, and Autopilot
// turns their reasoning off for a fast first token; every other model's body is unchanged.

describe("@fonoster/community OpenAI-compatible reasoning models", function () {
  let server: http.Server;
  let url: string;
  let lastBody: Record<string, unknown> = {};

  before(async () => {
    server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (d) => (body += d));
      req.on("end", () => {
        lastBody = JSON.parse(body);
        res.writeHead(200, { "content-type": "text/event-stream" });
        res.end("data: [DONE]\n\n");
      });
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(() => server.close());

  const send = async (reasoning?: boolean) => {
    const think = new OpenAiCompatibleThink(
      { baseUrl: url, apiKey: "k" },
      "gpt-5.4-mini",
      { temperature: 0.4, maxTokens: 400, reasoning }
    );
    for await (const _ of think.stream(
      [{ role: "user", content: "hi" }],
      [],
      new AbortController().signal
    ));
    return lastBody;
  };

  it("sends max_completion_tokens and reasoning_effort none for a reasoning model", async () => {
    const body = await send(true);
    expect(body).to.include({
      temperature: 0.4,
      max_completion_tokens: 400,
      reasoning_effort: "none"
    });
    expect(body).to.not.have.property("max_tokens");
  });

  const sendWith = async (options: Record<string, unknown>) => {
    const think = new OpenAiCompatibleThink(
      { baseUrl: url, apiKey: "k" },
      "m",
      { maxTokens: 400, ...options }
    );
    for await (const _ of think.stream(
      [{ role: "user", content: "hi" }],
      [],
      new AbortController().signal
    ));
    return lastBody;
  };

  it("sends effort low with reasoning left out for a model that can only lower it", async () => {
    const body = await sendWith({
      temperature: 0.4,
      reasoningLow: true,
      excludeReasoning: true
    });
    expect(body).to.include({
      temperature: 0.4,
      max_tokens: 400,
      reasoning_effort: "low",
      include_reasoning: false
    });
  });

  it("sends effort low alone for a vendor with no include_reasoning", async () => {
    const body = await sendWith({ reasoningLow: true });
    expect(body).to.include({ reasoning_effort: "low" });
    expect(body).to.not.have.property("include_reasoning");
  });

  it("the groq adapter leaves reasoning out", async () => {
    const groq = adapterFor("groq")!.llm!.create(
      { baseUrl: url, apiKey: "k" },
      "m",
      { maxTokens: 400, reasoningLow: true }
    );
    for await (const _ of groq.stream([], [], new AbortController().signal));
    expect(lastBody).to.include({ include_reasoning: false });
  });

  it("leaves temperature out when the options have none", async () => {
    expect(await sendWith({})).to.not.have.property("temperature");
  });

  it("keeps max_tokens and no reasoning_effort for other models", async () => {
    const body = await send();
    expect(body).to.include({ temperature: 0.4, max_tokens: 400 });
    expect(body).to.not.have.property("max_completion_tokens");
    expect(body).to.not.have.property("reasoning_effort");
  });
});
