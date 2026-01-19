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
import { DialRecordDirection, DialRequest, DialStatus } from "@fonoster/common";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox, match } from "sinon";
import sinonChai from "sinon-chai";
import { getVoiceObject, mediaSessionRef, voiceRequest } from "./helpers";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@voice/verbs/dial", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should dial a number", async function () {
    // Arrange
    const { Dial } = await import("../src/verbs");

    const voice = getVoiceObject(sandbox, "dialResponse");

    const dial = new Dial(voiceRequest, voice);

    const dialRequest: DialRequest = {
      mediaSessionRef,
      destination: "+1234567890",
      recordDirection: DialRecordDirection.BOTH
    };

    // Act
    await dial.run(dialRequest);

    // Assert
    expect(voice.removeListener).to.have.been.calledOnce;
    expect(voice.on).to.have.been.calledOnce;
    expect(voice.on).to.have.been.calledWith("data", match.func);
    expect(voice.write).to.have.been.calledOnce;
    expect(voice.write).to.have.been.calledWith({
      dialRequest
    });
  });

  it("should stream the dial status", async function () {
    // Arrange
    const { VoiceResponse } = await import("../src/VoiceResponse");

    const onStub = sandbox
      .stub()
      .onFirstCall()
      .callsFake((_, cb) => {
        cb({
          dialResponse: { status: DialStatus.PROGRESS },
          content: "dialResponse"
        });
      });

    const voice = {
      removeListener: sandbox.stub(),
      on: onStub,
      once: sandbox.stub(),
      write: sandbox.stub(),
      end: sandbox.stub()
    };

    const voiceResponse = new VoiceResponse(voiceRequest, voice);

    const dummyCallback = sandbox.stub();

    // Act
    const stream = await voiceResponse.dial("+1234567890");

    stream.on(dummyCallback);

    voice.on.yield({ dialResponse: { status: DialStatus.PROGRESS } });
    voice.on.yield({ dialResponse: { status: DialStatus.ANSWER } });

    // Assert
    expect(dummyCallback).to.have.been.calledTwice;
    expect(dummyCallback).to.have.been.calledWith(DialStatus.PROGRESS);
    expect(dummyCallback).to.have.been.calledWith(DialStatus.ANSWER);
    expect(dummyCallback).to.not.have.been.calledWith(DialStatus.CANCEL);
  });

  it("should throw an error if the request is invalid", async function () {
    // Arrange
    const { Dial } = await import("../src/verbs");

    const voice = getVoiceObject(sandbox, "dialResponse");

    const dial = new Dial(voiceRequest, voice);

    // Act
    const promise = dial.run({ invalid: "data" } as unknown as DialRequest);

    // Assert
    // eslint-disable-next-line prettier/prettier
    return expect(promise).to.be.rejectedWith("Required at \"destination\"");
  });
});
