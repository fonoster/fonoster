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
import { Webhooks } from "@fonoster/common";
import { FakesHarness, Peer } from "@fonoster/conformance";
import { expect } from "chai";
import { connect, NatsConnection } from "nats";
import {
  Admission,
  AdmissionRequest,
  AppBridge,
  AppConfig,
  MemoryCallRecordSink
} from "../src";

// The called number of an inbound call (fonoster#1387): Routr 2.34 forwards To as the carrier
// wrote it and names the matched Number in X-DID-Number on a from-pstn call. The fake Roomr node
// offers the INVITE with those headers; AppBridge, the app and admission are real or recording
// fakes. Needs NATS.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const NUMBER = "+442079460018";

function json(peer: Peer) {
  return peer.frames.items
    .filter((f) => f.kind === "json")
    .map((f) => f.data as Record<string, unknown>);
}

describe("@appbridge called number from X-DID-Number (#1387)", function () {
  this.timeout(20000);
  let nc: NatsConnection;
  let harness: FakesHarness;
  let appbridge: AppBridge | undefined;
  let webhooks: Webhooks.WebhookEvent[];
  let record: MemoryCallRecordSink;
  let admitted: AdmissionRequest[];

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });
  after(async () => nc?.close());

  afterEach(async () => {
    await appbridge?.stop();
    appbridge = undefined;
    await harness?.stop();
  });

  async function start() {
    harness = await new FakesHarness().start();
    webhooks = [];
    admitted = [];
    record = new MemoryCallRecordSink();
    const app: AppConfig = {
      ref: "agent-a",
      url: harness.app.url,
      protocol: "fonoster",
      signingSecret: "s",
      workspaceRef: "WO-A",
      speech: { voice: "fake/default", language: "en-US" }
    };
    const admission: Admission = async (req) => {
      admitted.push(req);
      return { authorized: true };
    };
    const urls = harness.providerUrls;
    appbridge = await new AppBridge({
      config: {
        nats: { url: NATS_URL! },
        session: { listen: "127.0.0.1:0" },
        apps: [app],
        providers: {
          fake: {
            adapter: "fake",
            capabilities: ["tts", "stt"],
            tts: { url: urls.tts },
            stt: { url: urls.stt }
          }
        }
      },
      nats: nc,
      record,
      admission,
      webhooks: (e) => webhooks.push(e)
    }).start();
    harness.roomrNode.configure({ endpoint: appbridge.sessionEndpoint });
  }

  const until = async <T>(get: () => T | undefined, ms = 4000) => {
    const end = Date.now() + ms;
    for (;;) {
      const value = get();
      if (value) return value;
      if (Date.now() > end) throw new Error("timed out");
      await new Promise((r) => setTimeout(r, 20));
    }
  };

  /** The called number the call record, call.started, admission and the app session saw. */
  async function calledNumberOf(to: string, headers: Record<string, string>) {
    await start();
    const { callRef } = await harness.roomrNode.offerCall({
      appRef: "agent-a",
      to,
      headers
    });
    const { peer } = await harness.app.nextConnection();
    const session = await until(() =>
      json(peer).find((m) => m.type === "session.start")
    );
    const started = await until(() =>
      (record.records.get(callRef) ?? [])
        .map((e) => e.message as Record<string, unknown>)
        .find((m) => m.type === "call.started")
    );
    const webhook = await until(() =>
      webhooks.find((e) => e.type === "call.started")
    );
    harness.roomrNode.callerHangup(callRef);
    return {
      record: started.to,
      webhook: (webhook.data as Record<string, unknown>).to,
      admission: admitted[0]?.to,
      session: session.to
    };
  }

  const everywhere = (value: string) => ({
    record: value,
    webhook: value,
    admission: value,
    session: value
  });

  it("[APB-049] uses X-DID-Number on a from-pstn call, whatever the carrier wrote in To", async function () {
    for (const to of ["02079460018", "sales"]) {
      expect(
        await calledNumberOf(to, {
          "X-Call-Direction": "from-pstn",
          "X-DID-Number": NUMBER
        })
      ).to.deep.equal(everywhere(NUMBER));
      await appbridge?.stop();
      appbridge = undefined;
      await harness.stop();
    }
  });

  it("[APB-049] keeps the To user without X-DID-Number, or when the call isn't from-pstn", async function () {
    expect(
      await calledNumberOf("+15550002222", { "X-Call-Direction": "from-pstn" })
    ).to.deep.equal(everywhere("+15550002222"));
    await appbridge?.stop();
    appbridge = undefined;
    await harness.stop();
    expect(
      await calledNumberOf("+15550002222", {
        "X-Call-Direction": "agent-to-peer",
        "X-DID-Number": NUMBER
      })
    ).to.deep.equal(everywhere("+15550002222"));
  });
});
