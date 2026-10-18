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
import { FakeWebhookReceiver } from "@fonoster/conformance";
import { expect } from "chai";
import { AckPolicy, connect, NatsConnection } from "nats";
import {
  createTestDb,
  TestDb,
  testDatabaseUrl
} from "../../../common/test/persistence/testDb";
import {
  runWebhookFanout,
  WEBHOOK_EVENTS_DURABLE,
  WEBHOOK_EVENTS_STREAM
} from "../../src/webhooks/runWebhookFanout";

// The fan-out across replicas (ST-2, audit #34-#36): webhooks.events goes through a JetStream
// durable consumer acknowledged once the deliveries are stored, delivery ids depend on the event
// and the endpoint, and each event reloads its workspace's endpoints. Needs a throwaway Postgres
// (PERSISTENCE_TEST_DATABASE_URL) and NATS with JetStream (CONFORMANCE_NATS_URL).

const WS = "WSshared0000000000000000000000000";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("@apiserver/webhooks fan-out across replicas (database, NATS JetStream)", function () {
  this.timeout(60_000);
  const natsUrl = process.env.CONFORMANCE_NATS_URL;
  let db: TestDb;
  let producer: NatsConnection;
  let receiver: FakeWebhookReceiver;
  let replicas: {
    nc: NatsConnection;
    fanout: Awaited<ReturnType<typeof runWebhookFanout>>;
  }[] = [];
  let n = 0;

  const config = {
    enabled: true,
    intervalMs: 200,
    refreshMs: 60_000, // far longer than the tests: freshness must not depend on it
    allowInsecureUrls: true,
    allowedDestinations: ["127.0.0.1"],
    ackWaitMs: 1000
  };

  async function startReplica() {
    const nc = await connect({ servers: natsUrl });
    const fanout = await runWebhookFanout(config, { nc, db: db.prisma });
    replicas.push({ nc, fanout });
  }

  async function stopReplicas() {
    for (const r of replicas) {
      await r.fanout.stop();
      await r.nc.close();
    }
    replicas = [];
  }

  /** An endpoint as the Webhooks API on some replica stores it. */
  async function createEndpoint(events: Webhooks.WebhookEventType[]) {
    const store = await Webhooks.PrismaWebhookStore.open(db.prisma);
    const endpoint = new Webhooks.WebhookDispatcher({
      store,
      allowInsecureUrls: true,
      allowedDestinations: ["127.0.0.1"]
    }).createEndpoint({ workspaceRef: WS, url: receiver.url, events });
    await store.flush();
    return { store, endpoint };
  }

  const started = () =>
    Webhooks.callStarted(WS, {
      callRef: `c${++n}`,
      appRef: "app-1",
      from: "+15550001111",
      to: "+15550002222",
      direction: "inbound"
    });

  const receivedOf = (id: string) =>
    receiver.received.filter((r) => r.json.id === id).length;

  async function until(check: () => boolean, ms = 5000) {
    for (let i = 0; i < ms / 50 && !check(); i++) await wait(50);
  }

  before(async function () {
    if (!testDatabaseUrl() || !natsUrl) return this.skip();
    db = (await createTestDb())!;
    producer = await connect({ servers: natsUrl });
    receiver = await new FakeWebhookReceiver().start();
  });

  afterEach(async function () {
    if (!producer) return;
    await stopReplicas();
    const jsm = await producer.jetstreamManager();
    await jsm.streams.delete(WEBHOOK_EVENTS_STREAM).catch(() => undefined);
    await db.prisma.webhookDelivery.deleteMany();
    await db.prisma.webhookEndpoint.deleteMany();
  });

  after(async function () {
    await producer?.close();
    await receiver?.stop();
    await db?.drop();
  });

  it("delivers an event once when the replica that took it died before storing it", async function () {
    await createEndpoint(["call.started"]);
    // Create the stream and the durable consumer, then leave: no replica is running.
    await startReplica();
    await stopReplicas();
    const event = started();
    Webhooks.busWebhookPublisher(producer)(event);
    await producer.flush();
    // Replica A takes the event from the shared consumer and dies before acknowledging it.
    const a = await connect({ servers: natsUrl });
    const consumer = await a
      .jetstream()
      .consumers.get(WEBHOOK_EVENTS_STREAM, WEBHOOK_EVENTS_DURABLE);
    const taken = await consumer.next({ expires: 2000 });
    expect(taken, "replica A took the event").to.not.equal(null);
    await a.close();
    expect(receivedOf(event.id)).to.equal(0);
    // Replica B gets it once the ack wait runs out.
    await startReplica();
    await until(() => receivedOf(event.id) > 0);
    await wait(1500); // longer than the ack wait: a second delivery would land by now
    expect(receivedOf(event.id)).to.equal(1);
    const rows = await db.prisma.webhookDelivery.findMany({
      where: { eventId: event.id }
    });
    expect(rows.map((r: { status: string }) => r.status)).to.deep.equal([
      "succeeded"
    ]);
  });

  it("delivers an event fanned out twice (redelivered) once, across two replicas", async function () {
    await createEndpoint(["call.started"]);
    await startReplica();
    await startReplica();
    const event = started();
    Webhooks.busWebhookPublisher(producer)(event);
    Webhooks.busWebhookPublisher(producer)(event); // the same event again: a lost ack
    await until(() => receivedOf(event.id) > 0);
    await wait(1000);
    expect(receivedOf(event.id)).to.equal(1);
    expect(
      await db.prisma.webhookDelivery.count({ where: { eventId: event.id } })
    ).to.equal(1);
  });

  it("uses an endpoint created on another replica a moment ago, and stops for a deleted one", async function () {
    await startReplica();
    await startReplica();
    const { store, endpoint } = await createEndpoint(["call.started"]);
    const first = started();
    Webhooks.busWebhookPublisher(producer)(first);
    await until(() => receivedOf(first.id) > 0, 1000);
    expect(receivedOf(first.id), "delivered within 1 s").to.equal(1);
    store.deleteEndpoint(endpoint.id);
    await store.flush();
    const second = started();
    Webhooks.busWebhookPublisher(producer)(second);
    await wait(1000);
    expect(receivedOf(second.id)).to.equal(0);
  });

  it("acknowledges an event only after its deliveries are stored", async function () {
    await createEndpoint(["call.started"]);
    await startReplica();
    const event = started();
    Webhooks.busWebhookPublisher(producer)(event);
    await until(() => receivedOf(event.id) > 0);
    const jsm = await producer.jetstreamManager();
    const info = await jsm.consumers.info(
      WEBHOOK_EVENTS_STREAM,
      WEBHOOK_EVENTS_DURABLE
    );
    expect(info.config.ack_policy).to.equal(AckPolicy.Explicit);
    await until(() => false, 300);
    const after = await jsm.consumers.info(
      WEBHOOK_EVENTS_STREAM,
      WEBHOOK_EVENTS_DURABLE
    );
    expect(after.num_ack_pending).to.equal(0);
    expect(after.num_pending).to.equal(0);
  });
});
