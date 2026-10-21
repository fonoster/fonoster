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

// The agent's long-lived maps and timers stay bounded (in-memory state audit, phase 4): nodes that
// went away (a new node_ref on every start) are forgotten, and config retries while the control
// plane is unreachable do not pile up timer handles.

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

  it("forgets nodes that went away (100 node restarts); active calls are their rooms", async function () {
    const { nc, send, published } = fakeNats();
    const a = await startAgent(nc);
    for (let i = 0; i < 100; i++) {
      send("roomr.nodes.*.heartbeat", {
        type: "node.heartbeat",
        node_ref: `n-${i}`,
        rooms: 2
      });
      await clock.tickAsync(5_000); // each "restart" gets a new ref
    }
    await a.heartbeat();
    const { components, activeCalls } = await a.components();
    expect(components.roomrNodes).to.be.at.most(2);
    expect(activeCalls).to.equal(components.roomrNodes * 2);
    expect(a.componentCounts.nodes).to.be.at.most(2);
    // No probe: AppBridge counts as not ready; the agent subscribes to no AppBridge subject.
    expect(components.appbridges).to.equal(0);
    expect(published.some((s) => s.startsWith("appbridge."))).to.equal(false);
  });
});

describe("@region-agent region status from health checks and room counts", function () {
  it("reports AppBridge ready from its health check and active calls as the nodes' rooms", async function () {
    const { nc, send } = fakeNats();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "region-status-"));
    let ready = true;
    const agent = new RegionAgent({
      identity: { regionRef: "rg_test", tokenId: "t1" } as never,
      nc,
      version: "0.0.0-test",
      stateDir: dir,
      firstHeartbeatMs: 60_000,
      appbridgeProbe: async () => ready,
      autopilotProbe: async () => true
    });
    try {
      await agent.start();
      for (const [node, rooms] of [
        ["n-1", 3],
        ["n-2", 4]
      ] as const)
        send("roomr.nodes.*.heartbeat", {
          type: "node.heartbeat",
          node_ref: node,
          rooms
        });
      expect(await agent.components()).to.deep.equal({
        components: { roomrNodes: 2, appbridges: 1, autopilot: true },
        activeCalls: 7
      });
      // No ready AppBridge behind the Service: the region turns degraded (control plane).
      ready = false;
      expect((await agent.components()).components.appbridges).to.equal(0);
      // A probe that throws counts as not ready.
      ready = true;
      (
        agent as unknown as { options: { appbridgeProbe: () => never } }
      ).options.appbridgeProbe = () => {
        throw new Error("boom");
      };
      expect((await agent.components()).components.appbridges).to.equal(0);
      // node.down takes a node out of the count at once.
      send("roomr.nodes.*.heartbeat", { type: "node.down", node_ref: "n-2" });
      expect(await agent.components()).to.deep.include({ activeCalls: 3 });
    } finally {
      await agent.stop();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
