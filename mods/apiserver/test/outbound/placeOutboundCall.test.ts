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
  MAX_PLACEMENT_ATTEMPTS,
  NO_CAPACITY,
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

/**
 * A requester standing in for the media nodes and the gateways. `roomCreate` answers room.create
 * per node: an error code, or "timeout" (no reply).
 */
function fakeRequester(
  replies: {
    gateway?: Record<string, unknown>;
    failOn?: string;
    roomCreate?: Record<string, string>;
  } = {}
) {
  const sent: Sent[] = [];
  const request: Requester = async (subject, body) => {
    sent.push({ subject, body });
    if (subject === "gateway.outbound")
      return replies.gateway ?? { type: "ack" };
    const nodeId = subject.split(".")[1];
    const refusal = replies.roomCreate?.[nodeId];
    if (body.type === "room.create" && refusal === "timeout")
      throw new Error("TIMEOUT");
    if (body.type === "room.create" && refusal)
      return { type: "error", id: body.id, code: refusal };
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

  it("skips nodes at their room limit and the ones already tried", function () {
    const nodes = createNodeDirectory();
    nodes.note({ type: "node.heartbeat", nodeId: "a", rooms: 5, maxRooms: 5 });
    nodes.note({ type: "node.heartbeat", nodeId: "b", rooms: 8, maxRooms: 20 });
    nodes.note({ type: "node.heartbeat", nodeId: "c", rooms: 9 }); // no limit reported
    expect(nodes.pick()).to.equal("b");
    expect(nodes.pick(new Set(["b"]))).to.equal("c");
    expect(nodes.pick(new Set(["b", "c"]))).to.equal(undefined);

    // b refuses a room (full since its heartbeat): skipped until it reports room again.
    nodes.refused("b", "at_capacity");
    expect(nodes.pick()).to.equal("c");
    nodes.note({ type: "node.heartbeat", nodeId: "b", rooms: 7, maxRooms: 20 });
    expect(nodes.pick()).to.equal("b");
    nodes.refused("b", "draining");
    expect(nodes.list().find((n) => n.nodeId === "b")?.draining).to.equal(true);
    expect(nodes.pick()).to.equal("c");
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
    // The room carries the call, so the node publishes its events on calls.<ref>.events.
    expect(sent[0].body).to.include({ type: "room.create", callRef: "call-1" });
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

  it("fails with no_capacity without a live media node", async function () {
    const { sent, request } = fakeRequester();
    await placeOutboundCall(request, createNodeDirectory(), CALL).then(
      () => expect.fail("placed"),
      (e) => expect(e.code).to.equal(NO_CAPACITY)
    );
    expect(sent).to.have.length(0);
  });

  it("tries the next node when one is full, draining or silent, up to three nodes", async function () {
    const nodes = () =>
      liveNodes(
        { nodeId: "n1", rooms: 0 },
        { nodeId: "n2", rooms: 1 },
        { nodeId: "n3", rooms: 2 },
        { nodeId: "n4", rooms: 3 }
      );
    const roomCreates = (sent: Sent[]) =>
      sent.filter((s) => s.body.type === "room.create").map((s) => s.subject);

    const placed = fakeRequester({
      roomCreate: { n1: "at_capacity", n2: "timeout" }
    });
    expect(
      await placeOutboundCall(placed.request, nodes(), CALL)
    ).to.deep.equal({ nodeId: "n3", roomRef: "room-1" });
    expect(roomCreates(placed.sent)).to.deep.equal([
      "media.n1.commands",
      "media.n2.commands",
      "media.n3.commands"
    ]);

    const refused = fakeRequester({
      roomCreate: { n1: "at_capacity", n2: "draining", n3: "at_capacity" }
    });
    await placeOutboundCall(refused.request, nodes(), CALL).then(
      () => expect.fail("placed"),
      (e) => expect(e.code).to.equal(NO_CAPACITY)
    );
    expect(roomCreates(refused.sent)).to.have.length(MAX_PLACEMENT_ATTEMPTS);
    expect(
      refused.sent.some((s) => s.body.type === "participant.dial")
    ).to.equal(false);
  });

  it("does not retry a room.create refused for another reason", async function () {
    const { sent, request } = fakeRequester({
      roomCreate: { n1: "bad_message" }
    });
    await placeOutboundCall(
      request,
      liveNodes({ nodeId: "n1", rooms: 0 }, { nodeId: "n2", rooms: 1 }),
      CALL
    ).then(
      () => expect.fail("placed"),
      (e) => expect(e.code).to.equal("bad_message")
    );
    expect(sent).to.have.length(1);
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
  it("answers CreateCall once the room exists and publishes TRYING on the call's subject", async function () {
    const nodeId = `n-${Date.now()}`;
    const ref = `call-ack-${Date.now()}`;
    const statuses: Record<string, unknown>[] = [];
    const track = nc.subscribe(`calls.${ref}.events`, {
      callback: (_e, msg) => statuses.push(JSON.parse(sc.decode(msg.data)))
    });
    const created: Record<string, unknown>[] = [];
    const node = nc.subscribe(`media.${nodeId}.commands`, {
      callback: (_e, msg) => {
        const cmd = JSON.parse(sc.decode(msg.data));
        if (cmd.type === "room.create") created.push(cmd);
        msg.respond(
          sc.encode(JSON.stringify({ type: "ack", id: cmd.id, roomRef: "r-1" }))
        );
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
        sc.encode(
          JSON.stringify({
            type: "node.heartbeat",
            nodeId,
            rooms: 0,
            maxRooms: 5
          })
        )
      );
      await nc.flush();
      const reply = await nc.request(
        "calls.create",
        sc.encode(JSON.stringify({ ...CALL, ref })),
        { timeout: 5000 }
      );
      expect(JSON.parse(sc.decode(reply.data))).to.deep.equal({
        type: "ack",
        ref,
        nodeId
      });
      expect(created[0]).to.include({ callRef: ref });
      await nc.flush();
      // TRYING, then the room's node (TrackCall follows its heartbeats).
      expect(statuses).to.deep.equal([
        { ref, status: "TRYING" },
        { ref, nodeId }
      ]);
    } finally {
      await stop();
      track.unsubscribe();
      node.unsubscribe();
      gateway.unsubscribe();
    }
  });

  it("answers CreateCall with no_capacity when no node takes the call", async function () {
    const ref = `call-none-${Date.now()}`;
    const statuses: Record<string, unknown>[] = [];
    const track = nc.subscribe(`calls.${ref}.events`, {
      callback: (_e, msg) => statuses.push(JSON.parse(sc.decode(msg.data)))
    });
    // An empty registry bucket: no node from elsewhere on this server is offered.
    const bucket = `test_none_${Date.now()}`;
    const stop = await runOutboundCalls({ nc, sessionsBucket: bucket });
    try {
      const reply = await nc.request(
        "calls.create",
        sc.encode(JSON.stringify({ ...CALL, ref })),
        { timeout: 5000 }
      );
      expect(JSON.parse(sc.decode(reply.data))).to.include({
        type: "error",
        ref,
        code: NO_CAPACITY
      });
      await nc.flush();
      expect(statuses).to.deep.equal([
        { ref, status: "TRYING" },
        { ref, status: "FAILED" }
      ]);
    } finally {
      await stop();
      track.unsubscribe();
      const jsm = await nc.jetstreamManager().catch(() => undefined);
      await jsm?.streams.delete(`KV_${bucket}`).catch(() => undefined);
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
