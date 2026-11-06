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
import * as fs from "fs";
import * as http from "http";
import { AddressInfo } from "net";
import * as os from "os";
import * as path from "path";
import { Registry, sessionAgentSchema } from "@fonoster/common";
import { expect } from "chai";
import { createEvalEffectiveConfig } from "../../src/models/evaluations/createEvalEffectiveConfig";
import { createEvaluateIntelligence } from "../../src/models/evaluations/createEvaluateIntelligence";
import { Metadata } from "@grpc/grpc-js";
import { struct } from "pb-util";

// Evaluations take session agents (rework-autopilot 8.2); keys come from the caller.

const AGENT = {
  conversationSettings: {
    systemPrompt: "You are a receptionist.",
    goodbyeMessage: "Bye.",
    systemErrorMessage: "Sorry."
  },
  languageModel: { model: "groq/openai/gpt-oss-120b" },
  testCases: {
    evalsLanguageModel: { provider: "openai", model: "gpt-4o-mini" },
    scenarios: []
  }
};

describe("@autopilot[evaluations]", function () {
  it("splits the catalog id and adds the resolved keys", function () {
    const config = createEvalEffectiveConfig(sessionAgentSchema.parse(AGENT), {
      apiKey: "gk",
      evaluationApiKey: "ok"
    });
    expect(config.languageModel).to.include({
      provider: "groq",
      model: "openai/gpt-oss-120b",
      apiKey: "gk"
    });
    expect(config.testCases!.evalsLanguageModel.apiKey).to.equal("ok");
  });

  it("reports a missing key and a legacy agent as eval errors", async function () {
    const run = async (config: unknown, keys: Record<string, string>) => {
      const events: Record<string, unknown>[] = [];
      const metadata = new Metadata();
      metadata.set("accessKeyId", "WS1");
      await createEvaluateIntelligence(async (p) => keys[p])({
        request: {
          intelligence: { config: struct.encode(config as never) }
        },
        metadata,
        write: (e: Record<string, unknown>) => events.push(e),
        end: () => {}
      } as never);
      return JSON.stringify(events);
    };
    expect(await run(AGENT, { openai: "ok" })).to.match(/no groq key/);
    expect(
      await run(
        {
          ...AGENT,
          languageModel: { provider: "openai", model: "gpt-4o" }
        },
        { openai: "ok" }
      )
    ).to.match(/provider/);
  });

  describe("with the catalog", function () {
    let dir: string;
    let server: http.Server;
    let bodies: Record<string, unknown>[];
    let registry: Registry.Registry;

    beforeEach(async () => {
      bodies = [];
      server = http.createServer(async (req, res) => {
        let raw = "";
        for await (const c of req) raw += c;
        bodies.push(JSON.parse(raw));
        res.writeHead(200, { "content-type": "text/event-stream" });
        const delta = { choices: [{ index: 0, delta: { content: "Hello." } }] };
        res.write(`data: ${JSON.stringify(delta)}\n\n`);
        res.end("data: [DONE]\n\n");
      });
      await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
      dir = fs.mkdtempSync(path.join(os.tmpdir(), "autopilot-eval-catalog-"));
      registry = new Registry.Registry({
        store: new Registry.FileRegistryStore(path.join(dir, "registry.json"))
      });
      registry.addProvider({
        id: "acme",
        adapter: "openai",
        capabilities: ["llm"],
        credentialRef: "acme",
        endpoints: {
          llm: `http://127.0.0.1:${(server.address() as AddressInfo).port}`
        }
      });
      registry.addModel({
        id: "acme/fast",
        type: "llm",
        features: ["streaming", "tool-calling", "reasoning"]
      });
    });

    afterEach(() => {
      server.close();
      fs.rmSync(dir, { recursive: true, force: true });
    });

    const evaluate = async (
      model: string,
      keys: (provider: string) => string | undefined = () => "k"
    ) => {
      const events: Record<string, unknown>[] = [];
      const metadata = new Metadata();
      metadata.set("accessKeyId", "WS1");
      await createEvaluateIntelligence(
        async (provider) => keys(provider),
        undefined,
        async () => registry
      )({
        request: {
          intelligence: {
            config: struct.encode({
              ...AGENT,
              languageModel: { model },
              testCases: {
                ...AGENT.testCases,
                scenarios: [
                  {
                    ref: "greeting",
                    description: "A greeting",
                    telephonyContext: {
                      callDirection: "FROM_PSTN",
                      ingressNumber: "+15550000001",
                      callerNumber: "+15550000002"
                    },
                    conversation: [
                      {
                        userInput: "Hi",
                        expected: { text: { type: "EXACT", response: "Hello." } }
                      }
                    ]
                  }
                ]
              }
            } as never)
          }
        },
        metadata,
        write: (e: Record<string, unknown>) => events.push(e),
        end: () => {}
      } as never);
      return JSON.stringify(events);
    };

    it("runs a model the way a call does: its catalog provider and features", async function () {
      await evaluate("acme/fast");
      expect(bodies).to.have.length.greaterThan(0);
      expect(bodies[0]).to.deep.include({
        model: "fast",
        max_completion_tokens: 400,
        reasoning_effort: "none"
      });
      expect(bodies[0]).to.not.have.property("max_tokens");
    });

    it("runs a keyless provider with no key, and refuses a keyed one without its key", async function () {
      const judgeOnly = (provider: string) =>
        provider === "openai" ? "ok" : undefined;
      expect(await evaluate("acme/fast", judgeOnly)).to.match(
        /no credential acme/
      );
      expect(bodies).to.have.length(0);

      registry.addProvider({
        id: "local",
        adapter: "openai",
        capabilities: ["llm"],
        endpoints: {
          llm: `http://127.0.0.1:${(server.address() as AddressInfo).port}`
        }
      });
      registry.addModel({
        id: "local/fast",
        type: "llm",
        features: ["streaming", "tool-calling"]
      });
      await evaluate("local/fast", judgeOnly);
      expect(bodies).to.have.length.greaterThan(0);
    });

    it("reports a model the catalog does not have as an eval error", async function () {
      expect(await evaluate("acme/unknown")).to.match(/not a language model/);
      expect(bodies).to.have.length(0);
    });
  });
});
