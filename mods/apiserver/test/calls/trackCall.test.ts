/* eslint-disable prettier/prettier */
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
import { DialStatus } from "@fonoster/common";
import { CallStatus } from "@fonoster/types";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { EventEmitter } from "events";
import { NatsConnection } from "nats";
import * as sinon from "sinon";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@calls/trackCall", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should track the status of a call", async function () {
    const { createTrackCall } = await import("../../src/calls/createTrackCall");
    const callRef = "5d8c253a-62a0-48d5-9c8f-cfd00279936f";

    const call = {
      write: sandbox.stub(),
      end: sandbox.stub(),
      request: {
        ref: callRef
      }
    };

    const subscription = { callback: sandbox.stub() };
    const nc = {
      subscribe: sandbox.stub().returns(subscription)
    } as unknown as NatsConnection;

    const trackCall = createTrackCall(nc);

    trackCall(call, () => {});

    const msg = {
      json: sandbox
        .stub()
        .onFirstCall()
        .returns({ ref: callRef, status: DialStatus.TRYING })
        .onSecondCall()
        .returns({ ref: callRef, status: DialStatus.PROGRESS })
        .onThirdCall()
        .returns({ ref: callRef, status: DialStatus.ANSWER })
    };

    subscription.callback(null, msg);
    subscription.callback(null, msg);
    subscription.callback(null, msg);

    expect(call.write).to.have.been.calledWith({
      ref: callRef,
      status: DialStatus.TRYING
    });
    expect(call.write).to.have.been.calledWith({
      ref: callRef,
      status: DialStatus.PROGRESS
    });
    expect(call.write).to.have.been.calledWith({
      ref: callRef,
      status: DialStatus.ANSWER
    });
  });

  it("replays statuses that came before TrackCall and ends on the final message", async function () {
    const clock = sandbox.useFakeTimers();
    const { createTrackCall } = await import("../../src/calls/createTrackCall");
    const callRef = "9b2f1a8e-1c4d-4f7a-8e2b-3d5c6a7b8c9d";
    const subscription = { callback: sandbox.stub() };
    const nc = {
      subscribe: sandbox.stub().returns(subscription)
    } as unknown as NatsConnection;
    const trackCall = createTrackCall(nc);
    const send = (m: Record<string, unknown>) =>
      subscription.callback(null, { json: () => m });

    send({ ref: callRef, status: DialStatus.TRYING });
    send({ ref: callRef, status: DialStatus.PROGRESS });

    const call = {
      write: sandbox.stub(),
      end: sandbox.stub(),
      request: { ref: callRef }
    };
    await trackCall(call, () => {});
    expect(call.write.firstCall.args[0]).to.deep.equal({
      ref: callRef,
      status: DialStatus.TRYING
    });
    expect(call.write.secondCall.args[0]).to.deep.equal({
      ref: callRef,
      status: DialStatus.PROGRESS
    });

    send({ ref: callRef, status: DialStatus.ANSWER });
    send({ ref: callRef, final: true });
    clock.tick(600);
    expect(call.write).to.have.callCount(3);
    expect(call.end).to.have.been.calledOnce;
  });

  it("translates the Roomr node's call events on roomr.events.<ref>", async function () {
    const clock = sandbox.useFakeTimers();
    const { createTrackCall, toTrackMessage } =
      await import("../../src/calls/createTrackCall");
    const callRef = "0f6c2a51-7d4e-4b8a-9c3f-2e1d5a6b7c8d";
    const subject = `roomr.events.${callRef}`;
    const subscription = { callback: sandbox.stub() };
    const nc = {
      subscribe: sandbox.stub().returns(subscription)
    } as unknown as NatsConnection;
    const trackCall = createTrackCall(nc);
    expect((nc.subscribe as sinon.SinonStub).firstCall.args[0]).to.equal(
      "calls.*.events"
    );
    expect((nc.subscribe as sinon.SinonStub).secondCall.args[0]).to.equal(
      "roomr.events.*"
    );
    const send = (m: Record<string, unknown>) =>
      subscription.callback(null, { subject, json: () => m });

    const call = {
      write: sandbox.stub(),
      end: sandbox.stub(),
      request: { ref: callRef }
    };
    await trackCall(call, () => {});
    send({ ref: callRef, status: DialStatus.TRYING });
    const ev = (type: string, seq: number, extra = {}) => ({
      type,
      call_ref: callRef,
      room_ref: "r1",
      node_ref: "n1",
      seq,
      metadata: {},
      ...extra
    });
    send(ev("call.started", 1));
    send(ev("call.ringing", 2));
    send(ev("call.answered", 3));
    send(ev("participant.joined", 4)); // not a call status
    send(ev("call.ended", 5, { cause: "callee_hangup", answered: true }));
    clock.tick(600);
    expect(call.write.args.map((a) => a[0])).to.deep.equal([
      { ref: callRef, status: DialStatus.TRYING },
      { ref: callRef, status: DialStatus.PROGRESS },
      { ref: callRef, status: DialStatus.ANSWER }
    ]);
    expect(call.end).to.have.been.calledOnce;

    const ended = (cause: string) => ({
      type: "call.ended",
      cause,
      answered: false
    });
    expect(
      toTrackMessage({ ...ended("busy"), call_ref: callRef, sip_status: 486 })
    ).to.deep.equal({
      ref: callRef,
      status: DialStatus.BUSY,
      hangupCause: CallStatus.USER_BUSY,
      final: true
    });
    expect(toTrackMessage(ended("no_answer"), subject)).to.deep.equal({
      ref: callRef,
      status: DialStatus.NOANSWER,
      hangupCause: CallStatus.NO_ANSWER,
      final: true
    });
    expect(toTrackMessage(ended("rejected"), subject)).to.deep.equal({
      ref: callRef,
      status: DialStatus.FAILED,
      hangupCause: CallStatus.CALL_REJECTED,
      final: true
    });
    expect(toTrackMessage({ type: "dtmf", digit: "5" }, subject)).to.equal(
      undefined
    );
  });

  it("ends an unanswered call with the CallStatus its record reports", async function () {
    const { toTrackMessage } = await import("../../src/calls/createTrackCall");
    const { toCallDetailRecord } =
      await import("../../src/records/createSearchRecords");
    // The node's cause is the record's failure reason (unknown causes: node_error); the SIP
    // status says nothing more in either.
    const causes = [
      ["busy", 486],
      ["busy", 503],
      ["no_answer", 480],
      ["rejected", 603],
      ["rejected", 404],
      ["node_error", 503],
      ["removed", undefined],
      ["canceled", undefined],
      ["app_unreachable", undefined],
      ["media_timeout", undefined],
      [undefined, undefined]
    ] as const;
    const recordOf = (reason: string) =>
      toCallDetailRecord({
        callRef: "r",
        status: "failed",
        failureReason: reason,
        startedAt: new Date(0)
      } as never).status;
    for (const [cause, sip_status] of causes) {
      const message = toTrackMessage(
        { type: "call.ended", answered: false, cause, sip_status },
        "roomr.events.r"
      );
      expect(message?.hangupCause, `${cause} ${sip_status}`).to.equal(
        recordOf(cause ?? "node_error")
      );
    }
    expect(recordOf("rejected")).to.equal(CallStatus.CALL_REJECTED);
    expect(recordOf("node_error")).to.equal(CallStatus.SERVICE_UNAVAILABLE);
  });

  it("gives the control plane's FAILED (placement failed) a hangup cause", async function () {
    const { toTrackMessage } = await import("../../src/calls/createTrackCall");
    expect(toTrackMessage({ ref: "r", status: "FAILED" })).to.deep.equal({
      ref: "r",
      status: DialStatus.FAILED,
      hangupCause: CallStatus.SERVICE_UNAVAILABLE
    });
    expect(toTrackMessage({ ref: "r", status: "TRYING" })).to.deep.equal({
      ref: "r",
      status: DialStatus.TRYING
    });
  });

  it("delivers the hangup cause with the final status of an unanswered call", async function () {
    const clock = sandbox.useFakeTimers();
    const { createTrackCall } = await import("../../src/calls/createTrackCall");
    const callRef = "3c1d9e2a-5b6f-4a7c-8d9e-0f1a2b3c4d5e";
    const subject = `roomr.events.${callRef}`;
    const subscription = { callback: sandbox.stub() };
    const nc = {
      subscribe: sandbox.stub().returns(subscription)
    } as unknown as NatsConnection;
    const trackCall = createTrackCall(nc);
    const send = (m: Record<string, unknown>) =>
      subscription.callback(null, { subject, json: () => m });
    const call = {
      write: sandbox.stub(),
      end: sandbox.stub(),
      request: { ref: callRef }
    };
    await trackCall(call, () => {});
    send({ ref: callRef, status: DialStatus.TRYING });
    send({ type: "call.ringing", call_ref: callRef, node_ref: "n1" });
    send({
      type: "call.ended",
      call_ref: callRef,
      node_ref: "n1",
      cause: "rejected",
      sip_status: 404,
      answered: false
    });
    clock.tick(600);
    expect(call.write.args.map((a) => a[0])).to.deep.equal([
      { ref: callRef, status: DialStatus.TRYING },
      { ref: callRef, status: DialStatus.PROGRESS },
      {
        ref: callRef,
        status: DialStatus.FAILED,
        hangupCause: CallStatus.CALL_REJECTED
      }
    ]);
    expect(call.end).to.have.been.calledOnce;
  });

  describe("every stream ends", function () {
    /** A fake NATS whose subscriptions can be fed by subject. */
    const fakeNats = () => {
      const subs = new Map<string, { callback?: Function }>();
      const nc = {
        subscribe: (subject: string, opts?: { callback?: Function }) => {
          const sub = { callback: opts?.callback, unsubscribe: () => {} };
          subs.set(subject, sub);
          return sub;
        }
      } as unknown as NatsConnection;
      const matches = (pattern: string, subject: string) =>
        new RegExp(
          `^${pattern.replace(/\./g, "\\.").replace(/\*/g, "[^.]+")}$`
        ).test(subject);
      const send = (subject: string, m: Record<string, unknown>) => {
        for (const [pattern, sub] of subs)
          if (matches(pattern, subject))
            sub.callback!(null, { subject, json: () => m });
      };
      return { nc, send };
    };
    /** A gRPC server stream stand-in: write/end stubs and cancel(). */
    const fakeStream = (ref: string) => {
      const e = new EventEmitter();
      return Object.assign(e, {
        request: { ref },
        write: sandbox.stub(),
        end: sandbox.stub(),
        cancel: () => e.emit("cancelled")
      });
    };
    const events = (ref: string) => `calls.${ref}.events`;
    const media = (ref: string) => `roomr.events.${ref}`;
    const heartbeats = "roomr.nodes.n.heartbeat";

    it("forgets streams whose client went away (x1000)", async function () {
      sandbox.useFakeTimers();
      const { createTrackCallHandler } =
        await import("../../src/calls/createTrackCall");
      const { nc, send } = fakeNats();
      const h = createTrackCallHandler(nc);
      const streams = Array.from({ length: 1000 }, (_, i) =>
        fakeStream(`ref-${i}`)
      );
      for (const s of streams) h.trackCall(s as never);
      expect(h.size()).to.equal(1000);
      for (const s of streams) s.cancel();
      expect(h.size()).to.equal(0);
      // A later status for a gone client is not written anywhere.
      send(events("ref-1"), { ref: "ref-1", status: DialStatus.PROGRESS });
      expect(streams[1].write).to.not.have.been.called;
      h.stop();
    });

    it("keeps serving a first TrackCall when a second one comes for the same call", async function () {
      const clock = sandbox.useFakeTimers();
      const { createTrackCallHandler } =
        await import("../../src/calls/createTrackCall");
      const { nc, send } = fakeNats();
      const h = createTrackCallHandler(nc);
      const ref = "same-ref";
      const first = fakeStream(ref);
      h.trackCall(first as never);
      send(events(ref), { ref, status: DialStatus.TRYING });
      const second = fakeStream(ref);
      h.trackCall(second as never);
      // The second gets the replay; both get what follows; both end on the final.
      send(media(ref), {
        type: "call.answered",
        call_ref: ref,
        node_ref: "n1"
      });
      send(media(ref), {
        type: "call.ended",
        call_ref: ref,
        node_ref: "n1",
        answered: true
      });
      clock.tick(600);
      for (const s of [first, second]) {
        expect(s.write.args.map((a) => a[0].status)).to.deep.equal([
          DialStatus.TRYING,
          DialStatus.ANSWER
        ]);
        expect(s.end).to.have.been.calledOnce;
      }
      expect(h.size()).to.equal(0);
      h.stop();
    });

    it("node.down alone does not fail a call: a draining node keeps its calls and still publishes their events", async function () {
      const clock = sandbox.useFakeTimers();
      const { createTrackCallHandler } =
        await import("../../src/calls/createTrackCall");
      const { nc, send } = fakeNats();
      const h = createTrackCallHandler(nc, { nodeStaleMs: 6000 });
      const ref = "drain-ref";
      const s = fakeStream(ref);
      h.trackCall(s as never);
      send(events(ref), { ref, node_ref: "n1" });
      send(media(ref), {
        type: "call.answered",
        call_ref: ref,
        node_ref: "n1"
      });
      send(heartbeats, { type: "node.down", node_ref: "n2" });
      send(heartbeats, { type: "node.down", node_ref: "n1" });
      expect(s.end).to.not.have.been.called;
      // The call goes on for minutes: its events keep the node "there"; no heartbeats come.
      for (let i = 0; i < 6; i++) {
        clock.tick(4000);
        send(media(ref), {
          type: "participant.joined",
          call_ref: ref,
          node_ref: "n1"
        });
      }
      expect(s.end).to.not.have.been.called;
      expect(
        s.write.args.some((a) => a[0].status === DialStatus.FAILED)
      ).to.equal(false);
      send(media(ref), {
        type: "call.ended",
        call_ref: ref,
        node_ref: "n1",
        answered: true
      });
      clock.tick(600);
      expect(s.end).to.have.been.calledOnce;
      expect(s.write.lastCall.args[0].status).to.not.equal(DialStatus.FAILED);
      expect(h.size()).to.equal(0);
      h.stop();
    });

    it("ends with FAILED when the node says node.down and then stays silent (it exited)", async function () {
      const clock = sandbox.useFakeTimers();
      const { createTrackCallHandler } =
        await import("../../src/calls/createTrackCall");
      const { nc, send } = fakeNats();
      const h = createTrackCallHandler(nc, { nodeStaleMs: 6000 });
      const ref = "exit-ref";
      const s = fakeStream(ref);
      h.trackCall(s as never);
      send(media(ref), {
        type: "call.answered",
        call_ref: ref,
        node_ref: "n1"
      });
      send(heartbeats, { type: "node.down", node_ref: "n1" });
      clock.tick(4000);
      expect(s.end).to.not.have.been.called;
      clock.tick(4000); // past nodeStaleMs since node.down, no events, no heartbeats
      expect(s.write.lastCall.args[0]).to.deep.equal({
        ref,
        status: DialStatus.FAILED,
        hangupCause: CallStatus.SERVICE_UNAVAILABLE
      });
      expect(s.end).to.have.been.calledOnce;
      expect(h.size()).to.equal(0);
      h.stop();
    });

    it("ends with FAILED when the call's Roomr node stops sending heartbeats", async function () {
      const clock = sandbox.useFakeTimers();
      const { createTrackCallHandler } =
        await import("../../src/calls/createTrackCall");
      const { nc, send } = fakeNats();
      const h = createTrackCallHandler(nc, { nodeStaleMs: 6000 });
      const ref = "silent-ref";
      const s = fakeStream(ref);
      h.trackCall(s as never);
      send(media(ref), {
        type: "call.answered",
        call_ref: ref,
        node_ref: "n1"
      });
      for (let i = 0; i < 10; i++) {
        send(heartbeats, { type: "node.heartbeat", node_ref: "n1" });
        clock.tick(2000);
      }
      expect(s.end).to.not.have.been.called; // a live node keeps the stream open
      clock.tick(7000); // killed: no node.down, no more heartbeats
      expect(s.write.lastCall.args[0].status).to.equal(DialStatus.FAILED);
      expect(s.end).to.have.been.calledOnce;
      expect(h.size()).to.equal(0);
      h.stop();
    });

    it("ends with FAILED when no Roomr node ever takes the call, or after maxMs", async function () {
      const clock = sandbox.useFakeTimers();
      const { createTrackCallHandler } =
        await import("../../src/calls/createTrackCall");
      const { nc, send } = fakeNats();
      const h = createTrackCallHandler(nc, { noNodeMs: 30000, maxMs: 60000 });
      const lost = fakeStream("lost-ref"); // the placing replica died before room.create
      h.trackCall(lost as never);
      const long = fakeStream("long-ref");
      h.trackCall(long as never);
      send(events("long-ref"), { ref: "long-ref", node_ref: "n1" });
      const beat = (ms: number) => {
        for (let t = 0; t < ms; t += 2000) {
          send(heartbeats, { type: "node.heartbeat", node_ref: "n1" });
          clock.tick(2000);
        }
      };
      beat(32000);
      expect(lost.write.lastCall.args[0]).to.deep.equal({
        ref: "lost-ref",
        status: DialStatus.FAILED,
        hangupCause: CallStatus.SERVICE_UNAVAILABLE
      });
      expect(lost.end).to.have.been.calledOnce;
      expect(long.end).to.not.have.been.called; // its node is alive
      beat(30000);
      expect(long.write.lastCall.args[0].status).to.equal(DialStatus.FAILED);
      expect(h.size()).to.equal(0);
      h.stop();
    });

    it("call.ended lost while NATS was down: nothing is replayed, the max-duration sweep ends the stream FAILED", async function () {
      // redesign-roomr 4.6: events published during an outage are lost; the control plane does
      // not replay or reconstruct them, its existing sweeps close what they would have closed.
      const clock = sandbox.useFakeTimers();
      const { createTrackCallHandler } =
        await import("../../src/calls/createTrackCall");
      const { nc, send } = fakeNats();
      const h = createTrackCallHandler(nc, { maxMs: 60000 });
      const stream = fakeStream("outage-ref");
      h.trackCall(stream as never);
      send(events("outage-ref"), { ref: "outage-ref", node_ref: "n1" });
      send(media("outage-ref"), {
        type: "call.answered",
        call_ref: "outage-ref",
        node_ref: "n1",
        seq: 3
      });
      // The node keeps running (heartbeats resume after the outage) but call.ended, published
      // during it, never arrives.
      for (let t = 0; t < 62000; t += 2000) {
        send(heartbeats, { type: "node.heartbeat", node_ref: "n1" });
        clock.tick(2000);
      }
      const statuses = stream.write.getCalls().map((c) => c.args[0].status);
      expect(statuses.at(-1)).to.equal(DialStatus.FAILED);
      expect(stream.end).to.have.been.calledOnce;
      expect(h.size()).to.equal(0);
      h.stop();
    });
  });
});
