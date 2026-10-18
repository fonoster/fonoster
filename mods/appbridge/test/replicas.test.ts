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
import { FakesHarness } from "@fonoster/conformance";
import { Sessions } from "@fonoster/common";
import { Gateway, GatewayConfig, MemoryCallRecordSink } from "../src";

// Two gateway replicas on one NATS (in-memory state audit, test 6): a caller-supplied X-Call-Ref
// that names a live call on the other replica never takes that call's ref (RV-B7 across
// replicas). Needs NATS with JetStream: set CONFORMANCE_NATS_URL.
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

describe("@gateway replicas", function () {
  this.timeout(20000);
  const bucket = `test_gw_replicas_${Date.now()}`;
  let nc: NatsConnection;
  let harness: FakesHarness;
  const gateways: Gateway[] = [];

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
    harness.mediaNode.attachNats(nc);
  });

  after(async () => {
    for (const g of gateways) await g.stop();
    await harness?.stop();
    if (!nc || nc.isClosed()) return;
    await (await nc.jetstreamManager()).streams
      .delete(`KV_${bucket}`)
      .catch(() => undefined);
    await nc.close();
  });

  async function startGateway() {
    const urls = harness.providerUrls;
    const config: GatewayConfig = {
      nats: { url: NATS_URL! },
      testMode: true,
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
    const g = await new Gateway({
      config,
      nats: nc,
      record: new MemoryCallRecordSink(),
      sessions: bucket
    }).start();
    gateways.push(g);
    return g;
  }

  it("gives a new ref to a call whose X-Call-Ref is live on another gateway; the lease keeps its owner (RV-B7)", async function () {
    const kv = await Sessions.openSessions(nc, { bucket });
    const callRef = `live-${Date.now()}`;
    // Only g1 runs: the live call is g1's.
    const g1 = await startGateway();
    harness.mediaNode.offerCall({ callRef });
    await harness.app.nextConnection();
    const lease = await waitFor(() =>
      Sessions.getSession(kv, "calls", callRef)
    );
    expect(lease.gatewayRef).to.equal(g1.gatewayRef);

    // A second replica joins; the queue group sends each call.incoming to one of them. Offer the
    // same X-Call-Ref until g2 takes one (g1 refuses it locally either way).
    const g2 = await startGateway();
    let onG2 = false;
    for (let i = 0; i < 12 && !onG2; i++) {
      const before = g1.calls.size + g2.calls.size;
      const g2Before = g2.calls.size;
      const { roomRef } = harness.mediaNode.offerCall({ callRef });
      await harness.app.nextConnection();
      await waitFor(() => g1.calls.size + g2.calls.size > before || undefined);
      onG2 = g2.calls.size > g2Before;
      // Whoever took it, it got its room's ref, never the live call's.
      const all = [...g1.calls.keys(), ...g2.calls.keys()];
      expect(all.filter((r) => r === callRef)).to.have.length(1);
      expect(all).to.include(roomRef);
    }
    expect(onG2, "no call.incoming reached the second gateway").to.equal(true);
    expect([...g2.calls.keys()]).to.not.include(callRef);
    expect(g1.calls.has(callRef)).to.equal(true);
    // The live call's lease (and so its hang-up subject) still names g1.
    await sleep(100);
    expect(
      (await Sessions.getSession(kv, "calls", callRef))?.gatewayRef
    ).to.equal(g1.gatewayRef);
  });
});
