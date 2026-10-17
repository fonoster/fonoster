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
import { Metadata, status } from "@grpc/grpc-js";
import { expect } from "chai";
import { randomUUID } from "crypto";
import { connect, NatsConnection, StringCodec } from "nats";
import { createCall } from "../../src/calls/createCall";
import { callPublisher } from "../../src/calls/createCallPublisher";
import { createTrackCall } from "../../src/calls/createTrackCall";
import { Prisma } from "../../src/core/db";
import { runOutboundCalls } from "../../src/outbound";
import { TEST_TOKEN, TEST_UUID } from "../utils";

// The apiserver as a stateless control plane (control-plane spec; harden-conformance 1.1, 1.2):
// several replicas on one NATS, each running the outbound placement (`calls.create`, one queue
// group) and TrackCall. Media nodes and gateways are stand-ins on NATS. Needs
// CONFORMANCE_NATS_URL; the registry cases also need JetStream (CONFORMANCE_JETSTREAM_URL, or the
// same server started with -js).
const URL =
  process.env.CONFORMANCE_JETSTREAM_URL ?? process.env.CONFORMANCE_NATS_URL;
const sc = StringCodec();
const encode = (body: unknown) => sc.encode(JSON.stringify(body));
const decode = (data: Uint8Array) => JSON.parse(sc.decode(data));

async function until(check: () => boolean, ms = 5000, what = "condition") {
  const deadline = Date.now() + ms;
  while (!check()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 20));
  }
}

const callFor = (ref: string) => ({
  ref,
  from: "+15550001111",
  to: "+15550002222",
  appRef: "app-1",
  accessKeyId: "WO00000000000000000000000000000000"
});

type Command = {
  type: string;
  id: string;
  roomRef?: string;
  callRef?: string;
  reply: string;
};

/**
 * A media node on NATS: acks every command, answers each dial (`call.progress` ringing, then
 * `call.answered`) and heartbeats its room count and limit. Like the real node, a room created
 * for a call (`callRef`) also publishes its call events on `calls.<callRef>.events`, and
 * `room.create` beyond `maxRooms` is refused with `at_capacity`. `reply` tells which replica sent
 * a command. `reportedRooms` makes the heartbeat lie (a node that filled up since its last beat);
 * calls in `holdAnswer` only ring until `answer(callRef)`.
 */
function fakeNode(
  nc: NatsConnection,
  nodeId: string,
  options: {
    rooms?: number;
    maxRooms?: number;
    reportedRooms?: number;
    draining?: boolean;
    holdAnswer?: Set<string>;
  } = {}
) {
  const commands: Command[] = [];
  let rooms = options.rooms ?? 0;
  const callOf = new Map<string, string>(); // roomRef → callRef
  const emit = (roomRef: string, event: Record<string, unknown>) => {
    const body = { ...event, roomRef };
    nc.publish(`media.${nodeId}.events.${roomRef}`, encode(body));
    const callRef = callOf.get(roomRef);
    if (callRef)
      nc.publish(
        `calls.${callRef}.events`,
        encode({ ...body, callRef, nodeId })
      );
  };
  const sub = nc.subscribe(`media.${nodeId}.commands`, {
    callback: (_e, msg) => {
      const cmd = decode(msg.data);
      commands.push({ ...cmd, reply: msg.reply ?? "" });
      if (cmd.type === "room.create") {
        if (options.maxRooms !== undefined && rooms >= options.maxRooms) {
          msg.respond(
            encode({
              type: "error",
              id: cmd.id,
              code: "at_capacity",
              message: `${nodeId} is full`
            })
          );
          return;
        }
        rooms += 1;
        const roomRef = `${nodeId}-room-${rooms}`;
        if (cmd.callRef) callOf.set(roomRef, cmd.callRef);
        msg.respond(encode({ type: "ack", id: cmd.id, roomRef }));
        return;
      }
      msg.respond(encode({ type: "ack", id: cmd.id }));
      if (cmd.type === "participant.dial") {
        emit(cmd.roomRef, { type: "call.progress", status: "ringing" });
        if (!options.holdAnswer?.has(callOf.get(cmd.roomRef) ?? ""))
          emit(cmd.roomRef, { type: "call.answered", participantRef: "p-1" });
      }
    }
  });
  const heartbeat = () =>
    nc.publish(
      `media.${nodeId}.heartbeat`,
      encode({
        type: "node.heartbeat",
        nodeId,
        rooms: options.reportedRooms ?? rooms,
        ...(options.maxRooms !== undefined
          ? { maxRooms: options.maxRooms }
          : {}),
        draining: options.draining === true
      })
    );
  heartbeat();
  const timer = setInterval(heartbeat, 500);
  const roomOf = (callRef: string) =>
    [...callOf.entries()].find(([, c]) => c === callRef)?.[0] ?? "";
  return {
    nodeId,
    commands,
    of: (type: string) => commands.filter((c) => c.type === type),
    roomOf,
    hangUp: (roomRef: string) =>
      emit(roomRef, { type: "room.ended", reason: "callee_hangup" }),
    answer: (callRef: string) =>
      emit(roomOf(callRef), { type: "call.answered", participantRef: "p-1" }),
    down() {
      clearInterval(timer);
      nc.publish(
        `media.${nodeId}.heartbeat`,
        encode({ type: "node.down", nodeId })
      );
    },
    stop() {
      clearInterval(timer);
      sub.unsubscribe();
    }
  };
}

/** The gateways' queue group: takes every `gateway.outbound`. */
function fakeGateways(nc: NatsConnection) {
  return nc.subscribe("gateway.outbound", {
    queue: "gateway-outbound",
    callback: (_e, msg) => msg.respond(encode({ type: "ack" }))
  });
}

/**
 * One apiserver replica: its own NATS connection (with its own inbox prefix, so a node can tell
 * who sent a command), the outbound placement and TrackCall.
 */
async function startReplica(
  name: string,
  options: { place?: boolean; sessionsBucket?: string } = {}
) {
  const nc = await connect({
    servers: URL,
    name: `replica-${name}`,
    inboxPrefix: `_INBOX_${name}`
  });
  const stopPlacing =
    options.place === false
      ? undefined
      : await runOutboundCalls({ nc, sessionsBucket: options.sessionsBucket });
  const trackCall = createTrackCall(nc);
  return {
    name,
    nc,
    /** TrackCall for one call: the statuses written to the stream, and whether it ended. */
    track(ref: string) {
      const stream = { statuses: [] as string[], ended: false };
      void trackCall(
        {
          request: { ref },
          write: (r: { status?: string }) => {
            if (r.status) stream.statuses.push(r.status);
          },
          end: () => {
            stream.ended = true;
          }
        } as never,
        () => undefined
      );
      return stream;
    },
    /** Stops cleanly (a rolling restart). */
    async stop() {
      await stopPlacing?.();
      await nc.close();
    },
    /** Dies without cleaning up (the process is killed). */
    async kill() {
      await nc.close();
    }
  };
}

type Replica = Awaited<ReturnType<typeof startReplica>>;

/** CreateCall's request to the placement (`calls.create`): resolves with the reply. */
async function requestCall(nc: NatsConnection, ref: string) {
  const msg = await nc.request("calls.create", encode(callFor(ref)), {
    timeout: 10000
  });
  return decode(msg.data) as {
    type: string;
    code?: string;
    message?: string;
    nodeId?: string;
  };
}

/** The Calls service's CreateCall over a NATS connection (the app lookup stubbed). */
async function createCallRpc(nc: NatsConnection) {
  const prisma = {
    application: { findUnique: async () => ({ ref: TEST_UUID }) }
  } as unknown as Prisma;
  const handler = createCall(prisma, callPublisher(nc));
  const metadata = new Metadata();
  metadata.set("token", TEST_TOKEN);
  return new Promise<{
    error?: { code: number; message: string };
    ref?: string;
  }>((resolve) =>
    handler(
      {
        metadata,
        request: {
          from: "+15550001111",
          to: "+15550002222",
          appRef: TEST_UUID
        }
      } as never,
      (error?: { code: number; message: string }, response?: { ref: string }) =>
        resolve({ error: error ?? undefined, ref: response?.ref })
    )
  );
}

describe("@apiserver[control plane] stateless replicas", function () {
  this.timeout(20000);
  let client: NatsConnection;
  let bucket: string;
  const cleanup: (() => unknown)[] = [];

  before(async function () {
    if (!URL) return this.skip();
    client = await connect({ servers: URL, name: "control-plane-client" });
  });

  beforeEach(() => {
    bucket = `test_cp_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  });

  afterEach(async () => {
    for (const fn of cleanup.splice(0).reverse()) await fn();
    const jsm = await client.jetstreamManager().catch(() => undefined);
    await jsm?.streams.delete(`KV_${bucket}`).catch(() => undefined);
  });

  after(async () => client?.close());

  let live: Replica[] = [];

  const replicas = async (...specs: [string, { place?: boolean }?][]) => {
    const started: Replica[] = [];
    live = started;
    for (const [name, options] of specs) {
      const r = await startReplica(name, {
        ...options,
        sessionsBucket: bucket
      });
      started.push(r);
      cleanup.push(() => (r.nc.isClosed() ? undefined : r.stop()));
    }
    return started;
  };

  const node = (nodeId: string, options?: Parameters<typeof fakeNode>[2]) => {
    const n = fakeNode(client, nodeId, options);
    cleanup.push(() => n.stop());
    return n;
  };

  const gateways = () => {
    const g = fakeGateways(client);
    cleanup.push(() => g.unsubscribe());
  };

  /**
   * Waits until every replica has seen what the client published so far (the nodes' heartbeats):
   * the client's flush means the server has it, and a replica's flush returns after the server
   * delivered everything queued for that replica before the PONG.
   */
  const settle = async () => {
    await client.flush();
    for (const r of live) if (!r.nc.isClosed()) await r.nc.flush();
  };

  it("any replica serves any request: a call placed by A is tracked through B", async function () {
    const [, b] = await replicas(["a"], ["b", { place: false }]);
    const n = node(`n-${randomUUID()}`);
    gateways();
    await settle();

    const ref = randomUUID();
    const stream = b.track(ref);
    expect(await requestCall(client, ref)).to.include({
      type: "ack",
      nodeId: n.nodeId
    });

    await until(() => stream.statuses.includes("ANSWER"), 5000, "ANSWER");
    expect(stream.statuses).to.deep.equal(["TRYING", "PROGRESS", "ANSWER"]);
    // Placed by A (B does not place): the node's commands came from A's inbox.
    expect(n.of("room.create")[0].reply).to.match(/^_INBOX_a\./);

    n.hangUp(n.of("participant.dial")[0].roomRef!);
    await until(() => stream.ended, 3000, "the stream to end");
  });

  it("losing a replica: no active call ends, the others serve every request", async function () {
    const [a, b, c] = await replicas(["a"], ["b"], ["c"]);
    // The first call only rings until the test answers it, after its placer is gone.
    const refs = Array.from({ length: 9 }, () => randomUUID());
    const n = node(`n-${randomUUID()}`, { holdAnswer: new Set([refs[0]]) });
    gateways();
    await settle();

    // TrackCall for the first call on every replica.
    const firstStreams = new Map([a, b, c].map((r) => [r, r.track(refs[0])]));

    // Nine calls through one queue group: each is placed exactly once.
    const replies = await Promise.all(
      refs.map((ref) => requestCall(client, ref))
    );
    expect(replies.every((r) => r.type === "ack")).to.equal(true);
    await until(() => n.of("participant.dial").length === 9, 5000, "9 dials");
    expect(n.of("room.create")).to.have.length(9);
    for (const s of firstStreams.values())
      await until(() => s.statuses.includes("PROGRESS"), 3000, "PROGRESS");

    // Kill the replica that placed the first call while the calls are up.
    const placer = [a, b, c].find((r) =>
      n
        .of("room.create")
        .find((cmd) => cmd.callRef === refs[0])!
        .reply.startsWith(`_INBOX_${r.name}.`)
    )!;
    await placer.kill();
    const survivors = [a, b, c].filter((r) => r !== placer);

    // The first call's next statuses still reach TrackCall on the surviving replicas: they come
    // from the node on the call's own subject, not from the replica that placed it.
    n.answer(refs[0]);
    n.hangUp(n.roomOf(refs[0]));
    for (const r of survivors) {
      const s = firstStreams.get(r)!;
      await until(() => s.ended, 3000, `${r.name}'s stream to end`);
      expect(s.statuses).to.deep.equal(["TRYING", "PROGRESS", "ANSWER"]);
    }

    // No call ended: nothing asked the node to end a room.
    expect(n.of("room.end")).to.have.length(0);

    // The survivors place and track new calls.
    const more = Array.from({ length: 6 }, () => randomUUID());
    const streams = more.map((ref) => survivors[0].track(ref));
    const moreReplies = await Promise.all(
      more.map((ref) => requestCall(client, ref))
    );
    expect(moreReplies.every((r) => r.type === "ack")).to.equal(true);
    await until(
      () => streams.every((s) => s.statuses.includes("ANSWER")),
      5000,
      "every new call answered"
    );
    const newRooms = n.of("room.create").slice(9);
    expect(newRooms).to.have.length(6);
    for (const cmd of newRooms)
      expect(cmd.reply.startsWith(`_INBOX_${placer.name}.`)).to.equal(false);
    expect(n.of("room.end")).to.have.length(0);
  });

  it("places a call on the least-loaded node that is not draining (heartbeats)", async function () {
    await replicas(["a"]);
    const tag = randomUUID().slice(0, 8);
    const busy = node(`a-${tag}`, { rooms: 40 });
    const idle = node(`b-${tag}`, { rooms: 12 });
    const draining = node(`c-${tag}`, { rooms: 3, draining: true });
    gateways();
    await settle();

    expect(await requestCall(client, randomUUID())).to.include({
      nodeId: idle.nodeId
    });
    await until(() => idle.of("participant.dial").length === 1, 5000, "dial");
    expect(idle.of("room.create")).to.have.length(1);
    expect(busy.commands).to.have.length(0);
    expect(draining.commands).to.have.length(0);
  });

  it("no capacity: with every node draining, gone or at its limit, CreateCall fails at once with RESOURCE_EXHAUSTED and no INVITE is sent", async function () {
    const [a] = await replicas(["a"]);
    const tag = randomUUID().slice(0, 8);
    const d1 = node(`d1-${tag}`, { draining: true });
    const d2 = node(`d2-${tag}`, { rooms: 2, draining: true });
    const full = node(`f-${tag}`, { rooms: 4, maxRooms: 4 });
    const gone = node(`g-${tag}`);
    gateways();
    await settle();
    gone.down();
    await settle();

    // The placement's reply to CreateCall.
    const ref = randomUUID();
    const stream = a.track(ref);
    expect(await requestCall(client, ref)).to.include({
      type: "error",
      code: "no_capacity"
    });
    await until(() => stream.statuses.includes("FAILED"), 5000, "FAILED");
    expect(stream.statuses).to.deep.equal(["TRYING", "FAILED"]);

    // CreateCall itself: the gRPC error, before any status stream.
    const started = Date.now();
    const created = await createCallRpc(client);
    expect(created.error?.code).to.equal(status.RESOURCE_EXHAUSTED);
    expect(created.ref).to.equal(undefined);
    expect(Date.now() - started).to.be.below(2000);

    for (const n of [d1, d2, full, gone]) {
      expect(n.of("room.create")).to.have.length(0);
      expect(n.of("participant.dial")).to.have.length(0);
    }
  });

  it("no capacity: a node at its session limit gets no new call", async function () {
    await replicas(["a"]);
    const tag = randomUUID().slice(0, 8);
    // A has fewer sessions but is at its limit; B has more and is below its limit.
    const atLimit = node(`a-${tag}`, { rooms: 5, maxRooms: 5 });
    const below = node(`b-${tag}`, { rooms: 8, maxRooms: 20 });
    gateways();
    await settle();

    expect(await requestCall(client, randomUUID())).to.include({
      type: "ack",
      nodeId: below.nodeId
    });
    expect(below.of("room.create")).to.have.length(1);
    expect(atLimit.commands).to.have.length(0);
  });

  it("a node that refuses the room (full since its last heartbeat) sends the call to the next one", async function () {
    await replicas(["a"]);
    const tag = randomUUID().slice(0, 8);
    // Its heartbeat says 0 rooms, but it is full: room.create gets at_capacity.
    const stale = node(`a-${tag}`, {
      rooms: 10,
      reportedRooms: 0,
      maxRooms: 10
    });
    const next = node(`b-${tag}`, { rooms: 3, maxRooms: 10 });
    gateways();
    await settle();

    expect(await requestCall(client, randomUUID())).to.include({
      type: "ack",
      nodeId: next.nodeId
    });
    await until(() => next.of("participant.dial").length === 1, 3000, "dial");
    expect(stale.of("room.create")).to.have.length(1);
    expect(stale.of("participant.dial")).to.have.length(0);
  });

  it("no capacity: after three nodes refuse, CreateCall fails and no fourth node is tried", async function () {
    await replicas(["a"]);
    const tag = randomUUID().slice(0, 8);
    const refusing = [0, 1, 2, 3].map((i) =>
      node(`r${i}-${tag}`, {
        rooms: 10 + i,
        reportedRooms: i,
        maxRooms: 10 + i
      })
    );
    gateways();
    await settle();

    const created = await createCallRpc(client);
    expect(created.error?.code).to.equal(status.RESOURCE_EXHAUSTED);
    // The three least-loaded (by their heartbeats) were tried, once each; the fourth was not.
    expect(refusing.map((n) => n.of("room.create").length)).to.deep.equal([
      1, 1, 1, 0
    ]);
    for (const n of refusing)
      expect(n.of("participant.dial")).to.have.length(0);
  });
});

describe("@apiserver[control plane] session registry", function () {
  this.timeout(20000);
  let client: NatsConnection;
  let bucket: string;

  before(async function () {
    if (!URL) return this.skip();
    client = await connect({ servers: URL, name: "registry-client" });
    try {
      await (await client.jetstreamManager()).getAccountInfo();
    } catch {
      await client.close();
      return this.skip(); // no JetStream on this server
    }
    bucket = `test_cp_registry_${Date.now()}`;
  });

  after(async () => {
    if (!client || client.isClosed()) return;
    await (await client.jetstreamManager()).streams
      .delete(`KV_${bucket}`)
      .catch(() => undefined);
    await client.close();
  });

  it("survives a replica restart during 50 active calls", async function () {
    const kv = await Sessions.openSessions(client, { bucket });
    const nodeId = `n-${randomUUID()}`;
    // What the node and the gateway keep in the registry while 50 calls are up.
    const owners = new Sessions.SessionLeases(kv, { refreshMs: 1000 });
    await owners.set("nodes", nodeId, { nodeId, rooms: 50 });
    const calls = Array.from({ length: 50 }, (_, i) => ({
      callRef: randomUUID(),
      gatewayRef: "gw-1",
      nodeId,
      roomRef: `room-${i}`,
      appRef: "app-1"
    }));
    for (const call of calls) {
      await owners.set("rooms", call.roomRef, {
        roomRef: call.roomRef,
        nodeId
      });
      await owners.set("calls", call.callRef, call);
    }
    const n = fakeNode(client, nodeId, { rooms: 50 });
    const g = fakeGateways(client);
    try {
      const first = await startReplica("a", { sessionsBucket: bucket });
      await first.stop();
      const restarted = await startReplica("a2", { sessionsBucket: bucket });
      try {
        for (const call of calls) {
          const entry = await Sessions.getSession(kv, "calls", call.callRef);
          expect(entry, call.callRef).to.include({
            nodeId,
            roomRef: call.roomRef
          });
        }
        // The restarted replica places a call at once, from the registry.
        const ref = randomUUID();
        const stream = restarted.track(ref);
        expect(await requestCall(client, ref)).to.include({ type: "ack" });
        await until(() => stream.statuses.includes("ANSWER"), 5000, "ANSWER");
        expect(n.of("room.end")).to.have.length(0);
      } finally {
        await restarted.stop();
      }
    } finally {
      n.stop();
      g.unsubscribe();
      await owners.close();
    }
  });
});
