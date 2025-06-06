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

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@identity[invites/sendInvite]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should send an email", async function () {
    // Arrange
    const sendEmail = sandbox.stub();
    const request = {
      sender: "Fonoster <info@fonoster.local>",
      recipient: "user@example.com",
      inviteUrl: "http://example.com?token=jwt",
      oneTimePassword: "123456",
      workspaceName: "My Workspace",
      isExistingUser: false
    };

    const { sendInvite } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("../../src/invites/sendInvite");

    // Act
    await sendInvite(sendEmail, request);

    // Assert
    expect(sendEmail).to.have.been.calledOnce;
  });
});
