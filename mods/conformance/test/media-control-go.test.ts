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
  buildRoomr,
  GoNodeDriver,
  loadScenarios,
  RoomrBinaries,
  RoomrSuiteHarness,
  runScenario,
  scenarioCase
} from "../src";

// The same media-control scenarios against the Go Roomr node (go/roomr), alone (conformance
// "Node tested alone"): real SIP and RTP from the caller bot, which is also the trunk the node
// dials and the registrar it registers with; the fake session endpoint and the fake controller;
// NATS through a fault proxy. No AppBridge, apiserver or Routr. Needs NATS
// (CONFORMANCE_NATS_URL) and a Go toolchain.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;

describe("@conformance media-control scenarios (Go Roomr node)", function () {
  this.timeout(60000);
  let nc: NatsConnection;
  let bins: RoomrBinaries | undefined;

  before(async function () {
    if (!NATS_URL) return this.skip();
    bins = buildRoomr(NATS_URL);
    if (!bins) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async function () {
    await nc?.close();
  });

  for (const scenario of loadScenarios("media-control")) {
    it(`${scenarioCase("media-control", scenario.name)}${scenario.name}`, async function () {
      const harness = await new RoomrSuiteHarness(
        new GoNodeDriver(bins!),
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
