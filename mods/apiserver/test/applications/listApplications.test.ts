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

describe("@applications/listApplications", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should list applications", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        pageSize: 10,
        pageToken: "1"
      }
    };

    const applications = [
      {
        ref: "123",
        name: "My Application",
        accessKeyId: "GRahn02s8tgdfghz72vb0fz538qpb5z35p",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const prisma = {
      application: {
        findMany: sandbox.stub().resolves(applications)
      }
    } as unknown as Prisma;

    const { createListApplications } = await import(
      "../../src/applications/createListApplications"
    );

    // Act
    const response = await new Promise((resolve, reject) => {
      createListApplications(prisma)(call, (error, response) => {
        if (error) return reject(error);
        resolve(response);
      });
    });

    // Assert
    expect(response)
      .has.property("items")
      .to.be.an("array")
      .to.have.lengthOf(1);
    // When items.length < pageSize, we're on the last page, so nextPageToken should be undefined
    expect(response).has.property("nextPageToken").to.be.undefined;
  });

  it("should return nextPageToken when page is full", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        pageSize: 2, // Request 2 items
        pageToken: ""
      }
    };

    // Return exactly 2 items (full page)
    const applications = [
      {
        ref: "app-1",
        name: "Application 1",
        accessKeyId: "GRahn02s8tgdfghz72vb0fz538qpb5z35p",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ref: "app-2",
        name: "Application 2",
        accessKeyId: "GRahn02s8tgdfghz72vb0fz538qpb5z35p",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const prisma = {
      application: {
        findMany: sandbox.stub().resolves(applications)
      }
    } as unknown as Prisma;

    const { createListApplications } = await import(
      "../../src/applications/createListApplications"
    );

    // Act
    const response = await new Promise((resolve, reject) => {
      createListApplications(prisma)(call, (error, response) => {
        if (error) return reject(error);
        resolve(response);
      });
    });

    // Assert
    expect(response)
      .has.property("items")
      .to.be.an("array")
      .to.have.lengthOf(2);
    // When items.length === pageSize, there might be more pages, so return nextPageToken
    expect(response)
      .has.property("nextPageToken")
      .to.be.a("string")
      .to.equal("app-2");
  });

  it("should return an empty array if no applications found", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        pageSize: 10,
        pageToken: "1"
      }
    };

    const prisma = {
      application: {
        findMany: sandbox.stub().resolves([])
      }
    } as unknown as Prisma;

    const { createListApplications } = await import(
      "../../src/applications/createListApplications"
    );

    // Act
    const response = await new Promise((resolve, reject) => {
      createListApplications(prisma)(call, (error, response) => {
        if (error) return reject(error);
        resolve(response);
      });
    });

    // Assert
    expect(response)
      .has.property("items")
      .to.be.an("array")
      .to.have.lengthOf(0);
    expect(response).has.property("nextPageToken").to.be.undefined;
  });
});
