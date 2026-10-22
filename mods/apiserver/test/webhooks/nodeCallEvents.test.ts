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
import { Roomr, Sessions, Webhooks } from "@fonoster/common";
import { FakeRoomr } from "@fonoster/conformance";
import { expect } from "chai";
import { randomUUID } from "crypto";
import { connect, NatsConnection, StringCodec } from "nats";
import { createLostCalls } from "../../src/webhooks/lostCalls";
import {
  createNodeCallEvents,
  FailedCallRecord,
  natsFailedCallRecords,
  subscribeNodeCallEvents
} from "../../src/webhooks/nodeCallEvents";

// What the control plane learns from the Roomr nodes' call events (roomr.events.<call_ref>) and
// no AppBridge can report: call.failed and the minimal record of an unanswered outbound call, and
// call.ended (appbridge-lost) of a call whose AppBridge died (redesign-roomr 15.4).

const ended = (extra: Record<string, unknown> = {}) => ({
  type: "call.ended",
  node_ref: "n1",
  call_ref: "out-1",
  room_ref: "",
  seq: 3,
  cause: "busy",
  sip_status: 486,
  answered: false,
  metadata: { app_ref: "app-1", from: "+15550001111", to: "+15551234567" },
  ...extra
});

function harness() {
  const intake: Webhooks.WebhookEvent[] = [];
  const records: FailedCallRecord[] = [];
  const lost = createLostCalls({ emit: (e) => intake.push(e), graceMs: 0 });
  const events = createNodeCallEvents({
    lost,
    intake: (e) => intake.push(e),
    records: async (r) => records.push(r),
    workspaceOfApp: async (appRef) => (appRef === "app-1" ? "ws-1" : undefined),
    regionOf: (node) => (node === "n1" ? "us-east" : undefined)
  });
  return { intake, records, lost, events };
}

describe("@apiserver/webhooks node call events", function () {
  it("busy outbound call: call.failed and the minimal record with its call.progress entry", async function () {
    const h = harness();
    await h.events.onEvent("roomr.events.out-1", ended());
    expect(h.intake).to.have.length(1);
    expect(h.intake[0]).to.deep.include({
      type: "call.failed",
      workspaceRef: ""
    });
    expect(h.intake[0].data).to.deep.equal({
      callRef: "out-1",
      appRef: "app-1",
      from: "+15550001111",
      to: "+15551234567",
      direction: "outbound",
      reason: "busy"
    });
    expect(h.records).to.deep.equal([
      {
        callRef: "out-1",
        workspaceRef: "ws-1",
        region: "us-east",
        entries: [
          {
            type: "call.started",
            direction: "outbound",
            appRef: "app-1",
            workspaceRef: "ws-1",
            from: "+15550001111",
            to: "+15551234567"
          },
          { type: "call.progress", status: "busy", sipStatus: 486 },
          { type: "call.failed", reason: "busy", sipStatus: 486 }
        ]
      }
    ]);
  });

  it("no answer, rejected and a node error before answer fail the call too", async function () {
    for (const [cause, sip] of [
      ["no_answer", 408],
      ["rejected", 603],
      ["node_error", undefined]
    ] as const) {
      const h = harness();
      await h.events.onEvent(
        "roomr.events.out-1",
        ended({ cause, sip_status: sip })
      );
      expect(
        h.intake.map((e) => (e.data as { reason: string }).reason)
      ).to.deep.equal([cause]);
      expect(h.records[0].entries[2]).to.include({ reason: cause });
    }
  });

  it("an answered call, an inbound call and other events are AppBridge's: nothing here", async function () {
    const h = harness();
    await h.events.onEvent(
      "roomr.events.out-1",
      ended({ answered: true, cause: "callee_hangup" })
    );
    await h.events.onEvent("roomr.events.out-1", ended({ metadata: {} }));
    await h.events.onEvent(
      "roomr.events.out-1",
      ended({ type: "call.ringing" })
    );
    expect(h.intake).to.have.length(0);
    expect(h.records).to.have.length(0);
  });

  it("app_gone: call.ended (appbridge-lost) for a call that reached an app, once", async function () {
    const h = harness();
    h.lost.onEntry({
      kind: "calls",
      id: "in-1",
      value: {
        callRef: "in-1",
        bridgeRef: "gw-a",
        direction: "inbound",
        appRef: "app-1",
        from: "+1",
        to: "+2",
        startedAt: new Date().toISOString()
      },
      writtenAt: new Date()
    });
    const gone = ended({
      call_ref: "in-1",
      cause: "app_gone",
      answered: true,
      sip_status: undefined,
      metadata: {}
    });
    await h.events.onEvent("roomr.events.in-1", gone);
    await h.events.onEvent("roomr.events.in-1", gone);
    expect(h.intake).to.have.length(1);
    expect(h.intake[0]).to.deep.include({ type: "call.ended" });
    expect(h.intake[0].data).to.include({
      callRef: "in-1",
      endReason: "appbridge-lost"
    });
  });
});

describe("@apiserver/webhooks node call events over NATS", function () {
  this.timeout(20000);
  const URL = process.env.CONFORMANCE_NATS_URL;
  const sc = StringCodec();
  let client: NatsConnection;
  const cleanup: (() => unknown)[] = [];

  before(async function () {
    if (!URL) return this.skip();
    client = await connect({ servers: URL, name: "node-events-client" });
  });

  afterEach(async () => {
    for (const fn of cleanup.splice(0).reverse()) await fn();
  });

  after(async () => client?.close());

  /** One control-plane replica: its own connection, lost-call tracking and node-event consumer. */
  const replica = async (
    intake: Webhooks.WebhookEvent[],
    records?: Parameters<typeof subscribeNodeCallEvents>[1]["records"]
  ) => {
    const nc = await connect({ servers: URL });
    const lost = createLostCalls({ emit: (e) => intake.push(e), graceMs: 100 });
    const stop = subscribeNodeCallEvents(nc, {
      lost,
      intake: (e) => intake.push(e),
      records,
      workspaceOfApp: async () => "ws-1"
    });
    await nc.flush();
    cleanup.push(async () => {
      stop();
      lost.stop();
      await nc.close();
    });
    return { nc, lost };
  };

  const until = async (check: () => boolean, ms = 5000) => {
    const deadline = Date.now() + ms;
    while (!check()) {
      if (Date.now() > deadline) throw new Error("timed out");
      await new Promise((r) => setTimeout(r, 20));
    }
  };

  it("appbridge-lost exactly once across two replicas", async function () {
    const intake: Webhooks.WebhookEvent[] = [];
    const replicas = [await replica(intake), await replica(intake)];
    const node = new FakeRoomr({ nc: client, callee: "answer" });
    await node.start();
    cleanup.push(() => node.stop());
    const roomr = Roomr.createRoomrPool();
    cleanup.push(() => roomr.close());

    const callRefs = [randomUUID(), randomUUID()];
    for (const callRef of callRefs) {
      await roomr.createCall(node.controlAddr, {
        callRef,
        to: { uri: "sip:+1@routr" },
        metadata: { app_ref: "app-1", from: "+1", to: "+2" }
      });
      // AppBridge's calls.<callRef> entry, as every replica sees it on the registry watch.
      for (const r of replicas)
        r.lost.onEntry({
          kind: "calls",
          id: Sessions.sessionKey("calls", callRef).slice("calls.".length),
          value: {
            callRef,
            bridgeRef: "gw-a",
            direction: "outbound",
            appRef: "app-1",
            from: "+1",
            to: "+2",
            startedAt: new Date().toISOString()
          },
          writtenAt: new Date()
        });
    }
    // The first call's AppBridge dies: the node ends it with app_gone. The second call's
    // AppBridge ends it itself (sends its own call.ended, deletes its entry), then the stream
    // break still reaches the node as app_gone.
    node.endCall(callRefs[0], "app_gone");
    for (const r of replicas)
      r.lost.onEntry({
        kind: "calls",
        id: callRefs[1],
        writtenAt: new Date()
      });
    node.endCall(callRefs[1], "app_gone");
    await until(() => intake.length >= 1);
    await new Promise((r) => setTimeout(r, 500));
    expect(intake).to.have.length(1);
    expect(intake[0].data).to.include({
      callRef: callRefs[0],
      endReason: "appbridge-lost"
    });
  });

  it("unanswered outbound: busy → call.failed and the minimal record through the region's record writer", async function () {
    const intake: Webhooks.WebhookEvent[] = [];
    const region = `rg-${randomUUID().slice(0, 8)}`;
    const requests: Record<string, unknown>[] = [];
    // The region's record writer (AppBridge) on callrecord.<region>.maintenance.
    const writer = client.subscribe(`callrecord.${region}.maintenance`, {
      callback: (_e, msg) => {
        requests.push(JSON.parse(sc.decode(msg.data)));
        msg.respond(sc.encode(JSON.stringify({ type: "ack" })));
      }
    });
    cleanup.push(() => writer.unsubscribe());
    await replica(intake, natsFailedCallRecords(client));
    await replica(intake, natsFailedCallRecords(client));
    const node = new FakeRoomr({ nc: client, callee: "busy", region });
    await node.start();
    cleanup.push(() => node.stop());
    await new Promise((r) => setTimeout(r, 600)); // a heartbeat names the node's region
    const roomr = Roomr.createRoomrPool();
    cleanup.push(() => roomr.close());

    const callRef = randomUUID();
    await roomr.createCall(node.controlAddr, {
      callRef,
      to: { uri: "sip:+15551234567@routr" },
      metadata: { app_ref: "app-1", from: "+15550001111", to: "+15551234567" }
    });
    await until(() => intake.length >= 1 && requests.length >= 1);
    await new Promise((r) => setTimeout(r, 300));
    expect(intake).to.have.length(1);
    expect(intake[0]).to.deep.include({ type: "call.failed" });
    expect(intake[0].data).to.include({ callRef, reason: "busy" });
    expect(requests).to.have.length(1);
    expect(requests[0]).to.deep.include({
      op: "failed_call",
      callRef,
      workspaceRef: "ws-1"
    });
    expect(
      (requests[0].entries as Record<string, unknown>[]).map((e) => e.type)
    ).to.deep.equal(["call.started", "call.progress", "call.failed"]);
    // No room was left behind and no INVITE was retried.
    expect(node.invites).to.equal(1);
  });
});
