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
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { ApplicationType } from "@prisma/client";
import { AUTOPILOT_SPECIAL_LOCAL_ADDRESS } from "@fonoster/common";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@applications/applicationWithEncodedStruct", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should return an application with encoded struct", async function () {
    // Arrange
    const { applicationWithEncodedStruct } = await import(
      "../../src/applications/utils/applicationWithEncodedStruct"
    );

    const createdAt = new Date();
    const updatedAt = new Date();

    const application = {
      ref: "123",
      name: "My Application",
      endpoint: "localhost:50061",
      textToSpeech: {
        productRef: "123",
        config: {
          voice: "angela"
        }
      },
      speechToText: {
        productRef: "123",
        config: null
      },
      createdAt,
      updatedAt
    };

    // Act
    const result = applicationWithEncodedStruct(application);

    // Assert
    chai.expect(result).to.deep.equal({
      ...application,
      textToSpeech: {
        productRef: "123",
        config: {
          fields: {
            voice: {
              kind: "stringValue",
              stringValue: "angela"
            }
          }
        }
      },
      speechToText: {
        productRef: "123",
        config: null
      },
      createdAt: createdAt.getTime() / 1000,
      updatedAt: updatedAt.getTime() / 1000
    });
  });

  it("should hide default endpoint for AUTOPILOT applications", async function () {
    // Arrange
    const { applicationWithEncodedStruct } = await import(
      "../../src/applications/utils/applicationWithEncodedStruct"
    );

    const createdAt = new Date();
    const updatedAt = new Date();

    const application = {
      ref: "123",
      name: "My Autopilot Application",
      type: ApplicationType.AUTOPILOT,
      endpoint: AUTOPILOT_SPECIAL_LOCAL_ADDRESS,
      textToSpeech: {
        productRef: "123",
        config: {
          voice: "angela"
        }
      },
      speechToText: {
        productRef: "123",
        config: null
      },
      createdAt,
      updatedAt
    };

    // Act
    const result = applicationWithEncodedStruct(application);

    // Assert
    chai.expect(result.endpoint).to.equal("");
    chai.expect(result.type).to.equal(ApplicationType.AUTOPILOT);
  });

  it("should preserve custom endpoint for AUTOPILOT applications", async function () {
    // Arrange
    const { applicationWithEncodedStruct } = await import(
      "../../src/applications/utils/applicationWithEncodedStruct"
    );

    const createdAt = new Date();
    const updatedAt = new Date();
    const customEndpoint = "my-custom-autopilot.example.com:50051";

    const application = {
      ref: "123",
      name: "My Custom Autopilot Application",
      type: ApplicationType.AUTOPILOT,
      endpoint: customEndpoint,
      textToSpeech: {
        productRef: "123",
        config: {
          voice: "angela"
        }
      },
      speechToText: {
        productRef: "123",
        config: null
      },
      createdAt,
      updatedAt
    };

    // Act
    const result = applicationWithEncodedStruct(application);

    // Assert
    chai.expect(result.endpoint).to.equal(customEndpoint);
    chai.expect(result.type).to.equal(ApplicationType.AUTOPILOT);
  });

  it("should always return endpoint for EXTERNAL applications", async function () {
    // Arrange
    const { applicationWithEncodedStruct } = await import(
      "../../src/applications/utils/applicationWithEncodedStruct"
    );

    const createdAt = new Date();
    const updatedAt = new Date();
    const externalEndpoint = "my-external-app.example.com:50051";

    const application = {
      ref: "123",
      name: "My External Application",
      type: ApplicationType.EXTERNAL,
      endpoint: externalEndpoint,
      createdAt,
      updatedAt
    };

    // Act
    const result = applicationWithEncodedStruct(application);

    // Assert
    chai.expect(result.endpoint).to.equal(externalEndpoint);
    chai.expect(result.type).to.equal(ApplicationType.EXTERNAL);
  });

  it("should return autopilot default endpoint for EXTERNAL applications if it matches", async function () {
    // Arrange
    const { applicationWithEncodedStruct } = await import(
      "../../src/applications/utils/applicationWithEncodedStruct"
    );

    const createdAt = new Date();
    const updatedAt = new Date();

    const application = {
      ref: "123",
      name: "My External Application with Autopilot Endpoint",
      type: ApplicationType.EXTERNAL,
      endpoint: AUTOPILOT_SPECIAL_LOCAL_ADDRESS, // Same as default but for EXTERNAL type
      createdAt,
      updatedAt
    };

    // Act
    const result = applicationWithEncodedStruct(application);

    // Assert
    chai.expect(result.endpoint).to.equal(AUTOPILOT_SPECIAL_LOCAL_ADDRESS);
    chai.expect(result.type).to.equal(ApplicationType.EXTERNAL);
  });
});
