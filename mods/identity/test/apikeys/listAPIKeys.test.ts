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
import { TEST_TOKEN } from "../testToken";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@identity[apikeys/listApiKeys]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should list ApiKeys", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        pageSize: 10,
        pageToken: "123"
      }
    };

    const res = {
      items: [
        {
          ref: "123",
          accessKeyId: "123",
          role: "USER",
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      nextPageToken: "123"
    };

    const prisma = {
      workspace: {
        findUnique: sandbox.stub().resolves({ id: "123" })
      },
      apiKey: {
        findMany: sandbox.stub().resolves(res.items)
      }
    } as unknown as Prisma;

    const { listApiKeys } = await import("../../src/apikeys/listApiKeys_");

    // Act
    await listApiKeys(prisma)(call, (_, response) => {
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
        pageSize: 10,
        pageToken: "123"
      }
    };

    const res = {
      items: [],
      nextPageToken: undefined
    };

    const prisma = {
      workspace: {
        findUnique: sandbox.stub().resolves({ id: "123" })
      },
      apiKey: {
        findMany: sandbox.stub().resolves([])
      }
    } as unknown as Prisma;

    const { listApiKeys } = await import("../../src/apikeys/listApiKeys_");

    // Act

    await listApiKeys(prisma)(call, (error, response) => {
      // Assert
      expect(response).to.be.deep.equal(res);
    });
  });
});
