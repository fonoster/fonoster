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
  FakeNodeDriver,
  loadScenarios,
  RoomrSuiteHarness,
  runScenario
} from "../src";

// The media-control scenarios (redesign-roomr 11.2) against the fake Roomr node: Roomr over
// gRPC, one control stream per call to the fake session endpoint, events and heartbeats on NATS,
// and the caller, trunk and registrar in memory. The Go node runs the same files
// (media-control-go.test.ts), which owns the files in the QA catalog (areas/roomr.md); here
// every scenario is one case, ROM-038: the fake node keeps the node's contract. Scenarios tagged
// `go-node` need a real SIP stack (codecs, TLS, files on disk) and run there only, so they are
// not tests here. Needs NATS: set CONFORMANCE_NATS_URL.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;

describe("@conformance media-control scenarios (fake Roomr node)", function () {
  this.timeout(40000);
  let nc: NatsConnection;

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async function () {
    await nc?.close();
  });

  const scenarios = loadScenarios("media-control").filter(
    (s) => !s.tags?.includes("go-node")
  );
  for (const scenario of scenarios) {
    it(`[ROM-038] ${scenario.name}`, async function () {
      const harness = await new RoomrSuiteHarness(
        new FakeNodeDriver(),
        nc,
        NATS_URL!
      ).start();
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
