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
import { Roomr, Sessions } from "@fonoster/common";
import { FakeRoomr } from "@fonoster/conformance";
import { status } from "@grpc/grpc-js";
import { expect } from "chai";
import { connect, NatsConnection, StringCodec } from "nats";
import {
  calleeUri,
  createNodeDirectory,
  createPlacementSweep,
  MAX_PLACEMENT_ATTEMPTS,
  NO_CAPACITY,
  NODE_STALE_MS,
  OutboundCallRequest,
  placeOutboundCall,
  Requester,
  runOutboundCalls,
  SAME_NODE_ATTEMPTS
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

const OUTBOUND = {
  proxy: "routr:5060",
  auth: { username: "roomr", password: "s3cret" }
};

type Sent = { subject: string; body: Record<string, unknown> };

/** gateway.outbound stand-in: acks (or answers `reply`), recording what it got. */
function fakeGateway(reply: Record<string, unknown> = { type: "ack" }) {
  const sent: Sent[] = [];
  const request: Requester = async (subject, body) => {
    sent.push({ subject, body });
    return reply;
  };
  return { sent, request };
}

type Step = number | "timeout";

/**
 * Roomr calls in memory, per node address: each RPC answers its scripted steps in order
 * (a status code, or "timeout"), then succeeds. Records every call as "<addr> <Method>".
 */
function fakeRoomr(
  script: Record<string, Partial<Record<string, Step[]>>> = {}
) {
  const log: string[] = [];
  const requests: { addr: string; method: string; request: unknown }[] = [];
  const run = async <T>(
    addr: string,
    method: string,
    request: unknown,
    ok: () => T
  ) => {
    log.push(`${addr} ${method}`);
    requests.push({ addr, method, request });
    const step = script[addr]?.[method]?.shift();
    if (step === "timeout")
      throw new Roomr.RoomrError(status.DEADLINE_EXCEEDED, "deadline");
    if (step !== undefined) throw new Roomr.RoomrError(step, "scripted");
    return ok();
  };
  const roomr: Roomr.RoomrCalls = {
    createRoom: (addr, r) =>
      run(addr, "CreateRoom", r, () => ({ roomRef: r.roomRef ?? "room-x" })),
    createCall: (addr, r) =>
      run(addr, "CreateCall", r, () => ({
        callRef: r.callRef ?? "",
        roomRef: r.roomRef ?? "",
        state: "RINGING" as const,
        participantRef: ""
      })),
    endCall: (addr, r) => run(addr, "EndCall", r, () => undefined),
    endRoom: (addr, r) => run(addr, "EndRoom", r, () => undefined)
  };
  return { roomr, log, requests };
}

/** A directory with nodes "n1".."nN" at "a1".."aN", n1 the least loaded. */
function nodesUpTo(count: number) {
  const nodes = createNodeDirectory();
  for (let i = 1; i <= count; i++)
    nodes.note({
      type: "node.heartbeat",
      node_ref: `n${i}`,
      rooms: i - 1,
      control_addr: `a${i}`
    });
  return nodes;
}

describe("@apiserver[outbound/createNodeDirectory]", function () {
  it("picks the least-loaded live node that is not down", function () {
    let now = 0;
    const nodes = createNodeDirectory({ staleMs: 100, now: () => now });
    nodes.note({
      type: "node.heartbeat",
      control_addr: "127.0.0.1:1",
      node_ref: "a",
      rooms: 3
    });
    nodes.note({
      type: "node.heartbeat",
      control_addr: "127.0.0.1:1",
      node_ref: "b",
      rooms: 1
    });
    nodes.note({
      type: "node.heartbeat",
      control_addr: "127.0.0.1:1",
      node_ref: "c",
      rooms: 0
    });
    nodes.note({ type: "node.down", node_ref: "c" });
    expect(nodes.pick()).to.equal("b");

    nodes.placed("b");
    nodes.placed("b");
    nodes.placed("b");
    expect(nodes.pick()).to.equal("a");

    nodes.note({ type: "node.down", node_ref: "a" });
    expect(nodes.pick()).to.equal("b");

    now = 200;
    expect(nodes.pick()).to.equal(undefined);
  });

  it("skips nodes at their room limit and the ones already tried", function () {
    const nodes = createNodeDirectory();
    nodes.note({
      type: "node.heartbeat",
      control_addr: "127.0.0.1:1",
      node_ref: "a",
      rooms: 5,
      max_rooms: 5
    });
    nodes.note({
      type: "node.heartbeat",
      control_addr: "127.0.0.1:1",
      node_ref: "b",
      rooms: 8,
      max_rooms: 20
    });
    nodes.note({
      type: "node.heartbeat",
      control_addr: "127.0.0.1:1",
      node_ref: "c",
      rooms: 9,
      max_rooms: 10
    });
    expect(nodes.pick()).to.equal("b");
    expect(nodes.pick(new Set(["b"]))).to.equal("c");
    expect(nodes.pick(new Set(["b", "c"]))).to.equal(undefined);

    // b refuses a room (full since its heartbeat): skipped until it reports room again.
    nodes.refused("b", "at_capacity");
    expect(nodes.pick()).to.equal("c");
    nodes.note({
      type: "node.heartbeat",
      control_addr: "127.0.0.1:1",
      node_ref: "b",
      rooms: 7,
      max_rooms: 20
    });
    expect(nodes.pick()).to.equal("b");
    nodes.refused("b", "unavailable");
    expect(nodes.list().find((n) => n.nodeId === "b")?.down).to.equal(true);
    expect(nodes.pick()).to.equal("c");
  });

  it("scores nodes 1 - rooms / max_rooms and keeps to the call's region", function () {
    const nodes = createNodeDirectory();
    const beat = (node_ref: string, rooms: number, extra = {}) =>
      nodes.note({
        type: "node.heartbeat",
        control_addr: "127.0.0.1:1",
        node_ref,
        rooms,
        max_rooms: 200,
        ...extra
      });
    // control-plane "Least-loaded node chosen": A 40 of 200, B 12 of 200, C down with 3.
    beat("A", 40, { region: "us-east" });
    beat("B", 12, { region: "eu-west" });
    beat("C", 3, { region: "us-east" });
    nodes.note({ type: "node.down", node_ref: "C" });
    expect(nodes.pick()).to.equal("B");
    // A higher limit wins over fewer rooms: 30 of 1000 scores above 12 of 200.
    beat("D", 30, { max_rooms: 1000, region: "us-east" });
    expect(nodes.pick()).to.equal("D");
    // In the call's region only.
    expect(nodes.pick(new Set(["D"]), "us-east")).to.equal("A");
    expect(nodes.pick(new Set(), "eu-west")).to.equal("B");
    expect(nodes.pick(new Set(), "ap-south")).to.equal(undefined);
  });

  it("node.down only takes the node out of placement; it is gone after staleMs of silence", function () {
    let now = 0;
    const nodes = createNodeDirectory({ staleMs: 6000, now: () => now });
    nodes.note({
      type: "node.heartbeat",
      node_ref: "a",
      rooms: 2,
      control_addr: "a1"
    });
    now = 1000;
    nodes.note({ type: "node.down", node_ref: "a" });
    expect(nodes.pick()).to.equal(undefined);
    expect(nodes.live("a")).to.equal(true); // draining, not gone
    now = 1000 + 5000;
    expect(nodes.live("a")).to.equal(true);
    now = 1000 + 7000; // silent since node.down: the process exited
    expect(nodes.live("a")).to.equal(false);
    // A node that comes back (a restart) is offered again.
    nodes.note({
      type: "node.heartbeat",
      node_ref: "a",
      rooms: 0,
      control_addr: "a1"
    });
    expect(nodes.pick()).to.equal("a");
  });

  it("offers only nodes with a control address", function () {
    const nodes = createNodeDirectory();
    nodes.note({ type: "node.heartbeat", node_ref: "old", rooms: 0 });
    nodes.note({
      type: "node.heartbeat",
      node_ref: "new",
      rooms: 9,
      control_addr: "10.0.0.7:50061"
    });
    expect(nodes.pick()).to.equal("new");
    expect(nodes.addressOf("new")).to.equal("10.0.0.7:50061");
    expect(nodes.addressOf("old")).to.equal(undefined);
  });

  it("takes registry entries at the time they were written", function () {
    let now = 1000;
    const nodes = createNodeDirectory({ staleMs: 100, now: () => now });
    // Written long ago (a crashed node whose lease has not run out): not offered.
    nodes.note(
      {
        type: "node.heartbeat",
        control_addr: "127.0.0.1:1",
        node_ref: "old",
        rooms: 0
      },
      500
    );
    expect(nodes.pick()).to.equal(undefined);
    nodes.note({
      type: "node.heartbeat",
      control_addr: "127.0.0.1:1",
      node_ref: "a",
      rooms: 2
    });
    // An older entry read late never replaces a fresher heartbeat.
    nodes.note(
      {
        type: "node.heartbeat",
        control_addr: "127.0.0.1:1",
        node_ref: "a",
        rooms: 9
      },
      950
    );
    expect(nodes.list().find((n) => n.nodeId === "a")?.rooms).to.equal(2);
    now = 1050;
    expect(nodes.pick()).to.equal("a");
  });

  it("stays bounded when nodes are replaced 50 times without node.down, and never picks a dead one", function () {
    // A crashed or replaced node's KV lease expires without a delete event, so only its silence
    // tells it apart (in-memory state audit, test 19).
    let now = 0;
    const nodes = createNodeDirectory({ now: () => now });
    nodes.note({
      type: "node.heartbeat",
      control_addr: "127.0.0.1:1",
      node_ref: "steady",
      rooms: 40
    });
    for (let i = 0; i < 50; i++) {
      const id = `node-${i}`;
      // Each node lives 20 s (heartbeats every 2 s), then a new id takes its place.
      for (let t = 0; t < 20_000; t += 2000) {
        now += 2000;
        nodes.note({
          type: "node.heartbeat",
          control_addr: "127.0.0.1:1",
          node_ref: id,
          rooms: 0
        });
        nodes.note({
          type: "node.heartbeat",
          control_addr: "127.0.0.1:1",
          node_ref: "steady",
          rooms: 40
        });
      }
      // The dead ones are idle (rooms 0) and would win on load: they must never be picked.
      now += NODE_STALE_MS + 1;
      nodes.note({
        type: "node.heartbeat",
        control_addr: "127.0.0.1:1",
        node_ref: "steady",
        rooms: 40
      });
      expect(nodes.pick()).to.equal("steady");
    }
    expect(nodes.list().length).to.be.at.most(5);
    expect(nodes.list().map((n) => n.nodeId)).to.include("steady");
  });
});

describe("@apiserver[outbound/placeOutboundCall]", function () {
  const place = (
    roomr: Roomr.RoomrCalls,
    nodes: ReturnType<typeof createNodeDirectory>,
    gateway = fakeGateway()
  ) =>
    placeOutboundCall(
      { roomr, request: gateway.request, nodes, outbound: OUTBOUND },
      CALL
    );

  it("creates the room, hands it to a gateway, then calls CreateCall through Routr", async function () {
    const { roomr, log, requests } = fakeRoomr();
    const gateway = fakeGateway();
    const placed = await place(roomr, nodesUpTo(1), gateway);
    expect(placed).to.deep.equal({
      nodeId: "n1",
      roomRef: "call-1",
      callRef: "call-1"
    });
    expect(log).to.deep.equal(["a1 CreateRoom", "a1 CreateCall"]);
    expect(requests[0].request).to.deep.equal({ roomRef: "call-1" });
    expect(gateway.sent).to.deep.equal([
      {
        subject: "gateway.outbound",
        body: {
          nodeId: "n1",
          roomRef: "call-1",
          appRef: "app-1",
          callRef: "call-1",
          from: CALL.from,
          to: CALL.to,
          metadata: { a: 1 }
        }
      }
    ]);
    // X-DOD-Number and the other headers Routr routes on travel in to.headers; From is the
    // node's own identity; the proxy's challenge is answered with to.auth.
    expect(requests[1].request).to.deep.equal({
      callRef: "call-1",
      roomRef: "call-1",
      to: {
        uri: "sip:+15550002222@routr",
        proxy: "routr:5060",
        headers: {
          "X-DOD-Number": CALL.from,
          "X-Call-Ref": "call-1",
          "X-Access-Key-Id": CALL.accessKeyId,
          "X-Is-Api-Originated-Type": "true"
        },
        auth: OUTBOUND.auth
      },
      ringTimeoutS: 30,
      metadata: { app_ref: "app-1" }
    });
  });

  it("dials a SIP URI as given", function () {
    expect(calleeUri("sip:bob@example.com", "routr:5060")).to.equal(
      "sip:bob@example.com"
    );
    expect(calleeUri("+1555", "10.0.0.2:5060")).to.equal("sip:+1555@10.0.0.2");
  });

  it("fails with no_capacity without a live Roomr node, sending nothing", async function () {
    const { roomr, log } = fakeRoomr();
    const gateway = fakeGateway();
    await place(roomr, createNodeDirectory(), gateway).then(
      () => expect.fail("placed"),
      (e) => expect(e.code).to.equal(NO_CAPACITY)
    );
    expect(log).to.have.length(0);
    expect(gateway.sent).to.have.length(0);
  });

  it("fails over only on RESOURCE_EXHAUSTED or UNAVAILABLE, up to three nodes", async function () {
    const ok = fakeRoomr({
      a1: { CreateRoom: [status.RESOURCE_EXHAUSTED] },
      a2: { CreateRoom: [status.UNAVAILABLE] }
    });
    expect((await place(ok.roomr, nodesUpTo(4))).nodeId).to.equal("n3");
    expect(ok.log).to.deep.equal([
      "a1 CreateRoom",
      "a2 CreateRoom",
      "a3 CreateRoom",
      "a3 CreateCall"
    ]);

    const none = fakeRoomr({
      a1: { CreateRoom: [status.RESOURCE_EXHAUSTED] },
      a2: { CreateRoom: [status.UNAVAILABLE] },
      a3: { CreateRoom: [status.RESOURCE_EXHAUSTED] }
    });
    const gateway = fakeGateway();
    await place(none.roomr, nodesUpTo(4), gateway).then(
      () => expect.fail("placed"),
      (e) => expect(e.code).to.equal(NO_CAPACITY)
    );
    expect(none.log).to.have.length(MAX_PLACEMENT_ATTEMPTS);
    expect(gateway.sent).to.have.length(0);
  });

  it("retries the same node on a timeout and never moves on after one", async function () {
    const retried = fakeRoomr({
      a1: { CreateRoom: ["timeout"], CreateCall: ["timeout"] }
    });
    expect((await place(retried.roomr, nodesUpTo(2))).nodeId).to.equal("n1");
    expect(retried.log).to.deep.equal([
      "a1 CreateRoom",
      "a1 CreateRoom",
      "a1 CreateCall",
      "a1 CreateCall"
    ]);

    // Still no answer after SAME_NODE_ATTEMPTS: the call fails; no other node is asked (the
    // INVITE may be out).
    const stuck = fakeRoomr({
      a1: { CreateCall: Array(SAME_NODE_ATTEMPTS).fill("timeout") }
    });
    await place(stuck.roomr, nodesUpTo(2)).then(
      () => expect.fail("placed"),
      (e) => expect(e.code).to.equal("unavailable")
    );
    expect(stuck.log.filter((l) => l.startsWith("a2"))).to.deep.equal([]);
    // The call and room are ended in case the node did get them.
    expect(stuck.log.slice(-2)).to.deep.equal(["a1 EndCall", "a1 EndRoom"]);
  });

  it("takes ALREADY_EXISTS on a retried CreateRoom as its own room", async function () {
    const { roomr, log } = fakeRoomr({
      a1: { CreateRoom: ["timeout", status.ALREADY_EXISTS] }
    });
    expect((await place(roomr, nodesUpTo(1))).roomRef).to.equal("call-1");
    expect(log).to.deep.equal([
      "a1 CreateRoom",
      "a1 CreateRoom",
      "a1 CreateCall"
    ]);
  });

  it("maps CreateCall's refusals to placement codes and ends the room", async function () {
    for (const [code, want] of [
      [status.INVALID_ARGUMENT, "invalid_argument"],
      [status.ALREADY_EXISTS, "already_exists"],
      [status.RESOURCE_EXHAUSTED, NO_CAPACITY],
      [status.INTERNAL, "unavailable"]
    ] as const) {
      const { roomr, log } = fakeRoomr({ a1: { CreateCall: [code] } });
      await place(roomr, nodesUpTo(2)).then(
        () => expect.fail("placed"),
        (e) => expect(e.code).to.equal(want)
      );
      expect(log.at(-1)).to.equal("a1 EndRoom");
      // The gateway already watches this room: no other node is tried.
      expect(log.some((l) => l.startsWith("a2"))).to.equal(false);
    }
  });

  it("ends the room when no gateway takes the call", async function () {
    const { roomr, log } = fakeRoomr();
    await place(
      roomr,
      nodesUpTo(1),
      fakeGateway({ type: "error", code: "unknown_app" })
    ).then(
      () => expect.fail("placed"),
      (e) => expect(e.code).to.equal("unknown_app")
    );
    expect(log).to.deep.equal(["a1 CreateRoom", "a1 EndRoom"]);
  });
});

describe("@apiserver[outbound/runOutboundCalls] over NATS and gRPC", function () {
  const NATS_URL = process.env.CONFORMANCE_NATS_URL;
  const sc = StringCodec();
  let nc: NatsConnection;
  const fakes: FakeRoomr[] = [];

  before(async function () {
    if (!NATS_URL) return this.skip();
    nc = await connect({ servers: NATS_URL });
  });

  afterEach(async () => {
    for (const f of fakes.splice(0)) await f.stop();
  });

  after(async () => nc?.close());

  const node = async (options: ConstructorParameters<typeof FakeRoomr>[0]) => {
    const f = new FakeRoomr({ nc, ...options });
    fakes.push(f);
    await f.start();
    return f;
  };

  const gatewayAcks = () =>
    nc.subscribe("gateway.outbound", {
      queue: "gateway-outbound",
      callback: (_e, msg) =>
        msg.respond(sc.encode(JSON.stringify({ type: "ack" })))
    });

  it("answers CreateCall once the node accepted it, after TRYING and the node on the call's subject", async function () {
    const bucket = `test_grpc_${Date.now()}`;
    const f = await node({});
    const gateway = gatewayAcks();
    const ref = `call-ack-${Date.now()}`;
    const statuses: Record<string, unknown>[] = [];
    const track = nc.subscribe(`calls.${ref}.events`, {
      callback: (_e, msg) => statuses.push(JSON.parse(sc.decode(msg.data)))
    });
    const stop = await runOutboundCalls({
      nc,
      sessionsBucket: bucket,
      outbound: OUTBOUND
    });
    try {
      await new Promise((r) => setTimeout(r, 600)); // a heartbeat
      const reply = await nc.request(
        "calls.create",
        sc.encode(JSON.stringify({ ...CALL, ref })),
        { timeout: 5000 }
      );
      expect(JSON.parse(sc.decode(reply.data))).to.deep.equal({
        type: "ack",
        ref,
        nodeId: f.nodeRef
      });
      expect(f.of("CreateCall")).to.have.length(1);
      expect(f.of("CreateCall")[0]).to.deep.include({ callRef: ref });
      await nc.flush();
      expect(statuses.slice(0, 2)).to.deep.equal([
        { ref, status: "TRYING" },
        { ref, node_ref: f.nodeRef }
      ]);
    } finally {
      await stop();
      track.unsubscribe();
      gateway.unsubscribe();
      const jsm = await nc.jetstreamManager().catch(() => undefined);
      await jsm?.streams.delete(`KV_${bucket}`).catch(() => undefined);
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

  it("writes the placement before the RPC and deletes it after; the sweep ends a call whose placer died", async function () {
    const kv = await Sessions.openSessions(nc, { bucket });
    const f = new FakeRoomr({ callee: "ring" });
    await f.start();
    const seen: string[] = [];
    const stopWatch = await Sessions.watchSessions(kv, "placements", (e) =>
      seen.push(`${e.id}:${e.value ? "put" : "delete"}`)
    );
    const roomr = Roomr.createRoomrPool();
    // The placer: writes, places, deletes.
    const placer = await createPlacementSweep({ kv, roomr });
    const nodes = createNodeDirectory();
    nodes.note({
      type: "node.heartbeat",
      node_ref: f.nodeRef,
      rooms: 0,
      control_addr: f.controlAddr
    });
    const ref = `placed-${Date.now()}`;
    let sweeper: Awaited<ReturnType<typeof createPlacementSweep>> | undefined;
    try {
      await placeOutboundCall(
        { roomr, request: fakeGateway().request, nodes, outbound: OUTBOUND },
        { ...CALL, ref },
        {
          onAttempt: async (nodeId, addr) => {
            await placer.placing(ref, nodeId, addr);
            // Written before the node heard anything.
            expect(f.requests).to.have.length(0);
          },
          onRoom: (nodeId, roomRef) =>
            placer.placing(ref, nodeId, f.controlAddr, roomRef)
        }
      );
      await placer.placed(ref);
      await new Promise((r) => setTimeout(r, 200));
      expect(seen.filter((s) => s.startsWith(ref))).to.deep.equal([
        `${ref}:put`,
        `${ref}:put`,
        `${ref}:delete`
      ]);

      // A placer that died after CreateCall: its entry stays; another replica's sweep ends it.
      let now = Date.now();
      const failed: string[] = [];
      const down = new Set<string>(["gone-node"]);
      sweeper = await createPlacementSweep({
        kv,
        roomr,
        nodeUp: (ref) => !down.has(ref),
        failed: (ref) => failed.push(ref),
        staleMs: 1000,
        now: () => now
      });
      // Killed after CreateCall reached the node: the call is ended (the API caller got no
      // answer), not reported FAILED by the sweep (the node's call.ended says how it ended).
      const lost = `lost-${Date.now()}`;
      await roomr.createCall(f.controlAddr, {
        callRef: lost,
        to: { uri: "sip:+1@routr" }
      });
      await placer.placing(lost, f.nodeRef, f.controlAddr, `room-${lost}`);
      // Killed between the registry write and the RPC: NOT_FOUND on the node; and a placement
      // on a node that is down since.
      const early = `early-${Date.now()}`;
      await placer.placing(early, f.nodeRef, f.controlAddr);
      const orphan = `orphan-${Date.now()}`;
      await placer.placing(orphan, "gone-node", "127.0.0.1:1");
      await new Promise((r) => setTimeout(r, 200));
      expect(await sweeper.sweep()).to.deep.equal([]);
      now += 1500;
      expect((await sweeper.sweep()).sort()).to.deep.equal(
        [lost, early, orphan].sort()
      );
      expect(f.calls.get(lost)?.call.state).to.equal("ENDED");
      expect(f.of("EndCall")).to.deep.include({ callRef: lost });
      expect(failed.sort()).to.deep.equal([early, orphan].sort());
      for (const ref of [lost, early, orphan])
        expect(await Sessions.getSession(kv, "placements", ref)).to.equal(
          undefined
        );
    } finally {
      sweeper?.stop();
      stopWatch();
      placer.stop();
      roomr.close();
      await f.stop();
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
