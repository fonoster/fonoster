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
import { NatsConnection, StringCodec, connect } from "nats";
import { FakeNatsRoomr, INCOMING_SUBJECT } from "../src";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Needs a NATS server; set CONFORMANCE_NATS_URL (e.g. nats://127.0.0.1:4222) to run.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;

describe("@conformance/FakeNatsRoomr over NATS", function () {
  let nc: NatsConnection;
  let node: FakeNatsRoomr;

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  afterEach(async function () {
    await node?.stop();
  });

  after(async function () {
    await nc?.close();
  });

  it("answers media-control requests and publishes events", async function () {
    node = new FakeNatsRoomr({ nodeId: `test-${Date.now()}` });
    const subjects = node.attachNats(nc);
    const sc = StringCodec();
    const events: Record<string, unknown>[] = [];
    nc.subscribe(`${subjects.events}.>`, {
      callback: (_e, m) => events.push(JSON.parse(sc.decode(m.data)))
    });
    await nc.flush();

    // An AppBridge replica claims call.incoming (media-control, request and reply).
    const incoming: Record<string, unknown>[] = [];
    const claimer = nc.subscribe(INCOMING_SUBJECT, {
      callback: (_e, m) => {
        const event = JSON.parse(sc.decode(m.data));
        incoming.push(event);
        m.respond(sc.encode(JSON.stringify({ type: "claimed", id: event.id })));
      }
    });
    await nc.flush();

    const { roomRef, claimed } = node.offerCall({ appRef: "app-1" });
    expect(await claimed).to.equal(true);
    claimer.unsubscribe();
    expect(incoming[0]).to.include({
      type: "call.incoming",
      roomRef,
      appRef: "app-1",
      nodeId: node.nodeId
    });
    const reply = await nc.request(
      subjects.commands,
      sc.encode(JSON.stringify({ type: "hold", id: "c7", roomRef }))
    );
    expect(JSON.parse(sc.decode(reply.data))).to.deep.equal({
      type: "ack",
      id: "c7"
    });
    await nc.flush();
    expect(events.find((e) => e.type === "call.incoming")).to.equal(undefined);

    // Events are scoped to the room's subject.
    const scoped = nc.subscribe(`${subjects.events}.${roomRef}`, { max: 1 });
    await nc.flush();
    node.pressKey("5", roomRef);
    for await (const m of scoped) {
      expect(JSON.parse(sc.decode(m.data))).to.include({
        type: "dtmf",
        digit: "5"
      });
    }
  });

  it("refuses a call no AppBridge claims with 503", async function () {
    node = new FakeNatsRoomr({
      nodeId: `unclaimed-${Date.now()}`,
      claimTimeoutMs: 50
    });
    node.attachNats(nc);
    const { roomRef, claimed } = node.offerCall();
    expect(await claimed).to.equal(false);
    expect(node.sipStatuses(roomRef)).to.deep.equal([503]);
    expect(node.events.map((e) => e.event)).to.deep.include({
      type: "room.ended",
      roomRef,
      reason: "node_error",
      sipStatus: 503
    });
  });

  it("publishes heartbeats and node.down", async function () {
    node = new FakeNatsRoomr({ nodeId: `beat-${Date.now()}`, heartbeatMs: 30 });
    const sc = StringCodec();
    const seen: Record<string, unknown>[] = [];
    const sub = nc.subscribe(`roomr.nodes.${node.nodeId}.heartbeat`, {
      callback: (_e, m) => seen.push(JSON.parse(sc.decode(m.data)))
    });
    await nc.flush();
    node.attachNats(nc);
    await sleep(100);
    node.shutdown();
    await nc.flush();
    await sleep(20);
    sub.unsubscribe();
    expect(seen.filter((e) => e.type === "node.heartbeat").length).to.be.gte(2);
    expect(seen[seen.length - 1]).to.deep.equal({
      type: "node.down",
      node_ref: node.nodeId
    });
  });
});
