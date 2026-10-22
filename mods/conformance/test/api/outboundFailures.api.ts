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
import { randomUUID } from "crypto";
import { Roomr, Webhooks } from "@fonoster/common";
import { FakeRoomr } from "@fonoster/conformance";
import { expect } from "chai";
import { connect, NatsConnection, StringCodec } from "nats";
import { Who } from "./drivers";
import { getWorld, World } from "./world";

// control-plane "Unanswered outbound calls are recorded as failed" (API-071 in
// mods/conformance/catalog/areas/api.md). An outbound call that ends before the answer reaches no
// AppBridge: the control plane reads the Roomr node's call.ended, has the region's record writer
// seal the minimal record in the app's workspace and sends call.failed. The node is a real one in
// roomr-fake, with a callee that is busy or answers; the record writer is a stand-in on its subject.

const sc = StringCodec();

describe("@api control-plane: unanswered outbound calls", function () {
  this.timeout(60_000);
  let world: World;
  let a: Who;
  let appRef: string;
  let nc: NatsConnection;
  const cleanup: (() => unknown)[] = [];

  before(async function () {
    world = await getWorld();
    a = await world.as(world.ownerA, world.wsA);
    appRef = (
      await world.raw.call<{ ref: string }>(
        a,
        "Applications",
        "createApplication",
        {
          name: `Dialer ${world.unique()}`,
          type: "STREAM",
          url: "wss://apps.example.com/session"
        }
      )
    ).ref;
    nc = await connect({ servers: world.stack.natsUrl });
  });

  afterEach(async () => {
    for (const fn of cleanup.splice(0).reverse()) await fn();
  });

  after(async () => nc?.close());

  const until = async (check: () => boolean, ms = 8000) => {
    const deadline = Date.now() + ms;
    while (!check()) {
      if (Date.now() > deadline) throw new Error("timed out");
      await new Promise((r) => setTimeout(r, 20));
    }
  };

  /**
   * Two control-plane replicas reading the nodes' call events the way the apiserver does, with the
   * workspace of an app from its database; the record writer of a fresh region; a node there.
   */
  async function setUp(callee: "busy" | "answer") {
    const { subscribeNodeCallEvents, natsFailedCallRecords } =
      await import("../../../apiserver/src/webhooks/nodeCallEvents");
    const db = world.stack.apiDb.prisma;
    const workspaceOfApp = async (ref: string) =>
      (
        await db.application.findUnique({
          where: { ref },
          select: { accessKeyId: true }
        })
      )?.accessKeyId ?? undefined;
    const intake: Webhooks.WebhookEvent[] = [];
    for (let i = 0; i < 2; i++) {
      const replica = await connect({ servers: world.stack.natsUrl });
      const stop = subscribeNodeCallEvents(replica, {
        intake: (e) => intake.push(e),
        records: natsFailedCallRecords(replica),
        workspaceOfApp
      });
      await replica.flush();
      cleanup.push(async () => {
        stop();
        await replica.close();
      });
    }
    const region = `rg-${randomUUID().slice(0, 8)}`;
    const records: Record<string, unknown>[] = [];
    const writer = nc.subscribe(`callrecord.${region}.maintenance`, {
      callback: (_e, msg) => {
        records.push(JSON.parse(sc.decode(msg.data)));
        msg.respond(sc.encode(JSON.stringify({ type: "ack" })));
      }
    });
    cleanup.push(() => writer.unsubscribe());
    const node = new FakeRoomr({ nc, callee, region });
    await node.start();
    cleanup.push(() => node.stop());
    // A heartbeat names the node's region.
    await new Promise((r) => setTimeout(r, 600));
    const roomr = Roomr.createRoomrPool();
    cleanup.push(() => roomr.close());
    const callRef = randomUUID();
    await roomr.createCall(node.controlAddr, {
      callRef,
      to: { uri: "sip:+15551234567@routr" },
      metadata: { app_ref: appRef, from: "+15550001111", to: "+15551234567" }
    });
    return { callRef, node, intake, records };
  }

  it("[API-071] records a busy outbound call as failed in the app's workspace and sends call.failed, once", async function () {
    const { callRef, intake, records } = await setUp("busy");
    await until(() => intake.length >= 1 && records.length >= 1);
    await new Promise((r) => setTimeout(r, 300));
    expect(intake).to.have.length(1);
    expect(intake[0].type).to.equal("call.failed");
    expect(intake[0].data).to.include({
      callRef,
      appRef,
      direction: "outbound",
      reason: "busy"
    });
    expect(records).to.have.length(1);
    expect(records[0]).to.deep.include({
      op: "failed_call",
      callRef,
      workspaceRef: world.wsA.accessKeyId
    });
    const entries = records[0].entries as Record<string, unknown>[];
    expect(entries.map((e) => e.type)).to.deep.equal([
      "call.started",
      "call.progress",
      "call.failed"
    ]);
    expect(entries[2]).to.include({ reason: "busy" });
  });

  it("[API-071] leaves an answered outbound call to AppBridge: no failed record, no call.failed", async function () {
    const { callRef, node, intake, records } = await setUp("answer");
    await new Promise((r) => setTimeout(r, 300));
    await node.endCall(callRef, "callee_hangup");
    await new Promise((r) => setTimeout(r, 800));
    expect(intake).to.deep.equal([]);
    expect(records).to.deep.equal([]);
  });
});
