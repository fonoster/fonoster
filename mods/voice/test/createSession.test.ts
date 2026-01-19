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
import { StreamEvent } from "@fonoster/common";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox, match } from "sinon";
import sinonChai from "sinon-chai";
import { mediaSessionRef, voiceRequest } from "./helpers";
import { VoiceRequest } from "../src/types";
import { VoiceResponse } from "../src/VoiceResponse";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@voice/createSession", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a session", async function () {
    const callbackResponses = [
      { answerResponse: { mediaSessionRef }, content: "answerResponse" },
      {
        playResponse: { mediaSessionRef, playbackRef: "123" },
        content: "playResponse"
      },
      { hangupResponse: { mediaSessionRef }, content: "hangupResponse" }
    ];
    let cnt = 0;

    // Arrange
    const onceStub = sandbox
      .stub()
      .callsFake((event: StreamEvent, cb: (params) => void) => {
        if (event === StreamEvent.DATA) {
          cb({ request: voiceRequest });
        }
        // We purposely ignore the END event to avoid the process to exit
      });

    const onStub = sandbox
      .stub()
      .callsFake((event: StreamEvent, cb: (params) => void) => {
        cb(callbackResponses[cnt++]);
      });

    const voice = {
      removeListener: sandbox.stub(),
      on: onStub,
      once: onceStub,
      write: sandbox.stub(),
      end: sandbox.stub()
    };

    const { createSession } = await import("../src/createSession");

    const handler = async (req: VoiceRequest, res: VoiceResponse) => {
      await res.answer();
      await res.play("http://example.com/audio.mp3");
      await res.hangup();
    };

    // Act
    await createSession(handler)(voice);

    // Assert
    expect(voice.once).to.have.been.calledWith(StreamEvent.DATA, match.func);
    expect(voice.once).to.have.been.calledWith(StreamEvent.END, match.func);
    expect(voice.once).to.have.been.calledTwice;
    expect(voice.on).to.have.been.calledThrice;
    expect(voice.write).to.have.been.calledThrice;
    expect(voice.write).to.have.been.calledWith({
      answerRequest: { mediaSessionRef }
    });
    expect(voice.write).to.have.been.calledWith({
      playRequest: { mediaSessionRef, url: "http://example.com/audio.mp3" }
    });
    expect(voice.write).to.have.been.calledWith({
      hangupRequest: { mediaSessionRef }
    });
  });
});
