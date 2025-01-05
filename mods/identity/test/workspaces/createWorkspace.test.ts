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

describe("@identity[workspaces/createWorkspace]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a workspace", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        name: "My Workspace"
      }
    };

    const prisma = {
      workspace: {
        create: sandbox.stub().resolves({ ref: "123" })
      }
    } as unknown as Prisma;

    const { createCreateWorkspace } = await import(
      "../../src/workspaces/createCreateWorkspace"
    );

    // Act
    await createCreateWorkspace(prisma)(call, (_, response) => {
      // Assert
      expect(response).to.deep.equal({ ref: "123" });
    });
  });

  it("should throw an error if the workspace already exists", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    const call = {
      metadata,
      request: {
        name: "My Workspace"
      }
    };

    const prisma = {
      workspace: {
        create: sandbox.stub().throws({ code: "P2002" })
      }
    } as unknown as Prisma;

    const { createCreateWorkspace } = await import(
      "../../src/workspaces/createCreateWorkspace"
    );

    // Act
    await createCreateWorkspace(prisma)(call, (error) => {
      // Assert
      expect(error).to.deep.equal({
        code: grpc.status.ALREADY_EXISTS,
        message: "The resource already exists"
      });
    });
  });

  it("should throw if a validation error occurs", async function () {
    // Arrange
    const call = {
      request: {
        name: ""
      }
    };

    // Doesn't matter because it will not be called
    const prisma = {} as unknown as Prisma;

    const { createCreateWorkspace } = await import(
      "../../src/workspaces/createCreateWorkspace"
    );

    // Act
    await createCreateWorkspace(prisma)(call, (error) => {
      // Assert
      expect(error).to.deep.equal({
        code: grpc.status.INVALID_ARGUMENT,
        message:
          // eslint-disable-next-line prettier/prettier
          "The name is required at \"name\""
      });
    });
  });
});
