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
import type { Channel, Dial } from "ari-client";
import { NatsConnection } from "nats";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { getAriStub } from "../voice/helper";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const CALL_REF = "c21ff1ab-5b46-4d99-8879-fad1e1d02d0a";
const CHANNEL_ID = "df561aee-dcc1-44f4-a3c0-6caa09f2be0a";

// A NATS double that delivers whatever is published straight back to the
// subscriber, so the publisher and the subscriber run as one path.
const createLoopbackNats = () => {
  const subscription = { callback: (_err: unknown, _msg: unknown) => {} };
  const publish = sandbox
    .stub()
    .callsFake((_subject: string, payload: string) => {
      subscription.callback(null, { json: () => JSON.parse(payload) });
    });

  return {
    publish,
    subscribe: sandbox.stub().returns(subscription)
  } as unknown as NatsConnection & { publish: sinon.SinonStub };
};

const createChannel = (callRef?: string) =>
  ({
    id: CHANNEL_ID,
    getChannelVar: sandbox
      .stub()
      .callsFake(async ({ variable }: { variable: string }) => {
        if (variable === "CALL_REF" && callRef) {
          return { value: callRef };
        }
        throw new Error(`channel variable ${variable} not set`);
      })
  }) as unknown as Channel;

describe("@calls/trackCall for API-originated calls", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("delivers dial events to the stream registered by TrackCall", async function () {
    // Arrange
    const { createTrackCall } = await import("../../src/calls/createTrackCall");
    const { VoiceDispatcher } = await import("../../src/voice/VoiceDispatcher");

    const nc = createLoopbackNats();
    const call = {
      write: sandbox.stub(),
      end: sandbox.stub(),
      request: { ref: CALL_REF }
    };

    const trackCall = createTrackCall(nc);
    trackCall(call, () => {});

    const voiceDispatcher = new VoiceDispatcher(
      getAriStub(sandbox),
      nc,
      sandbox.stub()
    );

    // Act
    await voiceDispatcher.handleDial(
      { dialstatus: "PROGRESS" } as unknown as Dial,
      createChannel(CALL_REF)
    );

    // Assert
    expect(call.write).to.have.been.calledOnceWith({
      ref: CALL_REF,
      status: DialStatus.PROGRESS
    });
  });

  it("stops tracking the call after a final dial status", async function () {
    // Arrange
    const { createTrackCall } = await import("../../src/calls/createTrackCall");
    const { VoiceDispatcher } = await import("../../src/voice/VoiceDispatcher");

    const nc = createLoopbackNats();
    const call = {
      write: sandbox.stub(),
      end: sandbox.stub(),
      request: { ref: CALL_REF }
    };

    createTrackCall(nc)(call, () => {});

    const voiceDispatcher = new VoiceDispatcher(
      getAriStub(sandbox),
      nc,
      sandbox.stub()
    );

    // Act
    await voiceDispatcher.handleDial(
      { dialstatus: "BUSY" } as unknown as Dial,
      createChannel(CALL_REF)
    );

    // Assert
    expect(call.write).to.have.been.calledOnceWith({
      ref: CALL_REF,
      status: DialStatus.BUSY
    });

    await voiceDispatcher.handleDial(
      { dialstatus: "PROGRESS" } as unknown as Dial,
      createChannel(CALL_REF)
    );

    expect(call.write).to.have.been.calledOnce;
  });

  it("publishes nothing for a channel without a call ref", async function () {
    // Arrange
    const { VoiceDispatcher } = await import("../../src/voice/VoiceDispatcher");

    const nc = createLoopbackNats();
    const voiceDispatcher = new VoiceDispatcher(
      getAriStub(sandbox),
      nc,
      sandbox.stub()
    );

    // Act
    await voiceDispatcher.handleDial(
      { dialstatus: "PROGRESS" } as unknown as Dial,
      createChannel()
    );

    // Assert
    expect(nc.publish).to.not.have.been.called;
  });
});
