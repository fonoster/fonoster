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
import { Channel, Client, StasisStart } from "ari-client";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { CreateContainer } from "../../src/voice/integrations/types";
import { AbstractTextToSpeech } from "../../src/voice/tts/AbstractTextToSpeech";
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
    const { makeCreateVoiceClient } = await import(
      "../../src/voice/makeCreateVoiceClient"
    );

    const createContainer = async (appRef: string) => {
      return {
        ref: appRef,
        accessKeyId: "access-key-id",
        appEndpoint: "app-endpoint",
        tts: {} as unknown as AbstractTextToSpeech<unknown>,
        stt: {} as unknown as AbstractTextToSpeech<unknown>
      };
    };

    const event = {
      channel: {
        id: channelId,
        caller: {
          name: "John Doe",
          number: "+17853178070"
        }
      }
    } as unknown as StasisStart;

    const channel = {
      id: channelId,
      originate: sandbox.stub(),
      hangup: sandbox.stub(),
      on: sandbox.stub(),
      getChannelVar: sandbox
        .stub()
        .onFirstCall()
        .resolves({ value: "app-ref" })
        .onSecondCall()
        .resolves({ value: "ingress-number" })
        .onThirdCall()
        .resolves({ value: "{}" })
    } as unknown as Channel;

    // Act
    const voiceClient = await makeCreateVoiceClient(
      createContainer as unknown as CreateContainer
    )({
      ari: {} as Client,
      event,
      channel
    });

    // Assert
    expect(voiceClient).to.be.an.instanceOf(VoiceClientImpl);
    expect(channel.getChannelVar).to.have.been.calledThrice;
    expect(channel.getChannelVar).to.have.been.calledWith({
      variable: ChannelVar.APP_REF
    });
    expect(channel.getChannelVar).to.have.been.calledWith({
      variable: ChannelVar.METADATA
    });
    expect(channel.getChannelVar).to.have.been.calledWith({
      variable: ChannelVar.INGRESS_NUMBER
    });
  });
});