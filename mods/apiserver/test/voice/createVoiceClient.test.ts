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
import { AmdStatus } from "@fonoster/common";
import { Channel, Client, StasisStart } from "ari-client";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { CreateContainer } from "../../src/voice/integrations/types";
import { AbstractTextToSpeech } from "../../src/voice/tts/AbstractTextToSpeech";
import { ChannelVar } from "../../src/voice/types";
import { VoiceClientImpl } from "../../src/voice/client/VoiceClientImpl";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const channelId = "channel-id";

const createContainer = async (appRef: string) => {
  return {
    ref: appRef,
    accessKeyId: "access-key-id",
    endpoint: "app-endpoint",
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

// Stubs getChannelVar by variable name rather than by call order, so a caller
// reading an extra variable doesn't shift every other answer.
function getChannelStub(vars: Partial<Record<ChannelVar, string>>) {
  const getChannelVar = sandbox.stub().resolves(undefined);

  Object.entries(vars).forEach(([variable, value]) => {
    getChannelVar.withArgs({ variable }).resolves({ value });
  });

  return {
    id: channelId,
    originate: sandbox.stub(),
    hangup: sandbox.stub(),
    on: sandbox.stub(),
    getChannelVar
  } as unknown as Channel;
}

const defaultVars = {
  [ChannelVar.CALL_DIRECTION]: "from-pstn",
  [ChannelVar.APP_REF]: "app-ref",
  [ChannelVar.INGRESS_NUMBER]: "ingress-number",
  [ChannelVar.CALL_REF]: "call-ref-from-api",
  [ChannelVar.METADATA]: "{}"
};

// AMD only ever runs on outbound calls, so the verdict is only read there.
const outboundVars = {
  [ChannelVar.CALL_DIRECTION]: "peer-to-pstn",
  [ChannelVar.APP_REF]: "app-ref",
  [ChannelVar.INGRESS_NUMBER]: "ingress-number",
  [ChannelVar.CALL_REF]: "call-ref-from-api",
  [ChannelVar.METADATA]: "{}"
};

function createVoiceClient(channel: Channel) {
  return import("../../src/voice/createCreateVoiceClient").then(
    ({ createCreateVoiceClient }) =>
      createCreateVoiceClient(createContainer as unknown as CreateContainer)({
        ari: {} as Client,
        event,
        channel
      })
  );
}

describe("@voice/createVoiceClient", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a voice client", async function () {
    // Arrange
    const channel = getChannelStub(defaultVars);

    // Act
    const voiceClient = await createVoiceClient(channel);

    // Assert
    expect(voiceClient).to.be.an.instanceOf(VoiceClientImpl);
    [
      ChannelVar.APP_REF,
      ChannelVar.METADATA,
      ChannelVar.INGRESS_NUMBER,
      ChannelVar.CALL_DIRECTION,
      ChannelVar.CALL_REF
    ].forEach((variable) => {
      expect(channel.getChannelVar).to.have.been.calledWith({ variable });
    });
  });

  it("should carry the Answering Machine Detection verdict on the config", async function () {
    // Arrange
    const channel = getChannelStub({
      ...outboundVars,
      [ChannelVar.AMD_STATUS]: "MACHINE",
      [ChannelVar.AMD_CAUSE]: "INITIALSILENCE-2500-2500"
    });

    // Act
    const voiceClient = await createVoiceClient(channel);

    // Assert
    expect(voiceClient.config.amd).to.deep.include({
      status: AmdStatus.MACHINE,
      confidence: 1,
      detector: "asterisk-amd@1"
    });
  });

  it("should cache the verdict and its cause for the call's CDR", async function () {
    // Arrange
    const { amdResultCache } = await import("../../src/events/amdResultCache");
    const channel = getChannelStub({
      ...outboundVars,
      [ChannelVar.AMD_STATUS]: "HUMAN",
      [ChannelVar.AMD_CAUSE]: "HUMAN-800-800"
    });

    // Act
    await createVoiceClient(channel);

    // Assert
    expect(amdResultCache.get("call-ref-from-api")).to.deep.include({
      status: AmdStatus.HUMAN,
      cause: "HUMAN-800-800"
    });
  });

  it("should omit amd when AMD did not run for the call", async function () {
    // Arrange
    const channel = getChannelStub(outboundVars);

    // Act
    const voiceClient = await createVoiceClient(channel);

    // Assert
    expect(voiceClient.config.amd).to.be.undefined;
  });

  it("should not look for a verdict on an inbound call", async function () {
    // Arrange
    const channel = getChannelStub({
      ...defaultVars,
      [ChannelVar.AMD_STATUS]: "MACHINE"
    });

    // Act
    const voiceClient = await createVoiceClient(channel);

    // Assert
    expect(voiceClient.config.amd).to.be.undefined;
    expect(channel.getChannelVar).to.not.have.been.calledWith({
      variable: ChannelVar.AMD_STATUS
    });
  });
});
