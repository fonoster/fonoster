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
import { Roomr } from "@fonoster/common";
import { status } from "@grpc/grpc-js";
import { expect } from "chai";
import { randomUUID } from "crypto";
import { connect, NatsConnection, StringCodec } from "nats";
import {
  buildMediaNode,
  FakeRoomr,
  MediaNodeBinaries,
  MediaNodeProcess
} from "../src";

// Roomr over gRPC against the Go node (redesign-media-node; decisions 3 and 7): the suite is the
// controller (a Roomr client), the caller bot is the SIP trunk the node dials through, NATS
// carries the call's events. Needs NATS (CONFORMANCE_NATS_URL) and a Go toolchain.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const sc = StringCodec();

type Event = Record<string, unknown>;

async function until<T>(
  get: () => T | undefined,
  what: string,
  ms = 5000
): Promise<T> {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = get();
    if (v !== undefined) return v;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 20));
  }
}

const rejected = (p: Promise<unknown>) =>
  p.then(
    () => expect.fail("accepted"),
    (e: Roomr.RoomrError) => e
  );

describe("@conformance Roomr CreateCall over gRPC (Go node)", function () {
  this.timeout(60000);
  let nc: NatsConnection;
  let bins: MediaNodeBinaries | undefined;
  let node: MediaNodeProcess;
  let roomr: ReturnType<typeof Roomr.createRoomrPool>;
  const events = new Map<string, Event[]>();

  before(async function () {
    if (!NATS_URL) return this.skip();
    bins = buildMediaNode(NATS_URL);
    if (!bins) return this.skip();
    nc = await connect({ servers: NATS_URL });
    nc.subscribe("roomr.events.>", {
      callback: (_e, msg) => {
        const ev = JSON.parse(sc.decode(msg.data)) as Event;
        const ref = String(ev.call_ref ?? "");
        events.set(ref, [...(events.get(ref) ?? []), ev]);
      }
    });
    roomr = Roomr.createRoomrPool({ deadlineMs: 5000 });
  });

  beforeEach(async function () {
    node = new MediaNodeProcess(bins!);
    await node.start();
  });

  afterEach(async () => node?.stop());

  after(async () => {
    roomr?.close();
    await nc?.close();
  });

  const event = (ref: string, type: string, ms = 5000) =>
    until(
      () => events.get(ref)?.find((e) => e.type === type),
      `${type} for ${ref}`,
      ms
    );
  const typesOf = (ref: string) => (events.get(ref) ?? []).map((e) => e.type);
  const target = (headers?: Record<string, string>) => ({
    uri: "sip:+15551234567@carrier.invalid",
    proxy: node.botSipAddress,
    ...(headers ? { headers } : {})
  });
  const received = async () =>
    (await node.botCalls()).calls.filter((c) => c.requestUri);

  it("dials into a new room: Call RINGING, then call.ringing and call.answered with the labels; headers reach the INVITE byte for byte", async function () {
    const ref = randomUUID();
    const headers = {
      "X-DOD-Number": "+15550002",
      "X-Foo": 'bar;baz="q u"'
    };
    const call = await roomr.createCall(node.controlAddr, {
      callRef: ref,
      to: target(headers),
      labels: { tenant: "t1" }
    });
    expect(call).to.include({ callRef: ref, state: "RINGING" });
    expect(call.roomRef).to.not.equal("");
    const answered = await event(ref, "call.answered");
    expect(answered.labels).to.deep.equal({ tenant: "t1" });
    expect(typesOf(ref).slice(0, 3)).to.deep.equal([
      "call.started",
      "call.ringing",
      "call.answered"
    ]);
    const [invite] = await received();
    expect(invite.requestUri).to.contain("+15551234567@carrier.invalid");
    expect(invite.headers).to.deep.equal(headers);
  });

  for (const [mode, ring, cause, sip] of [
    ["busy", 10, "busy", 486],
    ["no_answer", 1, "no_answer", 408],
    ["decline", 10, "rejected", 603]
  ] as const) {
    it(`a ${mode} callee ends the call (cause ${cause}, SIP ${sip}): nobody joins and no room remains`, async function () {
      await node.calleeMode(mode);
      const ref = randomUUID();
      const call = await roomr.createCall(node.controlAddr, {
        callRef: ref,
        to: target(),
        ringTimeoutS: ring
      });
      const ended = await event(ref, "call.ended", 8000);
      expect(ended).to.include({ cause, sip_status: sip });
      expect(typesOf(ref)).to.not.include("call.answered");
      expect(typesOf(ref)).to.not.include("participant.joined");
      const e = await rejected(
        roomr.endRoom(node.controlAddr, { roomRef: call.roomRef })
      );
      expect(e.code).to.equal(status.NOT_FOUND);
    });
  }

  it("is idempotent by call_ref within the dedupe window, ALREADY_EXISTS when the parameters differ", async function () {
    const ref = randomUUID();
    const request = { callRef: ref, to: target({ "X-A": "1" }) };
    const first = await roomr.createCall(node.controlAddr, request);
    await event(ref, "call.answered");
    const again = await roomr.createCall(node.controlAddr, request);
    expect(again).to.include({ callRef: ref, roomRef: first.roomRef });
    expect(again.state).to.equal("ANSWERED");
    await roomr.endCall(node.controlAddr, { callRef: ref });
    await event(ref, "call.ended");
    // Ended, still remembered: the same Call, no second INVITE.
    expect((await roomr.createCall(node.controlAddr, request)).state).to.equal(
      "ENDED"
    );
    const e = await rejected(
      roomr.createCall(node.controlAddr, {
        ...request,
        to: target({ "X-A": "2" })
      })
    );
    expect(e.code).to.equal(status.ALREADY_EXISTS);
    expect(await received()).to.have.length(1);
  });

  it("takes the configured call-ref header as the call_ref, both ways; a different call_ref is INVALID_ARGUMENT", async function () {
    const ref = randomUUID();
    const call = await roomr.createCall(node.controlAddr, {
      to: target({ "X-Call-Ref": ref })
    });
    expect(call.callRef).to.equal(ref);
    await event(ref, "call.answered");
    const e = await rejected(
      roomr.createCall(node.controlAddr, {
        callRef: randomUUID(),
        to: target({ "X-Call-Ref": randomUUID() })
      })
    );
    expect(e.code).to.equal(status.INVALID_ARGUMENT);

    // Inbound: the INVITE's X-Call-Ref names the call (its events, and EndCall, which would be
    // NOT_FOUND for a ref the node does not know).
    const inbound = randomUUID();
    await node.call({ callRef: inbound, appRef: "app-1" });
    expect(await event(inbound, "call.started")).to.include({
      direction: "inbound"
    });
    await roomr.endCall(node.controlAddr, { callRef: inbound });
    await event(inbound, "call.ended");
  });

  it("answers the proxy's digest challenge with to.auth", async function () {
    await node.calleeMode("answer", { username: "peer", password: "s3cret" });
    const ref = randomUUID();
    await roomr.createCall(node.controlAddr, {
      callRef: ref,
      to: { ...target(), auth: { username: "peer", password: "s3cret" } }
    });
    await event(ref, "call.answered");
    expect((await node.botCalls()).challenged).to.be.at.least(1);
  });

  it("refuses at its room limit with RESOURCE_EXHAUSTED before any INVITE", async function () {
    await node.stop();
    node = new MediaNodeProcess(bins!);
    node.maxRooms = 1;
    await node.start();
    await roomr.createRoom(node.controlAddr, {});
    const e = await rejected(
      roomr.createCall(node.controlAddr, {
        callRef: randomUUID(),
        to: target()
      })
    );
    expect(e.code).to.equal(status.RESOURCE_EXHAUSTED);
    expect(await received()).to.have.length(0);
  });
});

describe("@conformance fake Roomr node (controller fakes)", function () {
  it("keeps the node's CreateCall contract: dedupe, ALREADY_EXISTS, limit and draining", async function () {
    const full = new FakeRoomr({ maxRooms: 1 });
    const draining = new FakeRoomr({ draining: true });
    const roomr = Roomr.createRoomrPool();
    try {
      await full.start();
      await draining.start();
      const request = { callRef: "c1", to: { uri: "sip:+1@x" } };
      const first = await roomr.createCall(full.controlAddr, request);
      expect(await roomr.createCall(full.controlAddr, request)).to.include({
        callRef: first.callRef,
        roomRef: first.roomRef
      });
      const exists = await rejected(
        roomr.createCall(full.controlAddr, {
          ...request,
          to: { uri: "sip:+2@x" }
        })
      );
      expect(exists.code).to.equal(status.ALREADY_EXISTS);
      const atLimit = await rejected(
        roomr.createCall(full.controlAddr, {
          callRef: "c2",
          to: { uri: "sip:+1@x" }
        })
      );
      expect(atLimit.code).to.equal(status.RESOURCE_EXHAUSTED);
      const unavailable = await rejected(
        roomr.createRoom(draining.controlAddr, {})
      );
      expect(unavailable.code).to.equal(status.UNAVAILABLE);
      full.failNext("EndCall", status.INTERNAL);
      expect(
        (await rejected(roomr.endCall(full.controlAddr, { callRef: "c1" })))
          .code
      ).to.equal(status.INTERNAL);
    } finally {
      roomr.close();
      await full.stop();
      await draining.stop();
    }
  });
});
