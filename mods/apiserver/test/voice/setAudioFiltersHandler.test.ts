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
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { struct } from "pb-util";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { createSetAudioFiltersHandler } from "../../src/voice/handlers/createSetAudioFiltersHandler";
import { VoiceClient } from "../../src/voice/types";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const mediaSessionRef = "mediaSessionRef";

function getVoiceClient(setAudioFilters = sandbox.stub().resolves()) {
  return {
    setAudioFilters,
    sendResponse: sandbox.stub()
  } as unknown as VoiceClient & {
    setAudioFilters: ReturnType<typeof sandbox.stub>;
    sendResponse: ReturnType<typeof sandbox.stub>;
  };
}

describe("@voice/handler/SetAudioFilters", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should apply the filters and confirm to the application", async function () {
    // Arrange
    const voiceClient = getVoiceClient();

    // Act
    await createSetAudioFiltersHandler(voiceClient)({
      mediaSessionRef,
      filters: [
        {
          name: "aiCoustics",
          options: struct.encode({ enhancementLevel: 0.8 })
        }
      ]
    } as never);

    // Assert: the struct is decoded back to plain options
    expect(voiceClient.setAudioFilters).to.have.been.calledOnceWith([
      { name: "aiCoustics", options: { enhancementLevel: 0.8 } }
    ]);
    expect(voiceClient.sendResponse).to.have.been.calledOnceWith({
      setAudioFiltersResponse: { mediaSessionRef }
    });
  });

  it("should treat a missing list as clearing the filters", async function () {
    // Arrange
    const voiceClient = getVoiceClient();

    // Act
    await createSetAudioFiltersHandler(voiceClient)({
      mediaSessionRef
    } as never);

    // Assert
    expect(voiceClient.setAudioFilters).to.have.been.calledOnceWith([]);
  });

  it("should report a failure without throwing, so the call survives", async function () {
    // Arrange
    const voiceClient = getVoiceClient(
      sandbox.stub().rejects(new Error('Unknown audio filter "nope"'))
    );

    // Act
    await expect(
      createSetAudioFiltersHandler(voiceClient)({
        mediaSessionRef,
        filters: [{ name: "nope" }]
      } as never)
    ).to.be.fulfilled;

    // Assert
    expect(voiceClient.sendResponse).to.have.been.calledOnceWith({
      setAudioFiltersResponse: {
        mediaSessionRef,
        error: 'Unknown audio filter "nope"'
      }
    });
  });

  it("should answer a malformed request instead of leaving it hanging", async function () {
    // Arrange: an unanswered verb strands the application's await for the
    // rest of the call
    const voiceClient = getVoiceClient();

    // Act
    await createSetAudioFiltersHandler(voiceClient)({
      mediaSessionRef,
      filters: [{ name: "" }]
    } as never);

    // Assert
    expect(voiceClient.setAudioFilters).to.not.have.been.called;
    expect(voiceClient.sendResponse).to.have.been.calledOnce;
    const response = voiceClient.sendResponse.firstCall.args[0];
    expect(response.setAudioFiltersResponse.mediaSessionRef).to.equal(
      mediaSessionRef
    );
    expect(response.setAudioFiltersResponse.error).to.match(/name/i);
  });

  it("should answer when the request has no session reference", async function () {
    // Arrange
    const voiceClient = getVoiceClient();

    // Act
    await createSetAudioFiltersHandler(voiceClient)({} as never);

    // Assert
    expect(voiceClient.sendResponse).to.have.been.calledOnce;
  });
});
