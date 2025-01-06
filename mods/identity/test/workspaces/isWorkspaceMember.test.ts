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
import { Prisma } from "../../src/db";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@identity[workspaces/isWorkspaceMember]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should return true if user is the owner of the workspace", async function () {
    // Arrange
    const prisma = {
      workspace: {
        findUnique: sandbox.stub().resolves({ ownerRef: "123" })
      },
      workspaceMember: {
        findFirst: sandbox.stub().resolves()
      }
    } as unknown as Prisma;

    const { createIsWorkspaceMember } = await import(
      "../../src/workspaces/createIsWorkspaceMember"
    );

    // Act
    const result = await createIsWorkspaceMember(prisma)("123", "123");

    // Assert
    expect(result).to.be.true;
  });

  it("should return true if user is a member of the workspace", async function () {
    // Arrange
    const prisma = {
      workspace: {
        findUnique: sandbox.stub().resolves()
      },
      workspaceMember: {
        findFirst: sandbox.stub().resolves({})
      }
    } as unknown as Prisma;

    const { createIsWorkspaceMember } = await import(
      "../../src/workspaces/createIsWorkspaceMember"
    );

    // Act
    const result = await createIsWorkspaceMember(prisma)("123", "123");

    // Assert
    expect(result).to.be.true;
  });

  it("should return false if user is not a member of the workspace", async function () {
    // Arrange
    const prisma = {
      workspace: {
        findUnique: sandbox.stub().resolves()
      },
      workspaceMember: {
        findFirst: sandbox.stub().resolves()
      }
    } as unknown as Prisma;

    const { createIsWorkspaceMember } = await import(
      "../../src/workspaces/createIsWorkspaceMember"
    );

    // Act
    const result = await createIsWorkspaceMember(prisma)("123", "123");

    // Assert
    expect(result).to.be.false;
  });
});
