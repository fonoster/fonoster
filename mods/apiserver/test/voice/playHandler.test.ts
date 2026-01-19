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
import sinon, { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { getAriStub, getCreateVoiceClient } from "./helper";
import { createPlayHandler } from "../../src/voice/handlers/createPlayHandler";
import { AriEvent } from "../../src/voice/types";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const channelId = "channel-id";

describe("@voice/handler/Play", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should handle a Play command", async function () {
    // Arrange
    const ari = getAriStub(sandbox);

    const onStub = ari.on as sinon.SinonStub;

    onStub.withArgs(AriEvent.PLAYBACK_FINISHED).callsFake((_, cb) => {
      cb({}, { id: playRequest.playbackRef });
    });

    const createVoiceClient = getCreateVoiceClient(sandbox);

    const playRequest = {
      playbackRef: "playbackRef",
      mediaSessionRef: channelId,
      url: "url"
    };

    // Act
    await createPlayHandler(ari, createVoiceClient())(playRequest);

    // Assert
    expect(ari.channels.play).to.have.been.calledOnce;
    expect(createVoiceClient().sendResponse).to.have.been.calledOnce;
    expect(createVoiceClient().sendResponse).to.have.been.calledWith({
      playResponse: {
        playbackRef: playRequest.playbackRef,
        mediaSessionRef: playRequest.mediaSessionRef
      }
    });
    expect(ari.channels.play).to.have.been.calledWith({
      channelId,
      media: `sound:${playRequest.url}`,
      playbackId: playRequest.playbackRef
    });
  });
});
