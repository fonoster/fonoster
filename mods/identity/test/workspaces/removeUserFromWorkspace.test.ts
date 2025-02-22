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
import { Role } from "@fonoster/types";
import * as grpc from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { Prisma } from "../../src/db";
import { TEST_TOKEN } from "../utils";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@identity[workspace/removeUserFromWorkspace]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should remove a user from a workspace", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    const userRef = "635c0cd8-8125-483d-b467-05c53ce2cd31";

    const call = {
      metadata,
      request: {
        workspaceRef: "123",
        userRef
      }
    };

    const prisma = {
      workspaceMember: {
        findFirst: sandbox.stub().resolves({ ref: "123" }),
        delete: sandbox.stub().resolves({ ref: "123" })
      },
      workspace: {
        findUnique: sandbox.stub().resolves({
          ref: "123",
          accessKeyId: "GRahn02s8tgdfghz72vb0fz538qpb5z35p",
          ownerRef: userRef,
          members: [{ userRef, role: Role.WORKSPACE_ADMIN }]
        })
      }
    } as unknown as Prisma;

    const { createRemoveUserFromWorkspace } = await import(
      "../../src/workspaces/createRemoveUserFromWorkspace"
    );

    // Act
    const response = await new Promise((resolve, reject) => {
      createRemoveUserFromWorkspace(prisma)(call, (error, response) => {
        if (error) return reject(error);
        resolve(response);
      });
    });

    // Assert
    expect(response).to.deep.equal({ ref: "123" });
  });

  it("should throw a permission denied error", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    const userRef = "635c0cd8-8125-483d-b467-05c53ce2cd30";

    const call = {
      metadata,
      request: {
        userRef
      }
    };

    const prisma = {
      workspace: {
        findUnique: sandbox.stub().resolves({
          ownerRef: "another-user-id",
          members: [{ userId: "another-user-id", role: Role.USER }]
        })
      },
      workspaceMember: {
        findFirst: sandbox.stub().resolves({ ref: "123" }),
        delete: sandbox.stub().resolves({ ref: "123" })
      }
    } as unknown as Prisma;

    const { createRemoveUserFromWorkspace } = await import(
      "../../src/workspaces/createRemoveUserFromWorkspace"
    );

    // Act
    // FIXME: This should be a promise
    await createRemoveUserFromWorkspace(prisma)(call, (error) => {
      // Assert
      expect(error).to.deep.equal({
        code: grpc.status.PERMISSION_DENIED,
        message: "Only admins or owners can remove users from a workspace"
      });
    });
  });
});
