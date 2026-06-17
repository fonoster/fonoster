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

chai.use(chaiAsPromised);

describe("@apiserver[common/notifications/createSendSmsTwilioImpl]", function () {
  it("should return a no-op sender when config is undefined", async function () {
    // Arrange
    const { createSendSmsTwilioImpl } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("../../src/notifications/createSendSmsTwilioImpl");

    // Act
    const sendSms = createSendSmsTwilioImpl(undefined);

    // Assert — must not throw, must resolve
    await expect(
      sendSms({ to: "+10000000000", body: "test" })
    ).to.eventually.be.undefined;
  });

  it("should return a sender function when config is provided", function () {
    // Arrange
    const { createSendSmsTwilioImpl } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("../../src/notifications/createSendSmsTwilioImpl");

    const config = {
      accountSid: "ACtest",
      authToken: "token",
      sender: "+10000000000"
    };

    // Act
    const sendSms = createSendSmsTwilioImpl(config);

    // Assert
    expect(sendSms).to.be.a("function");
    expect(sendSms).to.have.property("name", "sendSms");
  });
});
