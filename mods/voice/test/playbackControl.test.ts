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
  PlaybackControlAction,
  PlaybackControlRequest
} from "@fonoster/common";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox, match } from "sinon";
import sinonChai from "sinon-chai";
import { getVoiceObject, mediaSessionRef, voiceRequest } from "./helpers";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@voice/verbs/playbackControl", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should control the media of a call", async function () {
    // Arrange
    const { PlaybackControl } = await import("../src/verbs");

    const voice = getVoiceObject(sandbox, "playbackControlResponse");

    const playbackControl = new PlaybackControl(voiceRequest, voice);

    const playbackControlRequest: PlaybackControlRequest = {
      mediaSessionRef,
      playbackRef: "848b8803-7106-48b7-b820-515b05c40d6b",
      action: PlaybackControlAction.STOP
    };

    // Act
    await playbackControl.run(playbackControlRequest);

    // Assert
    expect(voice.removeListener).to.have.been.calledOnce;
    expect(voice.on).to.have.been.calledOnce;
    expect(voice.on).to.have.been.calledWith("data", match.func);
    expect(voice.write).to.have.been.calledOnce;
    expect(voice.write).to.have.been.calledWith({
      playbackControlRequest
    });
  });

  it("should throw an error if the request is invalid", async function () {
    // Arrange
    const { PlaybackControl } = await import("../src/verbs");

    const voice = getVoiceObject(sandbox, "playbackControlResponse");

    const playbackControl = new PlaybackControl(voiceRequest, voice);

    // Act
    const promise = playbackControl.run({
      invalid: "data"
    } as unknown as PlaybackControlRequest);

    // Assert
    // eslint-disable-next-line prettier/prettier
    return expect(promise).to.be.rejectedWith("Required at \"playbackRef\"; Invalid playback control action at \"action\"");
  });
});
