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
import * as grpc from "@grpc/grpc-js";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { Prisma } from "../../../src/db";
import { GroupRoleEnum } from "../../../src/identity/groups/GroupRoleEnum";
import { TEST_TOKEN } from "../../testToken";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@apiserver[identity/group/removeUserFromGroup]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should remove a user from a group", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    const userId = "635c0cd8-8125-483d-b467-05c53ce2cd31";

    const call = {
      metadata,
      request: {
        groupId: "123",
        userId
      }
    };

    const prisma = {
      groupMember: {
        findFirst: sandbox.stub().resolves({ id: "123" }),
        delete: sandbox.stub().resolves({ id: "123" })
      },
      group: {
        findUnique: sandbox.stub().resolves({
          ownerId: userId,
          members: [{ userId: userId, role: GroupRoleEnum.ADMIN }]
        })
      }
    } as unknown as Prisma;

    const { removeUserFromGroup } = await import(
      "../../../src/identity/groups/removeUserFromGroup"
    );

    // Act
    const response = await new Promise((resolve, reject) => {
      removeUserFromGroup(prisma)(call, (error, response) => {
        if (error) return reject(error);
        resolve(response);
      });
    });

    // Assert
    expect(response).to.deep.equal({ id: "123" });
  });

  it("should throw a permission denied error", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    const userId = "635c0cd8-8125-483d-b467-05c53ce2cd31";

    const call = {
      metadata,
      request: {
        groupId: "123",
        userId
      }
    };

    const prisma = {
      group: {
        findUnique: sandbox.stub().resolves({
          ownerId: "another-user-id",
          members: [{ userId: "another-user-id", role: GroupRoleEnum.USER }]
        })
      },
      groupMember: {
        findFirst: sandbox.stub().resolves({ id: "123" }),
        delete: sandbox.stub().resolves({ id: "123" })
      }
    } as unknown as Prisma;

    const { removeUserFromGroup } = await import(
      "../../../src/identity/groups/removeUserFromGroup"
    );

    // Act
    removeUserFromGroup(prisma)(call, (error) => {
      // Assert
      expect(error).to.deep.equal({
        code: grpc.status.PERMISSION_DENIED,
        message: "Only admins or owners can remove users from a group"
      });
    });
  });
});
