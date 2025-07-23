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

const WORKSPACE_NAME = "My Workspace";

describe("@identity[invites/createInviteBody]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a new invite body", async function () {
    // Arrange
    const params = {
      isExistingUser: false,
      workspaceName: WORKSPACE_NAME,
      oneTimePassword: "123456",
      inviteUrl: "http://example.com?token=jwt"
    };

    const { createInviteBody } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("../../src/invites/createInviteBody");

    // Act
    const result = createInviteBody(params);

    // Assert
    expect(result).to.be.a("string");
    expect(result).to.contain("You have been invited to join the workspace");
    expect(result).to.contain(WORKSPACE_NAME);
    expect(result).to.contain("http://example.com?token&#x3D;jwt");
    expect(result).to.contain("123456");
  });

  it("should create a existing invite body", async function () {
    // Arrange
    const params = {
      isExistingUser: true,
      workspaceName: WORKSPACE_NAME,
      inviteUrl: "http://example.com?token=jwt",
      oneTimePassword: "123456"
    };

    const { createInviteBody } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("../../src/invites/createInviteBody");
    // Act
    const result = createInviteBody(params);

    // Assert
    expect(result).to.be.a("string");
    expect(result).to.contain("You have been invited to join the workspace");
    expect(result).to.contain(WORKSPACE_NAME);
    expect(result).to.contain("http://example.com?token&#x3D;jwt");
    expect(result).to.not.contain("123456");
  });
});
