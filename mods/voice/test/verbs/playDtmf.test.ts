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
import { PlayDtmfRequest } from "../../src/verbs/types";
import { getVoiceObject, sessionId, voiceRequest } from "../helpers";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@voice/verbs/playDtmf", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should play a series of dtmf digits", async function () {
    // Arrange
    const { PlayDtmf } = await import("../../src/verbs/PlayDtmf");

    const voice = getVoiceObject(sandbox);

    const playDtmf = new PlayDtmf(voiceRequest, voice);

    // Act
    await playDtmf.run({ sessionId, digits: "123" });

    // Assert
    expect(voice.removeListener).to.have.been.calledOnce;
    expect(voice.on).to.have.been.calledOnce;
    expect(voice.on).to.have.been.calledWith("data", match.func);
    expect(voice.write).to.have.been.calledOnce;
    expect(voice.write).to.have.been.calledWith({
      playDtmfRequest: { sessionId, digits: "123" }
    });
  });

  it("should throw an error if the request is invalid", async function () {
    // Arrange
    const { PlayDtmf } = await import("../../src/verbs/PlayDtmf");

    const voice = getVoiceObject(sandbox);

    const playDtmf = new PlayDtmf(voiceRequest, voice);

    // Act
    const promise = playDtmf.run({
      invalid: "data"
    } as unknown as PlayDtmfRequest);

    // Assert
    // eslint-disable-next-line prettier/prettier
    return expect(promise).to.be.rejectedWith("Validation error: Required at \"digits\"");
  });
});
