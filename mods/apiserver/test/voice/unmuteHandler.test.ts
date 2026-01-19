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
import { MuteDirection } from "@fonoster/common";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { getAriStub, getCreateVoiceClient } from "./helper";
import { createUnmuteHandler } from "../../src/voice/handlers/createUnmuteHandler";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const channelId = "channel-id";

describe("@voice/handler/Unmute", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should handle a Unmute command", async function () {
    // Arrange
    const ari = getAriStub(sandbox);

    const createVoiceClient = getCreateVoiceClient(sandbox);

    const unmuteRequest = {
      mediaSessionRef: channelId,
      direction: MuteDirection.BOTH
    };

    // Act
    await createUnmuteHandler(ari, createVoiceClient())(unmuteRequest);

    // Assert
    expect(createVoiceClient().sendResponse).to.have.been.calledOnce;
    expect(ari.channels.unmute).to.have.been.calledOnce;
    expect(ari.channels.unmute).to.have.been.calledWith({
      channelId,
      direction: unmuteRequest.direction
    });
    expect(ari.channels.mute).to.not.have.been.called;
  });
});
