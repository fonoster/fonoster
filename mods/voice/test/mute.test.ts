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
import { MuteDirection, MuteRequest, StreamEvent } from "@fonoster/common";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox, match } from "sinon";
import sinonChai from "sinon-chai";
import { getVoiceObject, mediaSessionRef, voiceRequest } from "./helpers";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@voice/verbs/mute", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should mute a channel", async function () {
    // Arrange
    const { Mute } = await import("../src/verbs");

    const voice = getVoiceObject(sandbox, "muteResponse");

    const mute = new Mute(voiceRequest, voice);

    const muteRequest: MuteRequest = {
      mediaSessionRef,
      direction: MuteDirection.IN
    };

    // Act
    await mute.run(muteRequest);

    // Assert
    expect(voice.removeListener).to.have.been.calledOnce;
    expect(voice.on).to.have.been.calledOnce;
    expect(voice.on).to.have.been.calledWith(StreamEvent.DATA, match.func);
    expect(voice.write).to.have.been.calledOnce;
    expect(voice.write).to.have.been.calledWith({
      muteRequest
    });
  });

  it("should throw an error if the request is invalid", async function () {
    // Arrange
    const { Mute } = await import("../src/verbs");

    const voice = getVoiceObject(sandbox, "muteResponse");

    const mute = new Mute(voiceRequest, voice);

    // Act
    const promise = mute.run({ direction: "south" } as unknown as MuteRequest);

    // Assert
    // eslint-disable-next-line prettier/prettier
    return expect(promise).to.be.rejectedWith("Invalid enum value. Expected 'IN' | 'OUT' | 'BOTH', received 'south' at \"direction\"");
  });
});
