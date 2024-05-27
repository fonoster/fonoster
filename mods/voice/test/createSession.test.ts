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
import { createSandbox, match } from "sinon";
import sinonChai from "sinon-chai";
import { VoiceRequest } from "../src/types";
import { DATA } from "../src/verbs/types";
import { VoiceResponse } from "../src/VoiceResponse";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@voice/createSession", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a session", async function () {
    // Arrange
    const sessionId = "00000000-0000-0000-0000-000000000000";
    const voiceRequest: VoiceRequest = {
      appRef: "3861b08b-1602-45e4-b523-dc3036ba85e7",
      sessionId,
      accessKeyId: "WO00000000000000000000000000000000",
      endpoint: "localhost:50061",
      ingressNumber: "+1234567890",
      callerId: "John Doe",
      callerNumber: "+14345551234",
      sessionToken: "jwt-token",
      metadata: {}
    };

    const onStub = sandbox
      .stub()
      .onFirstCall()
      .callsFake((_, cb) => {
        cb({ request: voiceRequest });
      })
      .onSecondCall()
      .callsFake((_, cb) => {
        cb({
          answerResponse: { sessionId }
        });
      })
      .onThirdCall()
      .callsFake((_, cb) => {
        cb({
          playResponse: { sessionId }
        });
      })
      .onCall(3)
      .callsFake((_, cb) => {
        cb({
          hangupResponse: { sessionId }
        });
      });

    const voice = {
      removeListener: sandbox.stub(),
      on: onStub,
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
    expect(voice.on).to.have.been.calledWith(DATA, match.func);
    expect(voice.on).to.have.been.called.callCount(4);
    expect(voice.write).to.have.been.calledThrice;
    expect(voice.write).to.have.been.calledWith({
      answerRequest: { sessionId }
    });
    expect(voice.write).to.have.been.calledWith({
      playRequest: { sessionId, url: "http://example.com/audio.mp3" }
    });
    expect(voice.write).to.have.been.calledWith({
      hangupRequest: { sessionId }
    });
  });
});
