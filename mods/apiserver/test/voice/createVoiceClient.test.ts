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
import { VoiceClientImpl } from "../../src/voice/VoiceClientImpl";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const channelId = "channel-id";

describe("@voice/createVoiceClient", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a voice client", async function () {
    // Arrange
    const { createVoiceClient } = await import(
      "../../src/voice/createVoiceClient"
    );

    const sdk = {
      getAppToken: sandbox.stub().resolves("session-token"),
      getAppByNumber: sandbox.stub().resolves({
        ref: "app-ref",
        accessKeyId: "access-key-id",
        endpoint: "app-endpoint"
      })
    };

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
      getChannelVar: sandbox
        .stub()
        .onFirstCall()
        .resolves({ value: "caller-number" })
        .onSecondCall()
        .resolves({ value: "app-ref" })
        .onThirdCall()
        .resolves({ value: "app-endpoint" })
        .onCall(3)
        .resolves({ value: "{}" })
    };

    // Act
    const voiceClient = await createVoiceClient(sdk)(event, channel);

    // Assert
    expect(voiceClient).to.be.an.instanceOf(VoiceClientImpl);
    expect(sdk.getAppToken).to.have.been.calledOnceWith({
      accessKeyId: "access-key-id"
    });
    expect(sdk.getAppByNumber).to.have.been.calledOnceWith("caller-number");
    expect(channel.getChannelVar).to.have.been.called.callCount(4);
    expect(channel.getChannelVar).to.have.been.calledWith({
      channelId,
      variable: "INGRESS_NUMBER"
    });
    expect(channel.getChannelVar).to.have.been.calledWith({
      channelId,
      variable: "APP_REF"
    });
    expect(channel.getChannelVar).to.have.been.calledWith({
      channelId,
      variable: "APP_ENDPOINT"
    });
    expect(channel.getChannelVar).to.have.been.calledWith({
      channelId,
      variable: "METADATA"
    });
  });
});
