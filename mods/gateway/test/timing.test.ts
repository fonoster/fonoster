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
import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { NatsConnection, connect } from "nats";
import {
  FakesHarness,
  Scenario,
  loadScenarios,
  repeatScenario
} from "@fonoster/conformance";
import { Gateway } from "../src";

// Pass bar T1 (conformance "Gateway latency pass bar"): the gateway adds at most 50 ms at p95 from
// speak to first audio, and clear silences the call within 40 ms. Runs only when
// CONFORMANCE_TIMING_RUNS is set (nightly, on a dedicated runner); writes a JSON report to
// CONFORMANCE_REPORT_DIR when set.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const RUNS = Number(process.env.CONFORMANCE_TIMING_RUNS ?? 0);
const REPORT_DIR = process.env.CONFORMANCE_REPORT_DIR;

function scenario(name: string): Scenario {
  const found = loadScenarios("voice-session").find((s) => s.name === name);
  if (!found) throw new Error(`no scenario ${name}`);
  return found;
}

describe("@gateway timing (T1)", function () {
  this.timeout(0);
  let nc: NatsConnection;

  before(async function () {
    if (!NATS_URL || !RUNS) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  async function makeRun() {
    const harness = await new FakesHarness({ vendorCalls: () => 0 }).start();
    harness.mediaNode.attachNats(nc);
    const urls = harness.providerUrls;
    const gateway = await new Gateway({
      nats: nc,
      config: {
        nats: { url: NATS_URL! },
        testMode: true,
        apps: [
          {
            ref: "app-1",
            url: harness.app.url,
            protocol: "fonoster",
            signingSecret: "s",
            speech: { voice: "fake/default", language: "en-US" }
          }
        ],
        providers: {
          fake: {
            adapter: "fake",
            capabilities: ["tts", "stt"],
            tts: { url: urls.tts },
            stt: { url: urls.stt }
          }
        }
      }
    }).start();
    return {
      options: { harness, connect: () => harness.offerCallAndAccept() },
      cleanup: async () => {
        await gateway.stop();
        await harness.stop();
      }
    };
  }

  function report(name: string, data: unknown) {
    if (!REPORT_DIR) return;
    fs.mkdirSync(REPORT_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(REPORT_DIR, `timing-${name}.json`),
      JSON.stringify(data, null, 2)
    );
  }

  it("adds at most 50 ms at p95 from speak to first audio", async function () {
    const r = await repeatScenario(
      scenario("text-to-first-audio"),
      RUNS,
      makeRun
    );
    report("text-to-first-audio", r);
    console.log(JSON.stringify(r.steps["first-audio"], null, 2));
    expect(r.failures, JSON.stringify(r.failures.slice(0, 3))).to.have.length(
      0
    );
    expect(r.steps["first-audio"].adjusted!.p95).to.be.at.most(50);
  });

  it("silences the call within 40 ms of clear at p95", async function () {
    const r = await repeatScenario(
      scenario("say-interrupted-by-clear"),
      RUNS,
      makeRun
    );
    report("clear", r);
    console.log(
      JSON.stringify(r.measurements["media.output_silent_within_ms"], null, 2)
    );
    expect(r.failures, JSON.stringify(r.failures.slice(0, 3))).to.have.length(
      0
    );
    expect(r.measurements["media.output_silent_within_ms"].p95).to.be.at.most(
      40
    );
  });
});
