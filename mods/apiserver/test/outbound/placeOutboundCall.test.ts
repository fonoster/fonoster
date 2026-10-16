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
import { Sessions } from "@fonoster/common";
import { expect } from "chai";
import { connect, NatsConnection, StringCodec } from "nats";
import {
  createNodeDirectory,
  OutboundCallRequest,
  placeOutboundCall,
  Requester,
  runOutboundCalls
} from "../../src/outbound";

const CALL: OutboundCallRequest = {
  ref: "call-1",
  from: "+15550001111",
  to: "+15550002222",
  appRef: "app-1",
  accessKeyId: "WO00000000000000000000000000000000",
  timeout: 30,
  metadata: { a: 1 }
};

type Sent = { subject: string; body: Record<string, unknown> };

/** A requester standing in for one media node and the gateways. */
function fakeRequester(
  replies: { gateway?: Record<string, unknown>; failOn?: string } = {}
) {
  const sent: Sent[] = [];
  const request: Requester = async (subject, body) => {
    sent.push({ subject, body });
    if (subject === "gateway.outbound")
      return replies.gateway ?? { type: "ack" };
    if (body.type === replies.failOn)
      return { type: "error", id: body.id, code: "sip_error" };
    if (body.type === "room.create")
      return { type: "ack", id: body.id, roomRef: "room-1" };
    return { type: "ack", id: body.id };
  };
  return { sent, request };
}

function liveNodes(...heartbeats: Record<string, unknown>[]) {
  const nodes = createNodeDirectory();
  for (const h of heartbeats) nodes.note({ type: "node.heartbeat", ...h });
  return nodes;
}

describe("@apiserver[outbound/createNodeDirectory]", function () {
  it("picks the least-loaded live node that is not draining", function () {
    let now = 0;
    const nodes = createNodeDirectory({ staleMs: 100, now: () => now });
    nodes.note({ type: "node.heartbeat", nodeId: "a", rooms: 3 });
    nodes.note({ type: "node.heartbeat", nodeId: "b", rooms: 1 });
    nodes.note({
      type: "node.heartbeat",
      nodeId: "c",
      rooms: 0,
      draining: true
    });
    expect(nodes.pick()).to.equal("b");

    nodes.placed("b");
    nodes.placed("b");
    nodes.placed("b");
    expect(nodes.pick()).to.equal("a");

    nodes.note({ type: "node.down", nodeId: "a" });
    expect(nodes.pick()).to.equal("b");

    now = 200;
    expect(nodes.pick()).to.equal(undefined);
  });

  it("takes registry entries at the time they were written", function () {
    let now = 1000;
    const nodes = createNodeDirectory({ staleMs: 100, now: () => now });
    // Written long ago (a crashed node whose lease has not run out): not offered.
    nodes.note({ type: "node.heartbeat", nodeId: "old", rooms: 0 }, 500);
    expect(nodes.pick()).to.equal(undefined);
    nodes.note({ type: "node.heartbeat", nodeId: "a", rooms: 2 });
    // An older entry read late never replaces a fresher heartbeat.
    nodes.note({ type: "node.heartbeat", nodeId: "a", rooms: 9 }, 950);
    expect(nodes.list().find((n) => n.nodeId === "a")?.rooms).to.equal(2);
    now = 1050;
    expect(nodes.pick()).to.equal("a");
  });
});

describe("@apiserver[outbound/placeOutboundCall]", function () {
  it("creates a room, hands it to a gateway, then dials through Routr", async function () {
    const { sent, request } = fakeRequester();
    const placed = await placeOutboundCall(
      request,
      liveNodes({ nodeId: "n1", rooms: 0 }),
      CALL
    );
    expect(placed).to.deep.equal({ nodeId: "n1", roomRef: "room-1" });
    expect(sent.map((s) => [s.subject, s.body.type])).to.deep.equal([
      ["media.n1.commands", "room.create"],
      ["gateway.outbound", undefined],
      ["media.n1.commands", "participant.dial"]
    ]);
    expect(sent[1].body).to.deep.equal({
      nodeId: "n1",
      roomRef: "room-1",
      appRef: "app-1",
      callRef: "call-1",
      from: CALL.from,
      to: CALL.to,
      metadata: { a: 1 }
    });
    expect(sent[2].body).to.deep.include({
      roomRef: "room-1",
      to: CALL.to,
      from: CALL.from
    });
    expect(sent[2].body.headers).to.deep.equal({
      "X-Call-Ref": "call-1",
      "X-Dod-Number": CALL.from,
      "X-Access-Key-Id": CALL.accessKeyId,
      "X-Is-Api-Originated-Type": "true"
    });
  });

  it("fails without a live media node", async function () {
    const { sent, request } = fakeRequester();
    await placeOutboundCall(request, createNodeDirectory(), CALL).then(
      () => expect.fail("placed"),
      (e) => expect(e.code).to.equal("no_media_node")
    );
    expect(sent).to.have.length(0);
  });

  it("ends the room when no gateway takes the call or the dial is refused", async function () {
    const refused = fakeRequester({
      gateway: { type: "error", code: "unknown_app" }
    });
    await placeOutboundCall(
      refused.request,
      liveNodes({ nodeId: "n1" }),
      CALL
    ).then(
      () => expect.fail("placed"),
      (e) => expect(e.code).to.equal("unknown_app")
    );
    expect(refused.sent.at(-1)?.body).to.deep.include({
      type: "room.end",
      roomRef: "room-1"
    });

    const failed = fakeRequester({ failOn: "participant.dial" });
    await placeOutboundCall(
      failed.request,
      liveNodes({ nodeId: "n1" }),
      CALL
    ).then(
      () => expect.fail("placed"),
      (e) => expect(e.code).to.equal("sip_error")
    );
    expect(failed.sent.at(-1)?.body.type).to.equal("room.end");
  });
});

describe("@apiserver[outbound/runOutboundCalls] over NATS", function () {
  const NATS_URL = process.env.CONFORMANCE_NATS_URL;
  const sc = StringCodec();
  let nc: NatsConnection;

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  it("places calls.create on the node its heartbeats offer", async function () {
    const nodeId = `n-${Date.now()}`;
    const seen: string[] = [];
    const node = nc.subscribe(`media.${nodeId}.commands`, {
      callback: (_e, msg) => {
        const cmd = JSON.parse(sc.decode(msg.data));
        seen.push(cmd.type);
        msg.respond(
          sc.encode(JSON.stringify({ type: "ack", id: cmd.id, roomRef: "r-1" }))
        );
      }
    });
    const gateway = nc.subscribe("gateway.outbound", {
      queue: "gateway-outbound",
      callback: (_e, msg) => {
        seen.push("gateway.outbound");
        msg.respond(sc.encode(JSON.stringify({ type: "ack" })));
      }
    });
    const stop = await runOutboundCalls({ nc });
    try {
      nc.publish(
        `media.${nodeId}.heartbeat`,
        sc.encode(JSON.stringify({ type: "node.heartbeat", nodeId, rooms: 0 }))
      );
      await nc.flush();
      await new Promise((r) => setTimeout(r, 50));
      nc.publish("calls.create", sc.encode(JSON.stringify(CALL)));
      const deadline = Date.now() + 3000;
      while (seen.length < 3 && Date.now() < deadline)
        await new Promise((r) => setTimeout(r, 20));
      expect(seen).to.deep.equal([
        "room.create",
        "gateway.outbound",
        "participant.dial"
      ]);
    } finally {
      await stop();
      node.unsubscribe();
      gateway.unsubscribe();
    }
  });
  it("publishes the call's status for TrackCall from the room's events", async function () {
    if (!NATS_URL) return this.skip();
    const nc = await connect({ servers: NATS_URL });
    const nodeId = `n-${Date.now()}`;
    const roomRef = `r-${Date.now()}`;
    const statuses: Record<string, unknown>[] = [];
    const track = nc.subscribe("calls.track", {
      callback: (_e, msg) => statuses.push(JSON.parse(sc.decode(msg.data)))
    });
    const node = nc.subscribe(`media.${nodeId}.commands`, {
      callback: (_e, msg) => {
        const cmd = JSON.parse(sc.decode(msg.data));
        msg.respond(
          sc.encode(JSON.stringify({ type: "ack", id: cmd.id, roomRef }))
        );
        if (cmd.type !== "participant.dial") return;
        const events = `media.${nodeId}.events.${roomRef}`;
        for (const ev of [
          { type: "call.progress", status: "ringing" },
          { type: "call.answered", participantRef: "p-1" },
          { type: "room.ended", reason: "callee_hangup" }
        ])
          nc.publish(events, sc.encode(JSON.stringify({ ...ev, roomRef })));
      }
    });
    const gateway = nc.subscribe("gateway.outbound", {
      queue: "gateway-outbound",
      callback: (_e, msg) =>
        msg.respond(sc.encode(JSON.stringify({ type: "ack" })))
    });
    const stop = await runOutboundCalls({ nc });
    try {
      nc.publish(
        `media.${nodeId}.heartbeat`,
        sc.encode(JSON.stringify({ type: "node.heartbeat", nodeId, rooms: 0 }))
      );
      await nc.flush();
      await new Promise((r) => setTimeout(r, 50));
      nc.publish(
        "calls.create",
        sc.encode(JSON.stringify({ ...CALL, ref: "call-track" }))
      );
      const deadline = Date.now() + 3000;
      while (statuses.length < 4 && Date.now() < deadline)
        await new Promise((r) => setTimeout(r, 20));
      expect(statuses).to.deep.equal([
        { ref: "call-track", status: "TRYING" },
        { ref: "call-track", status: "PROGRESS" },
        { ref: "call-track", status: "ANSWER" },
        { ref: "call-track", final: true }
      ]);
    } finally {
      await stop();
      track.unsubscribe();
      node.unsubscribe();
      gateway.unsubscribe();
      await nc.close();
    }
  });
});

describe("@apiserver[outbound/runOutboundCalls] with the session registry", function () {
  const URL =
    process.env.CONFORMANCE_JETSTREAM_URL ?? process.env.CONFORMANCE_NATS_URL;
  const sc = StringCodec();
  const bucket = `test_sessions_${Date.now()}`;
  let nc: NatsConnection;

  before(async function () {
    if (!URL) return this.skip();
    nc = await connect({ servers: URL });
    try {
      await (await nc.jetstreamManager()).getAccountInfo();
    } catch {
      await nc.close();
      return this.skip(); // no JetStream on this server
    }
  });

  after(async () => {
    if (!nc || nc.isClosed()) return;
    await (await nc.jetstreamManager()).streams
      .delete(`KV_${bucket}`)
      .catch(() => undefined);
    await nc.close();
  });

  it("places a call at once after a restart, from nodes in the registry (no heartbeat)", async function () {
    const kv = await Sessions.openSessions(nc, { bucket });
    const busy = `busy-${Date.now()}`;
    const idle = `idle-${Date.now()}`;
    const draining = `drain-${Date.now()}`;
    const leases = new Sessions.SessionLeases(kv);
    await leases.set("nodes", busy, { nodeId: busy, rooms: 40 });
    await leases.set("nodes", idle, { nodeId: idle, rooms: 12 });
    await leases.set("nodes", draining, {
      nodeId: draining,
      rooms: 3,
      draining: true
    });
    const seen: string[] = [];
    const subs = [busy, idle, draining].map((id) =>
      nc.subscribe(`media.${id}.commands`, {
        callback: (_e, msg) => {
          const cmd = JSON.parse(sc.decode(msg.data));
          seen.push(`${id}:${cmd.type}`);
          msg.respond(
            sc.encode(
              JSON.stringify({ type: "ack", id: cmd.id, roomRef: "r-1" })
            )
          );
        }
      })
    );
    subs.push(
      nc.subscribe("gateway.outbound", {
        queue: "gateway-outbound",
        callback: (_e, msg) =>
          msg.respond(sc.encode(JSON.stringify({ type: "ack" })))
      })
    );
    // A replica that just started: it has never seen a heartbeat.
    const stop = await runOutboundCalls({ nc, sessionsBucket: bucket });
    try {
      await new Promise((r) => setTimeout(r, 100));
      nc.publish("calls.create", sc.encode(JSON.stringify(CALL)));
      const deadline = Date.now() + 3000;
      while (seen.length < 2 && Date.now() < deadline)
        await new Promise((r) => setTimeout(r, 20));
      expect(seen).to.deep.equal([
        `${idle}:room.create`,
        `${idle}:participant.dial`
      ]);
      // A node that leaves deletes its entry: no longer offered.
      await leases.delete("nodes", idle);
      await new Promise((r) => setTimeout(r, 100));
      seen.length = 0;
      nc.publish(
        "calls.create",
        sc.encode(JSON.stringify({ ...CALL, ref: "call-2" }))
      );
      const deadline2 = Date.now() + 3000;
      while (seen.length < 2 && Date.now() < deadline2)
        await new Promise((r) => setTimeout(r, 20));
      expect(seen[0]).to.equal(`${busy}:room.create`);
    } finally {
      await stop();
      await leases.close();
      subs.forEach((s) => s.unsubscribe());
    }
  });

  it("keeps entries alive while their owner refreshes them, and they expire after", async function () {
    const short = `${bucket}_ttl`;
    const kv = await Sessions.openSessions(nc, { bucket: short, ttlMs: 1000 });
    try {
      const leases = new Sessions.SessionLeases(kv, { refreshMs: 300 });
      await leases.set("calls", "c-1", { callRef: "c-1", nodeId: "n" });
      await new Promise((r) => setTimeout(r, 1600));
      expect(await Sessions.getSession(kv, "calls", "c-1")).to.include({
        callRef: "c-1"
      });
      await leases.close(false); // a crash: nothing deleted, refresh stops
      await new Promise((r) => setTimeout(r, 1600));
      expect(await Sessions.getSession(kv, "calls", "c-1")).to.equal(undefined);
    } finally {
      await (await nc.jetstreamManager()).streams
        .delete(`KV_${short}`)
        .catch(() => undefined);
    }
  });
});
