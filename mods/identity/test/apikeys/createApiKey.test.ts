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

describe("@identity[apikeys/createApiKey]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a new ApiKey", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        workspaceRef: "123",
        role: Role.WORKSPACE_ADMIN,
        expiresAt: new Date().getMilliseconds()
      }
    };

    const res = {
      ref: "123",
      accessKeyId: "accessKeyId",
      accessKeySecret: "accessKeySecret"
    };

    const prisma = {
      workspace: {
        findUnique: sandbox.stub().resolves({ ref: "123" })
      },
      apiKey: {
        create: sandbox.stub().resolves(res)
      }
    } as unknown as Prisma;

    const { createCreateApiKey } = await import("../../src/apikeys/createCreateApiKey");

    // Act
    await createCreateApiKey(prisma)(call, (_, response) => {
      // Assert
      expect(response).has.property("ref").to.be.equal("123");
      expect(response).has.property("accessKeyId").to.be.equal("accessKeyId");
      expect(response)
        .has.property("accessKeySecret")
        .to.be.equal("accessKeySecret");
    });
  });

  it("should throw an error if the ApiKey already exists", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    const call = {
      metadata,
      request: {
        workspaceRef: "123",
        role: Role.WORKSPACE_ADMIN,
        expiresAt: new Date().getMilliseconds()
      }
    };

    const prisma = {
      workspace: {
        findUnique: sandbox.stub().resolves({ ref: "123" })
      },
      apiKey: {
        create: sandbox.stub().throws({ code: "P2002" })
      }
    } as unknown as Prisma;

    const { createCreateApiKey } = await import("../../src/apikeys/createCreateApiKey");

    // Act
    await createCreateApiKey(prisma)(call, (error) => {
      // Assert
      expect(error).to.deep.equal({
        code: grpc.status.ALREADY_EXISTS,
        message: "The resource already exists"
      });
    });
  });
});
