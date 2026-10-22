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
import { NatsConnection, connect } from "nats";
import { FakeSessionNode, FakesHarness } from "@fonoster/conformance";
import { Sessions } from "@fonoster/common";
import { AppBridge, AppBridgeConfig, MemoryCallRecordSink } from "../src";

// Two AppBridge replicas on one NATS (in-memory state audit, test 6): a call whose ref names a
// live call on the other replica never takes that call's ref (RV-B7 across replicas): it gets its
// room's. The fake node opens each stream to the replica it is pointed at (a Service would pick
// one). Needs NATS with JetStream: set CONFORMANCE_NATS_URL.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(
  fn: () => T | undefined | Promise<T | undefined>,
  ms = 3000
): Promise<T> {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v !== undefined && v !== false) return v;
    if (Date.now() > deadline) throw new Error("timed out");
    await sleep(20);
  }
}

describe("@AppBridge replicas", function () {
  this.timeout(20000);
  const bucket = `test_gw_replicas_${Date.now()}`;
  let nc: NatsConnection;
  let harness: FakesHarness;
  const appbridges: AppBridge[] = [];

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
    try {
      await (await nc.jetstreamManager()).getAccountInfo();
    } catch {
      await nc.close();
      return this.skip();
    }
    harness = await new FakesHarness().start();
  });

  after(async () => {
    for (const g of appbridges) await g.stop();
    await harness?.stop();
    if (!nc || nc.isClosed()) return;
    await (
      await nc.jetstreamManager()
    ).streams
      .delete(`KV_${bucket}`)
      .catch(() => undefined);
    await nc.close();
  });

  async function startAppBridge() {
    const urls = harness.providerUrls;
    const config: AppBridgeConfig = {
      nats: { url: NATS_URL! },
      session: { listen: "127.0.0.1:0" },
      apps: [
        {
          ref: "a",
          url: harness.app.url,
          protocol: "fonoster",
          signingSecret: "secret",
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
    };
    const g = await new AppBridge({
      config,
      nats: nc,
      record: new MemoryCallRecordSink(),
      sessions: bucket
    }).start();
    harness.roomrNode.configure({ endpoint: g.sessionEndpoint });
    appbridges.push(g);
    return g;
  }

  it("gives a new ref to a call whose X-Call-Ref is live on another AppBridge; the lease keeps its owner (RV-B7)", async function () {
    const kv = await Sessions.openSessions(nc, { bucket });
    const callRef = `live-${Date.now()}`;
    // Only g1 runs: the live call is g1's.
    const g1 = await startAppBridge();
    await harness.roomrNode.offerCall({ callRef });
    await harness.app.nextConnection();
    const lease = await waitFor(() =>
      Sessions.getSession(kv, "calls", callRef)
    );
    expect(lease.bridgeRef).to.equal(g1.bridgeRef);

    // A second replica joins; the node's next stream with the same call ref lands on it (the
    // Service's choice). g2 sees the ref live on g1 and takes the room's ref instead.
    const g2 = await startAppBridge();
    const g2Before = g2.calls.size;
    // A node never offers two live calls with one ref: the second comes from another node.
    const otherNode = new FakeSessionNode({
      endpoint: harness.roomrNode.options.endpoint
    });
    const second = await otherNode.offerCall({ callRef });
    await harness.app.nextConnection();
    await waitFor(() => g2.calls.size > g2Before || undefined);
    const all = [...g1.calls.keys(), ...g2.calls.keys()];
    expect(all.filter((r) => r === callRef)).to.have.length(1);
    expect([...g2.calls.keys()]).to.include(second.roomRef);
    expect([...g2.calls.keys()]).to.not.include(callRef);
    expect(g1.calls.has(callRef)).to.equal(true);
    // The live call's lease (and so its hang-up subject) still names g1.
    await sleep(100);
    expect(
      (await Sessions.getSession(kv, "calls", callRef))?.bridgeRef
    ).to.equal(g1.bridgeRef);
    await otherNode.stop();
  });
});
