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
import {
  FakeAppBridge,
  FakesHarness,
  interpolate,
  loadScenarios,
  repeatScenario
} from "@fonoster/conformance";
import { VoiceServer } from "@fonoster/voice";
import { createAutopilotHandler } from "../../src/session";

// The latency stopwatch (rework-autopilot task 1.3): turn.ended to the first speak, minus the
// fake LLM's delay, repeated; Autopilot's own share must stay small at p95.
const RUNS = Number(process.env.AUTOPILOT_TIMING_RUNS ?? 20);
const BUDGET_P95_MS = 50;

describe("@autopilot/session latency stopwatch", function () {
  this.timeout(60000);

  it(`[APT-021] adds at most ${BUDGET_P95_MS} ms at p95 from turn.ended to the first speak`, async function () {
    const scenario = loadScenarios("autopilot").find(
      (s) => s.name === "turn-end-to-first-speak"
    )!;
    const report = await repeatScenario(scenario, RUNS, async () => {
      const harness = await new FakesHarness().start();
      const server = await new VoiceServer({
        port: 0,
        host: "127.0.0.1",
        signingSecret: "t"
      }).listen(
        createAutopilotHandler({
          agent: interpolate(scenario.setup!.agent!, harness.vars()),
          providers: { fake: { baseUrl: harness.llm.url } }
        })
      );
      return {
        options: {
          harness,
          connect: () =>
            new FakeAppBridge({ signingSecret: "t" }).dial(
              `ws://127.0.0.1:${server.port}/`
            )
        },
        cleanup: async () => {
          await server.close();
          await harness.stop();
        }
      };
    });
    expect(report.failures, JSON.stringify(report.failures[0])).to.have.length(
      0
    );
    const adjusted = report.steps["first-speak"].adjusted!;
    expect(adjusted.p95).to.be.at.most(BUDGET_P95_MS);
  });
});
