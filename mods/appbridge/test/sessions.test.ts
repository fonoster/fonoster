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

// The gateway's session-registry entries (add-platform 2.3): gateways.<ref> while it runs and
// calls.<callRef> while a call lives, removed on a clean stop. Needs JetStream:
// CONFORMANCE_JETSTREAM_URL (or a CONFORMANCE_NATS_URL server with JetStream).
const URL =
  process.env.CONFORMANCE_JETSTREAM_URL ?? process.env.CONFORMANCE_NATS_URL;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(fn: () => Promise<T | undefined>, ms = 3000) {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v !== undefined) return v;
    if (Date.now() > deadline) throw new Error("timed out");
    await sleep(30);
  }
}

describe("@gateway session registry", function () {
  this.timeout(15000);
  const bucket = `test_gw_sessions_${Date.now()}`;
  let nc: NatsConnection;
  let harness: FakesHarness;

  before(async function () {
    if (!URL) return this.skip();
    nc = await connect({ servers: URL });
    try {
      await (await nc.jetstreamManager()).getAccountInfo();
    } catch {
      await nc.close();
      return this.skip();
    }
    harness = await new FakesHarness().start();
    harness.roomrNode.attachNats(nc);
  });

  after(async () => {
    await harness?.stop();
    if (!nc || nc.isClosed()) return;
    await (await nc.jetstreamManager()).streams
      .delete(`KV_${bucket}`)
      .catch(() => undefined);
    await nc.close();
  });

  it("writes its gateway and call entries and removes them on stop", async function () {
    const urls = harness.providerUrls;
    const config: GatewayConfig = {
      nats: { url: URL! },
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
    const gateway = await new Gateway({
      config,
      nats: nc,
      record: new MemoryCallRecordSink(),
      sessions: bucket
    }).start();
    const kv = await Sessions.openSessions(nc, { bucket });
    const callRef = `reg-${Date.now()}`;
    try {
      const own = await waitFor(() =>
        Sessions.getSession(kv, "gateways", gateway.gatewayRef)
      );
      expect(own).to.include({ gatewayRef: gateway.gatewayRef });
      const offered = harness.roomrNode.offerCall({ callRef });
      await harness.app.nextConnection();
      const call = await waitFor(() =>
        Sessions.getSession(kv, "calls", callRef)
      );
      expect(call).to.include({
        callRef,
        gatewayRef: gateway.gatewayRef,
        roomRef: offered.roomRef,
        direction: "inbound"
      });
    } finally {
      await gateway.stop();
    }
    expect(await Sessions.getSession(kv, "calls", callRef)).to.equal(undefined);
    expect(
      await Sessions.getSession(kv, "gateways", gateway.gatewayRef)
    ).to.equal(undefined);
  });
});
