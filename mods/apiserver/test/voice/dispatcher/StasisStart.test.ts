/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { getAriStub } from "./helper";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const channelId = "channel-id";

describe("@voice/dispatcher/StasisStart", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should handle a StasisStart event", async function () {
    // Arrange
    const { VoiceDispatcher } = await import(
      "../../../src/voice/VoiceDispatcher"
    );

    const ari = getAriStub(sandbox);

    const createVoiceClient = sandbox.stub().returns({
      connect: sandbox.stub(),
      on: sandbox.stub(),
      config: {
        sessionId: channelId
      }
    });

    const voiceDispatcher = new VoiceDispatcher(ari, createVoiceClient);

    const event = {
      channel: {
        id: channelId,
        caller: {
          name: "John Doe",
          number: "+17853178070"
        }
      }
    };

    const channel = {
      id: channelId,
      getChannelVar: sandbox.stub().resolves({ value: "value" }),
      Channel: sandbox.stub(),
      originate: sandbox.stub(),
      on: sandbox.stub(),
      hangup: sandbox.stub()
    };

    // Act
    await voiceDispatcher.handleStasisStart(event, channel);

    // Assert
    expect(createVoiceClient).to.have.been.calledOnce;
    expect(voiceDispatcher.voiceClients.get(channelId)).to.exist;
    expect(createVoiceClient().connect).to.have.been.calledOnce;
  });
});
