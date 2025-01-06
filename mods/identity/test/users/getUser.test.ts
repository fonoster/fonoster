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
import { datesMapper } from "@fonoster/common";
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

describe("@identity[users/getUser]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should get a user by id", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        ref: "123"
      }
    };

    const user = {
      ref: "123",
      email: "john@example.com",
      name: "John Doe",
      avatar: "https://example.com/avatar.jpg",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const prisma = {
      user: {
        findUnique: sandbox.stub().resolves(user)
      }
    } as unknown as Prisma;

    const { createGetUser } = await import("../../src/users/createGetUser");

    // Act
    const response = await new Promise((resolve, reject) => {
      createGetUser(prisma)(call, (error, response) => {
        if (error) return reject(error);
        resolve(response);
      });
    });

    // Assert
    expect(response).to.deep.equal(datesMapper(user));
  });

  it("should throw an error if user not found", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        ref: "123"
      }
    };

    const prisma = {
      user: {
        findUnique: sandbox.stub().resolves(null)
      }
    } as unknown as Prisma;

    const { createGetUser } = await import("../../src/users/createGetUser");

    // Act
    await createGetUser(prisma)(call, (error) => {
      // Assert
      expect(error).to.deep.equal({
        code: grpc.status.NOT_FOUND,
        message: "User not found: 123"
      });
    });
  });
});
