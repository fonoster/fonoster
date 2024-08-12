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
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";

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
      appEndpoint: "localhost:50061",
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
});
