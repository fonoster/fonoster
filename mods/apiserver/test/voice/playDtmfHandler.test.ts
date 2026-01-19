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
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { getAriStub, getCreateVoiceClient } from "./helper";
import { createPlayDtmfHandler } from "../../src/voice/handlers/createPlayDtmfHandler";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const channelId = "channel-id";

describe("@voice/handler/PlayDtmf", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should handle a PlayDtmf command", async function () {
    // Arrange
    const ari = getAriStub(sandbox);

    const createVoiceClient = getCreateVoiceClient(sandbox);

    const playDtmfRequest = {
      mediaSessionRef: channelId,
      digits: "123"
    };

    // Act
    await createPlayDtmfHandler(ari, createVoiceClient())(playDtmfRequest);

    // Assert
    expect(ari.channels.sendDTMF).to.have.been.calledOnce;
    expect(createVoiceClient().sendResponse).to.have.been.calledOnce;
    expect(createVoiceClient().sendResponse).to.have.been.calledWith({
      playDtmfResponse: {
        mediaSessionRef: channelId
      }
    });
    expect(ari.channels.sendDTMF).to.have.been.calledWith({
      channelId,
      dtmf: playDtmfRequest.digits
    });
  });
});
