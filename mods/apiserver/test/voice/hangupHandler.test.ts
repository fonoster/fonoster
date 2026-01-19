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
import { createHangupHandler } from "../../src/voice/handlers/createHangupHandler";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const channelId = "channel-id";

describe("@voice/handler/Hangup", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should handle a Hangup command", async function () {
    // Arrange
    const ari = getAriStub(sandbox);

    const createVoiceClient = getCreateVoiceClient(sandbox);

    const hangupRequest = {
      mediaSessionRef: channelId
    };

    // Act
    await createHangupHandler(ari, createVoiceClient())(hangupRequest);

    // Wait for 3 seconds to allow the hangup to complete
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Assert
    expect(createVoiceClient().close).to.have.been.calledOnce;
    expect(ari.channels.hangup).to.have.been.calledOnce;
    expect(ari.channels.hangup).to.have.been.calledWith({ channelId });
  }).timeout(5000);
});
