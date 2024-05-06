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
import { APIRoleEnum } from "../../../identity";
import { Prisma } from "../../src/db";
import { TEST_TOKEN } from "../testToken";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@apiserver[identity/apikeys/createAPIKey]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a new API Key", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        groupId: "123",
        role: APIRoleEnum.GROUP_ADMIN,
        expiresAt: new Date().getMilliseconds()
      }
    };

    const res = {
      id: "123",
      accessKeyId: "accessKeyId",
      accessKeySecret: "accessKeySecret",
      role: APIRoleEnum.GROUP_ADMIN,
      expiresAt: 0,
      createdAt: new Date().getMilliseconds(),
      updatedAt: new Date().getMilliseconds()
    };

    const prisma = {
      aPIKey: {
        create: sandbox.stub().resolves(res)
      }
    } as unknown as Prisma;

    const { createAPIKey } = await import("../../src/apikeys/createAPIKey");

    // Act
    await createAPIKey(prisma)(call, (_, response) => {
      // Assert
      expect(response).to.deep.equal(res);
    });
  });

  it("should throw an error if the group already exists", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    const call = {
      metadata,
      request: {
        groupId: "123",
        role: APIRoleEnum.GROUP_ADMIN,
        expiresAt: new Date().getMilliseconds()
      }
    };

    const prisma = {
      aPIKey: {
        create: sandbox.stub().throws({ code: "P2002" })
      }
    } as unknown as Prisma;

    const { createAPIKey } = await import("../../src/apikeys/createAPIKey");

    // Act
    await createAPIKey(prisma)(call, (error) => {
      // Assert
      expect(error).to.deep.equal({
        code: grpc.status.ALREADY_EXISTS,
        message: "Duplicated resource"
      });
    });
  });
});
