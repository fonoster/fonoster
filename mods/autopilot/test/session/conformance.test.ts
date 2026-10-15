/*
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
import {
  FakeGateway,
  FakesHarness,
  interpolate,
  loadScenarios,
  runScenario
} from "@fonoster/conformance";
import { VoiceServer } from "@fonoster/voice/session";
import { createAutopilotHandler } from "../../src/session";

// The autopilot conformance scenarios, run against the session engine: the runner plays the
// gateway, the fakes harness provides the LLM, tools and media.
const SECRET = "autopilot-conformance";

describe("@autopilot/session conformance (autopilot scenarios)", function () {
  this.timeout(15000);
  const unhandled: unknown[] = [];
  const onUnhandled = (e: unknown) => unhandled.push(e);

  before(() => process.on("unhandledRejection", onUnhandled));
  after(() => process.off("unhandledRejection", onUnhandled));

  for (const scenario of loadScenarios("autopilot")) {
    it(scenario.name, async function () {
      const harness = await new FakesHarness().start();
      const assistant = interpolate(scenario.setup!.assistant!, harness.vars());
      const server = await new VoiceServer({
        port: 0,
        host: "127.0.0.1",
        signingSecret: SECRET
      }).listen(
        createAutopilotHandler({
          assistant,
          providers: { fake: { baseUrl: harness.llm.url } }
        })
      );
      try {
        const gateway = new FakeGateway({ signingSecret: SECRET });
        const result = await runScenario(scenario, {
          harness,
          connect: () => gateway.dial(`ws://127.0.0.1:${server.port}/`)
        });
        expect(result.status, result.reason).to.equal("passed");
        expect(unhandled, "unhandled rejections").to.deep.equal([]);
      } finally {
        await server.close();
        await harness.stop();
      }
    });
  }
});
