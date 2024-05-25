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
import { ChannelVar } from "../../src/voice/types";
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
      createAppToken: sandbox.stub().resolves("session-token"),
      getApp: sandbox.stub().resolves({
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
        .resolves({ value: "ingress-number" })
        .onSecondCall()
        .resolves({ value: "{}" })
        .onThirdCall()
        .resolves({ value: "app-ref" })
    };

    // Act
    const voiceClient = await createVoiceClient(sdk)(event, channel);

    // Assert
    expect(voiceClient).to.be.an.instanceOf(VoiceClientImpl);
    expect(sdk.createAppToken).to.have.been.calledOnceWith("app-ref");
    expect(sdk.getApp).to.have.been.calledOnceWith("app-ref");
    expect(channel.getChannelVar).to.have.been.calledThrice;
    expect(channel.getChannelVar).to.have.been.calledWith({
      channelId,
      variable: ChannelVar.APP_REF
    });
    expect(channel.getChannelVar).to.have.been.calledWith({
      channelId,
      variable: ChannelVar.METADATA
    });
    expect(channel.getChannelVar).to.have.been.calledWith({
      channelId,
      variable: ChannelVar.INGRESS_NUMBER
    });
  });
});
