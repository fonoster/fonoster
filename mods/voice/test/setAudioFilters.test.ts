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
import { StreamEvent } from "@fonoster/common";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox, SinonSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { getVoiceObject, mediaSessionRef, voiceRequest } from "./helpers";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

// Like getVoiceObject, but the response carries a payload as well as content
function getVoiceObjectWithPayload(
  s: SinonSandbox,
  payload: Record<string, unknown>
) {
  const onStub = s.stub().callsFake((event, cb) => {
    if (event === StreamEvent.DATA) {
      cb({ content: "setAudioFiltersResponse", ...payload });
    }
  });

  return {
    removeListener: s.stub(),
    on: onStub,
    once: onStub,
    write: s.stub(),
    end: s.stub()
  };
}

describe("@voice/verbs/setAudioFilters", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should send the requested filters", async function () {
    // Arrange
    const voice = getVoiceObject(sandbox, "setAudioFiltersResponse");
    const { SetAudioFilters } = await import("../src/verbs");
    const filters = [
      { name: "aiCoustics", options: { enhancementLevel: 0.8 } }
    ];

    // Act
    await new SetAudioFilters(voiceRequest, voice).run({
      mediaSessionRef,
      filters
    });

    // Assert
    expect(voice.write).to.have.been.calledOnceWith({
      setAudioFiltersRequest: { mediaSessionRef, filters }
    });
  });

  it("should allow an empty list to clear the filters", async function () {
    // Arrange
    const voice = getVoiceObject(sandbox, "setAudioFiltersResponse");
    const { SetAudioFilters } = await import("../src/verbs");

    // Act
    await new SetAudioFilters(voiceRequest, voice).run({
      mediaSessionRef,
      filters: []
    });

    // Assert
    expect(voice.write).to.have.been.calledOnceWith({
      setAudioFiltersRequest: { mediaSessionRef, filters: [] }
    });
  });

  it("should reject a filter without a name", async function () {
    // Arrange
    const voice = getVoiceObject(sandbox, "setAudioFiltersResponse");
    const { SetAudioFilters } = await import("../src/verbs");

    // Act & Assert
    await expect(
      new SetAudioFilters(voiceRequest, voice).run({
        mediaSessionRef,
        filters: [{ name: "" }]
      })
    ).to.be.rejected;
    expect(voice.write).to.not.have.been.called;
  });

  describe("VoiceResponse.setAudioFilters", function () {
    it("should encode options as a struct", async function () {
      // Arrange
      const voice = getVoiceObject(sandbox, "setAudioFiltersResponse");
      const { VoiceResponse } = await import("../src/VoiceResponse");
      const { aiCoustics } = await import("../src/filters");

      // Act
      await new VoiceResponse(voiceRequest, voice).setAudioFilters([
        aiCoustics({ enhancementLevel: 0.8 })
      ]);

      // Assert
      const written = voice.write.firstCall.args[0].setAudioFiltersRequest;
      expect(written.filters[0].name).to.equal("aiCoustics");
      expect(written.filters[0].options).to.have.property("fields");
    });

    it("should throw when the media server refuses the filters", async function () {
      // Arrange
      const voice = getVoiceObjectWithPayload(sandbox, {
        setAudioFiltersResponse: {
          mediaSessionRef,
          error: 'Unknown audio filter "nope"'
        }
      });
      const { VoiceResponse } = await import("../src/VoiceResponse");

      // Act & Assert
      await expect(
        new VoiceResponse(voiceRequest, voice).setAudioFilters([
          { name: "nope" }
        ])
      ).to.be.rejectedWith(/Unknown audio filter/);
    });

    it("should resolve when the filters are applied", async function () {
      // Arrange
      const voice = getVoiceObjectWithPayload(sandbox, {
        setAudioFiltersResponse: { mediaSessionRef }
      });
      const { VoiceResponse } = await import("../src/VoiceResponse");

      // Act & Assert
      await expect(
        new VoiceResponse(voiceRequest, voice).setAudioFilters([
          { name: "aiCoustics" }
        ])
      ).to.be.fulfilled;
    });
  });

  describe("aiCoustics helper", function () {
    it("should name the filter and pass options through", async function () {
      const { aiCoustics } = await import("../src/filters");

      expect(aiCoustics({ enhancementLevel: 0.5 })).to.deep.equal({
        name: "aiCoustics",
        options: { enhancementLevel: 0.5 }
      });
      expect(aiCoustics()).to.deep.equal({ name: "aiCoustics", options: {} });
    });
  });
});
