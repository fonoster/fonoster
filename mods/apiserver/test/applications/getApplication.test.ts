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
import { Prisma } from "../../src/core/db";
import { TEST_TOKEN } from "../utils";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@applications/getApplication", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should get an application by id", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        ref: "123"
      }
    };

    const application = {
      ref: "123",
      name: "My Application",
      endpoint: "example.com:50051",
      accessKeyId: "GRahn02s8tgdfghz72vb0fz538qpb5z35p",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const prisma = {
      application: {
        delete: sandbox.stub().resolves({ ref: application.ref }),
        findUnique: sandbox.stub().resolves(application)
      }
    } as unknown as Prisma;

    const { createGetApplication } = await import(
      "../../src/applications/createGetApplication"
    );

    // Act
    const response = await new Promise((resolve, reject) => {
      createGetApplication(prisma)(call, (error, response) => {
        if (error) return reject(error);
        resolve(response);
      });
    });

    // Assert
    expect(prisma.application.findUnique).to.have.been.calledTwice;
    expect(response).have.property("ref", application.ref);
    expect(response).have.property("name", application.name);
    expect(response).have.property("endpoint", application.endpoint);
    expect(response).have.property("accessKeyId", application.accessKeyId);
  });

  it("should throw an error if the application is not found", async function () {
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
      application: {
        findUnique: sandbox.stub().resolves(null)
      }
    } as unknown as Prisma;

    const { createGetApplication } = await import(
      "../../src/applications/createGetApplication"
    );

    // Act
    await createGetApplication(prisma)(call, (error) => {
      // Assert
      expect(error).to.deep.equal({
        code: grpc.status.NOT_FOUND,
        message: "The requested resource was not found"
      });
    });
  });
});
