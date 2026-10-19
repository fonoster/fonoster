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
import { sessionAgentSchema } from "@fonoster/common";
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
});
