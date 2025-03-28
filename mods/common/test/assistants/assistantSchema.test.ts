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
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { assistantSchema } from "../../src";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@apiserver[common/assistants/assistantSchema]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("checks the tools have an empty array by default", async function () {
    // Arrange
    const assistantConfig = {
      conversationSettings: {
        firstMessage: "Hello",
        systemPrompt: "systemPrompt",
        goodbyeMessage: "goodbyeMessage",
        systemErrorMessage: "systemErrorMessage",
        initialDtmf: "1234",
        transferOptions: {
          phoneNumber: "phoneNumber",
          message: "message"
        },
        idleOptions: {
          message: "message"
        },
      },
      languageModel: {
        provider: "openai",
        apiKey: "apiKey",
        model: "gpt-4o",
        temperature: 1,
        maxTokens: 1
      }
    };
    // Act
    const result = assistantSchema.parse(assistantConfig);

    // Assert
    expect(result.languageModel.tools).to.be.an("array").that.is.empty;
    expect(result.languageModel.knowledgeBase).to.be.an("array").that.is.empty;
    expect(result.conversationSettings.vad.activationThreshold).to.be.equal(0.40);
    expect(result.conversationSettings.vad.deactivationThreshold).to.be.equal(0.25);
    expect(result.conversationSettings.vad.debounceFrames).to.be.equal(4);
    expect(result.conversationSettings.transferOptions.timeout).to.be.equal(30000);
    expect(result.conversationSettings.maxSpeechWaitTimeout).to.be.equal(0);
    expect(result.conversationSettings.idleOptions.timeout).to.be.equal(10000);
    expect(result.conversationSettings.idleOptions.maxTimeoutCount).to.be.equal(2);
  });
});
