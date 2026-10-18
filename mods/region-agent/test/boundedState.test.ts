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
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { NatsConnection, StringCodec } from "nats";
import * as sinon from "sinon";
import { RegionAgent } from "../src";

// The agent's long-lived maps and timers stay bounded (in-memory state audit, phase 4): gateways
// that went away (a new gatewayRef on every start) are forgotten, and config retries while the
// control plane is unreachable do not pile up timer handles.

const sc = StringCodec();

/** A NATS connection whose requests always time out; subscriptions are fed by `send`. */
function fakeNats() {
  const subs = new Map<string, (err: unknown, msg: unknown) => void>();
  const published: string[] = [];
  const nc = {
    subscribe: (subject: string, opts: { callback: never }) => {
      subs.set(subject, opts.callback);
      return { unsubscribe: () => subs.delete(subject) };
    },
    publish: (subject: string) => published.push(subject),
    flush: async () => undefined,
    request: async () => {
      throw new Error("TIMEOUT");
    }
  } as unknown as NatsConnection;
  const send = (subject: string, body: unknown) =>
    subs.get(subject)?.(null, { data: sc.encode(JSON.stringify(body)) });
  return { nc, send, published };
}

describe("@region-agent bounded state", function () {
  let clock: sinon.SinonFakeTimers;
  let dir: string;
  let agent: RegionAgent | undefined;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "region-bounded-"));
  });
  afterEach(async () => {
    await agent?.stop();
    agent = undefined;
    clock.restore();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const startAgent = async (nc: NatsConnection) => {
    agent = new RegionAgent({
      identity: { regionRef: "rg_test", tokenId: "t1" } as never,
      nc,
      version: "0.0.0-test",
      stateDir: dir,
      configRetryMs: 10_000,
      heartbeatMs: 30_000,
      firstHeartbeatMs: 6000
    });
    await agent.start();
    return agent;
  };

  it("keeps a bounded number of timers while the control plane is unreachable", async function () {
    const { nc } = fakeNats();
    const a = await startAgent(nc);
    // One hour of config retries every 10 s, plus heartbeats.
    for (let i = 0; i < 360; i++) await clock.tickAsync(10_000);
    expect(a.timerCount).to.be.at.most(2); // the next retry and the heartbeat interval
  });

  it("forgets gateways and nodes that went away (100 gateway restarts)", async function () {
    const { nc, send } = fakeNats();
    const a = await startAgent(nc);
    for (let i = 0; i < 100; i++) {
      send("gateway.heartbeat", { gatewayRef: `gw-${i}`, calls: 1 });
      send("roomr.nodes.*.heartbeat", {
        type: "node.heartbeat",
        node_ref: `n-${i}`
      });
      await clock.tickAsync(5_000); // each "restart" gets a new ref
    }
    await a.heartbeat();
    const { components, activeCalls } = await a.components();
    expect(components.gateways).to.be.at.most(4);
    expect(activeCalls).to.equal(components.gateways);
    expect(a.componentCounts.gateways).to.be.at.most(4);
    expect(a.componentCounts.nodes).to.be.at.most(2);
  });
});
