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
import { connect, NatsConnection } from "nats";
import {
  buildMediaNode,
  loadScenarios,
  MediaNodeBinaries,
  ProcessMediaNodeHarness,
  runScenario
} from "../src";

// The same media-control scenarios against the Go media node (go/medianode), with real SIP and
// RTP from the caller bot. Needs NATS (CONFORMANCE_NATS_URL) and a Go toolchain.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;

describe("@conformance media-control scenarios (Go media node)", function () {
  this.timeout(60000);
  let nc: NatsConnection;
  let bins: MediaNodeBinaries | undefined;

  before(async function () {
    if (!NATS_URL) return this.skip();
    bins = buildMediaNode(NATS_URL);
    if (!bins) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async function () {
    await nc?.close();
  });

  for (const scenario of loadScenarios("media-control")) {
    it(scenario.name, async function () {
      const harness = new ProcessMediaNodeHarness(nc, bins!);
      try {
        const result = await runScenario(scenario, {
          harness,
          connect: () => harness.connect()
        });
        expect(result.status, result.reason).to.equal("passed");
      } finally {
        await harness.stop();
      }
    });
  }
});
