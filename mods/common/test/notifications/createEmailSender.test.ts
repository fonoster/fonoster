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
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@apiserver[common/notifications/createEmailSender]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a new email sender", async function () {
    // Arrange
    const config = {
      host: "smtp.example.com",
      port: 465,
      secure: true,
      auth: {
        user: "user",
        pass: "password"
      }
    };

    const { createEmailSender } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("../../src/notifications/createEmailSender");

    // Act
    const result = createEmailSender(config);

    // Assert
    expect(result).to.be.a("function");
    expect(result).to.have.property("name", "sendEmail");
  });

  it("should send an email", async function () {
    // Arrange
    const config = {
      host: "smtp.example.com",
      port: 465,
      secure: true,
      auth: {
        user: "user",
        pass: "password"
      }
    };

    const { createEmailSender } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("../../src/notifications/createEmailSender");

    // Stub await transporter.sendMail
    const sendEmailStub = sandbox
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      .stub(require("nodemailer"), "createTransport")
      .returns({
        sendMail: async () => {
          return { messageId: "123" };
        }
      });

    const emailSender = createEmailSender(config);

    const params = {
      from: "Fonoster <info@fonoster.local>",
      to: "user@example.com",
      subject: "Welcome to Fonoster",
      html: "<p>Welcome to Fonoster</p>"
    };

    // Act
    await emailSender(params);

    // Assert
    expect(sendEmailStub).to.have.been.calledOnce;
  });
});
