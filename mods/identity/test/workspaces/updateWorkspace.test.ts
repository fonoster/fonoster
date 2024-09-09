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
import { Prisma } from "../../src/db";
import { TEST_TOKEN } from "../utils";
import { TEST_UUID } from "../utils";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@identity[workspace/updateWorkspace]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should update a workspace", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        ref: TEST_UUID,
        name: "My Workspacex"
      }
    };

    const prisma = {
      workspace: {
        update: sandbox.stub().resolves({ ref: TEST_UUID }),
        findUnique: sandbox.stub().resolves({ ownerRef: TEST_UUID })
      },
      workspaceMember: {
        findFirst: sandbox.stub().resolves({})
      }
    } as unknown as Prisma;

    const { updateWorkspace } = await import(
      "../../src/workspaces/updateWorkspace"
    );

    // Act
    const response = await new Promise((resolve, reject) => {
      updateWorkspace(prisma)(call, (error, response) => {
        if (error) return reject(error);
        resolve(response);
      });
    });

    // Assert
    expect(response).to.deep.equal({ ref: TEST_UUID });
  });

  it("should throw an error if the user does not exist", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        ref: TEST_UUID,
        name: "John Doex"
      }
    };

    const prisma = {
      user: {
        update: sandbox.stub().throws({ code: "P2025" })
      }
    } as unknown as Prisma;

    const { updateUser } = await import("../../src/users/updateUser");

    // Act
    const response = new Promise((resolve, reject) => {
      updateUser(prisma)(call, (error, response) => {
        if (error) return reject(error);
        resolve(response);
      });
    });

    // Assert
    await expect(response).to.be.rejectedWith(
      "The requested resource was not found"
    );
  });
});
