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
import { getAriStub, getCreateVoiceClient } from "./helper";
import { playHandler } from "../../../src/voice/handlers/Play";
import { AriEvent } from "../../../src/voice/types";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const channelId = "channel-id";

describe("@voice/dispatcher/Play", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should handle a Play command", async function () {
    // Arrange
    const ari = getAriStub(sandbox);
    ari.on.withArgs(AriEvent.PLAYBACK_FINISHED).callsFake((_, cb) => {
      cb({}, { id: playRequest.playbackRef });
    });

    const createVoiceClient = getCreateVoiceClient(sandbox);

    const playRequest = {
      playbackRef: "playbackRef",
      sessionRef: channelId,
      url: "url"
    };

    // Act
    await playHandler(ari, createVoiceClient())(playRequest);

    // Assert
    expect(ari.channels.play).to.have.been.calledOnce;
    expect(createVoiceClient().sendResponse).to.have.been.calledOnce;
    expect(createVoiceClient().sendResponse).to.have.been.calledWith({
      playResponse: {
        playbackRef: playRequest.playbackRef,
        sessionRef: playRequest.sessionRef
      }
    });
    expect(ari.channels.play).to.have.been.calledWith({
      channelId,
      media: `sound:${playRequest.url}`,
      playbackId: playRequest.playbackRef
    });
  });
});
