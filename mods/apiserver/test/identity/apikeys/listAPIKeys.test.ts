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
import { TEST_TOKEN } from "../../testToken";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@apiserver[identity/apikeys/listAPIKeys]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should list API Keys", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        groupId: "123"
      }
    };

    const res = {
      apiKeys: [
        {
          id: "123",
          accessKeyId: "123",
          role: "USER",
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    };

    const prisma = {
      aPIKey: {
        findMany: sandbox.stub().resolves(res.apiKeys)
      }
    } as unknown as Prisma;

    const { listAPIKeys } = await import(
      "../../../src/identity/apikeys/listAPIKeys"
    );

    // Act
    await listAPIKeys(prisma)(call, (error, response) => {
      // Assert
      expect(response).to.be.deep.equal(res);
    });
  });

  it("should return an empty array", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        groupId: "123"
      }
    };

    const res = {
      apiKeys: []
    };

    const prisma = {
      aPIKey: {
        findMany: sandbox.stub().resolves([])
      }
    } as unknown as Prisma;

    const { listAPIKeys } = await import(
      "../../../src/identity/apikeys/listAPIKeys"
    );

    // Act

    await listAPIKeys(prisma)(call, (error, response) => {
      // Assert
      expect(response).to.be.deep.equal(res);
    });
  });
});
