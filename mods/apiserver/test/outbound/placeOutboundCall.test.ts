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
