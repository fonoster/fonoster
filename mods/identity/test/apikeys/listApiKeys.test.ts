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

describe("@identity[apikeys/listApiKeys]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should return timestamps as epoch seconds", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: { pageSize: 10, pageToken: "" }
    };

    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const updatedAt = new Date("2026-01-02T00:00:00.000Z");
    const expiresAt = new Date("2026-06-01T00:00:00.000Z");

    const prisma = {
      workspace: {
        findUnique: sandbox.stub().resolves({ ref: "123" })
      },
      apiKey: {
        findMany: sandbox.stub().resolves([
          {
            ref: "456",
            accessKeyId: "accessKeyId",
            role: Role.WORKSPACE_ADMIN,
            createdAt,
            updatedAt,
            expiresAt
          }
        ])
      }
    } as unknown as Prisma;

    const { createListApiKeys } = await import("../../src/apikeys/createListApiKeys");

    // Act
    await createListApiKeys(prisma)(call, (_, response) => {
      // Assert
      const item = response.items[0];
      expect(item.createdAt).to.be.equal(Math.floor(createdAt.getTime() / 1000));
      expect(item.updatedAt).to.be.equal(Math.floor(updatedAt.getTime() / 1000));
      expect(item.expiresAt).to.be.equal(Math.floor(expiresAt.getTime() / 1000));
    });
  });

  it("should omit expiresAt when the key never expires", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: { pageSize: 10, pageToken: "" }
    };

    const prisma = {
      workspace: {
        findUnique: sandbox.stub().resolves({ ref: "123" })
      },
      apiKey: {
        findMany: sandbox.stub().resolves([
          {
            ref: "456",
            accessKeyId: "accessKeyId",
            role: Role.WORKSPACE_ADMIN,
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt: null
          }
        ])
      }
    } as unknown as Prisma;

    const { createListApiKeys } = await import("../../src/apikeys/createListApiKeys");

    // Act
    await createListApiKeys(prisma)(call, (_, response) => {
      // Assert
      expect(response.items[0].expiresAt).to.be.undefined;
    });
  });
});
