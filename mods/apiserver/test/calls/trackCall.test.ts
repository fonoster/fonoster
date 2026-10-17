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
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
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

  it("translates the media node's call events on calls.<ref>.events", async function () {
    const clock = sandbox.useFakeTimers();
    const { createTrackCall, toTrackMessage } =
      await import("../../src/calls/createTrackCall");
    const callRef = "0f6c2a51-7d4e-4b8a-9c3f-2e1d5a6b7c8d";
    const subject = `calls.${callRef}.events`;
    const subscription = { callback: sandbox.stub() };
    const nc = {
      subscribe: sandbox.stub().returns(subscription)
    } as unknown as NatsConnection;
    const trackCall = createTrackCall(nc);
    expect((nc.subscribe as sinon.SinonStub).firstCall.args[0]).to.equal(
      "calls.*.events"
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
    send({ type: "call.progress", status: "ringing", roomRef: "r1" });
    send({ type: "participant.joined", roomRef: "r1" }); // not a call status
    send({ type: "call.answered", callRef, roomRef: "r1" });
    send({ type: "room.ended", reason: "callee_hangup", roomRef: "r1" });
    clock.tick(600);
    expect(call.write.args.map((a) => a[0])).to.deep.equal([
      { ref: callRef, status: DialStatus.TRYING },
      { ref: callRef, status: DialStatus.PROGRESS },
      { ref: callRef, status: DialStatus.ANSWER }
    ]);
    expect(call.end).to.have.been.calledOnce;

    expect(
      toTrackMessage({ type: "call.progress", status: "busy", callRef })
    ).to.deep.equal({ ref: callRef, status: DialStatus.BUSY });
    expect(
      toTrackMessage({ type: "call.progress", status: "no_answer" }, subject)
    ).to.deep.equal({ ref: callRef, status: DialStatus.NOANSWER });
    expect(toTrackMessage({ type: "dtmf", digit: "5" }, subject)).to.equal(
      undefined
    );
  });
});
