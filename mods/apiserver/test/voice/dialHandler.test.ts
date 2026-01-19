/* eslint-disable new-cap */
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
import {
  DialRecordDirection,
  DialStatus,
  STASIS_APP_NAME
} from "@fonoster/common";
import { Bridge, Client } from "ari-client";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon, { createSandbox, match } from "sinon";
import sinonChai from "sinon-chai";
import { getAriStub, getCreateVoiceClient } from "./helper";
import { mediaSessionRef } from "@fonoster/voice/test/helpers";
import { ASTERISK_SYSTEM_DOMAIN, ASTERISK_TRUNK } from "../../src/envs";
import { createHandleDialEventsWithVoiceClient } from "../../src/utils";
import { createDialHandler } from "../../src/voice/handlers/dial/createDialHandler";
import { handleChannelLeftBridge } from "../../src/voice/handlers/dial/handleChannelLeftBridge";
import { handleStasisStart } from "../../src/voice/handlers/dial/handleStasisStart";
import { AriEvent, VoiceClient } from "../../src/voice/types";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@voice/handler/Dial", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should dial a number", async function () {
    // Arrange
    const ari = getAriStub(sandbox);
    const createVoiceClient = getCreateVoiceClient(sandbox);

    const request = {
      mediaSessionRef: "mediaSessionRef",
      destination: "destination",
      timeout: 30
    };

    await createDialHandler(ari, createVoiceClient())(request);

    const channelStub = ari.Channel as unknown as sinon.SinonStub;

    expect(ari.bridges.create).to.have.been.calledOnce;
    expect(ari.Channel).to.have.been.calledOnce;
    expect(channelStub.returnValues[0].originate).to.have.been.calledOnce;
    expect(channelStub.returnValues[0].originate).to.have.been.calledWith({
      app: STASIS_APP_NAME,
      endpoint: `PJSIP/${ASTERISK_TRUNK}/sip:${request.destination}@${ASTERISK_SYSTEM_DOMAIN}`,
      timeout: request.timeout,
      variables: {
        "PJSIP_HEADER(add,X-Call-Ref)": match.string,
        "PJSIP_HEADER(add,X-Dod-Number)": "value",
        "PJSIP_HEADER(add,X-Is-Api-Originated-Type)": "true"
      }
    });
    expect(channelStub.returnValues[0].once).to.have.been.calledWith(
      AriEvent.STASIS_START
    );
    expect(channelStub.returnValues[0].once).to.have.been.calledWith(
      AriEvent.CHANNEL_LEFT_BRIDGE
    );
    expect(channelStub.returnValues[0].once).to.have.been.calledWith(
      AriEvent.STASIS_END
    );
    expect(channelStub.returnValues[0].on).to.have.been.calledWith(
      AriEvent.DIAL
    );
    expect(createVoiceClient().sendResponse).to.have.been.calledWith({
      dialResponse: {
        status: DialStatus.TRYING
      }
    });
  });

  it("should handle channel left bridge", async function () {
    // Arrange
    const ari = getAriStub(sandbox);

    const bridge = {
      addChannel: sandbox.stub(),
      destroy: sandbox.stub()
    } as unknown as Bridge;

    const dialed = ari.Channel();

    // Act
    await handleChannelLeftBridge({ bridge, dialed })();

    // Assert
    expect(dialed.hangup).to.have.been.calledOnce;
    expect(bridge.destroy).to.have.been.calledOnce;
  });

  it("should handle dial events (Channel Unavailable)", async function () {
    // Arrange
    const voiceClient = {
      sendResponse: sandbox.stub()
    };

    const event = {
      dialstatus: "CHANUNAVAIL"
    };

    // Act
    await createHandleDialEventsWithVoiceClient(
      voiceClient as unknown as VoiceClient
    )(event);

    // Assert
    expect(voiceClient.sendResponse).to.have.been.calledOnce;
    expect(voiceClient.sendResponse).to.have.been.calledWith({
      dialResponse: {
        status: DialStatus.FAILED
      }
    });
  });

  it("should handle dial events (Progress)", async function () {
    // Arrange
    const voiceClient = {
      sendResponse: sandbox.stub()
    };

    const event = {
      dialstatus: "PROGRESS"
    };

    // Act
    await createHandleDialEventsWithVoiceClient(
      voiceClient as unknown as VoiceClient
    )(event);

    // Assert
    expect(voiceClient.sendResponse).to.have.been.calledOnce;
    expect(voiceClient.sendResponse).to.have.been.calledWith({
      dialResponse: {
        status: DialStatus.PROGRESS
      }
    });
  });

  it("should handle dial events (Ignore event)", async function () {
    // Arrange
    const voiceClient = {
      sendResponse: sandbox.stub()
    };

    const event = {
      dialstatus: "X"
    };

    // Act
    await createHandleDialEventsWithVoiceClient(
      voiceClient as unknown as VoiceClient
    )(event);

    // Assert
    expect(voiceClient.sendResponse).to.not.have.been.called;
  });

  it("should handle stasis start", async function () {
    // Arrange
    const ari = getAriStub(sandbox) as unknown as Client;

    const request = {
      mediaSessionRef,
      recordDirection: DialRecordDirection.IN,
      destination: "destination"
    };

    const bridge = {
      addChannel: sandbox.stub()
    } as unknown as Bridge;

    const dialed = ari.Channel();

    // Act
    await handleStasisStart({ ari, request, bridge, dialed })(
      undefined,
      ari.Channel()
    );

    // Assert
    expect(bridge.addChannel).to.have.been.calledOnce;
    expect(bridge.addChannel).to.have.been.calledWith({ channel: dialed.id });
    expect(dialed.hangup).to.not.have.been.called;
  });
});
