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
import { Webhooks } from "@fonoster/common";
import { FakeWebhookReceiver } from "@fonoster/conformance";
import { expect } from "chai";
import { connect, NatsConnection } from "nats";
import {
  createTestDb,
  TestDb,
  testDatabaseUrl
} from "../../../common/test/persistence/testDb";
import { runWebhookFanout } from "../../src/webhooks/runWebhookFanout";

// The control plane's fan-out from webhooks.events (add-workspace-webhooks 2.2, LO-B1), against a
// throwaway Postgres (PERSISTENCE_TEST_DATABASE_URL) and NATS (CONFORMANCE_NATS_URL).

const WS = "WSfanout00000000000000000000000000";

describe("@apiserver/webhooks fan-out from the bus (database, NATS)", function () {
  this.timeout(120_000);
  let db: TestDb;
  let nc: NatsConnection;
  let producer: NatsConnection;
  let receiver: FakeWebhookReceiver;
  let fanout: Awaited<ReturnType<typeof runWebhookFanout>>;

  before(async function () {
    const natsUrl = process.env.CONFORMANCE_NATS_URL;
    if (!testDatabaseUrl() || !natsUrl) return this.skip();
    db = (await createTestDb())!;
    nc = await connect({ servers: natsUrl });
    producer = await connect({ servers: natsUrl });
    receiver = await new FakeWebhookReceiver().start();
    await db.prisma.application.create({
      data: {
        ref: "app-support",
        accessKeyId: WS,
        name: "Support line",
        type: "STREAM",
        endpoint: "wss://bot.example.com"
      }
    });
    // An endpoint as the Webhooks API stores it.
    const store = await Webhooks.PrismaWebhookStore.open(db.prisma);
    new Webhooks.WebhookDispatcher({
      store,
      allowInsecureUrls: true,
      allowedDestinations: ["127.0.0.1"]
    }).createEndpoint({
      workspaceRef: WS,
      url: receiver.url,
      events: ["call.started", "call.failed"]
    });
    await store.flush();
    fanout = await runWebhookFanout(
      {
        enabled: true,
        intervalMs: 200,
        refreshMs: 1000,
        allowInsecureUrls: true,
        allowedDestinations: ["127.0.0.1"]
      },
      { nc, db: db.prisma }
    );
    await nc.flush();
  });

  after(async function () {
    await fanout?.stop();
    const jsm = await nc?.jetstreamManager().catch(() => undefined);
    await jsm?.streams.delete("FONOSTER_WEBHOOKS").catch(() => undefined);
    await nc?.close();
    await producer?.close();
    await receiver?.stop();
    await db?.drop();
  });

  async function waitFor(n: number) {
    for (let i = 0; i < 100 && receiver.received.length < n; i++)
      await new Promise((r) => setTimeout(r, 50));
  }

  it("delivers an event a producer published on the bus, and logs it", async function () {
    const event = Webhooks.callStarted(WS, {
      callRef: "c1",
      appRef: "app-support",
      from: "+15550001111",
      to: "+15550002222",
      direction: "inbound"
    });
    Webhooks.busWebhookPublisher(producer)(event);
    await waitFor(1);
    expect(receiver.received.map((r) => r.json.id)).to.deep.equal([event.id]);
    await fanout.runDue();
    const rows = await db.prisma.webhookDelivery.findMany();
    expect(rows.map((r: { status: string }) => r.status)).to.deep.equal([
      "succeeded"
    ]);
  });

  it("turns a Roomr node's call.failed report into the app's workspace event (M6)", async function () {
    // The node reports on its own subject; a workspace it names is ignored.
    producer.publish(
      "media.n1.events.call-failed",
      new TextEncoder().encode(
        JSON.stringify({
          type: "call.failed",
          nodeId: "n1",
          callRef: "c2",
          appRef: "app-support",
          from: "+15550001111",
          to: "+15550002222",
          direction: "inbound",
          reason: "node_error",
          workspaceRef: "WSvictim"
        })
      )
    );
    await waitFor(2);
    const got = receiver.received[1]?.json;
    expect(got).to.deep.include({ type: "call.failed", workspaceRef: WS });
    expect(got?.data).to.deep.include({ callRef: "c2", reason: "node_error" });
  });
});
