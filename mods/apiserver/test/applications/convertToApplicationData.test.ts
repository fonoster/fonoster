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
import { ApplicationType } from "@prisma/client";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@applications/convertToApplicationData", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("it should convert a create or update request to application data", async function () {
    // Arrange
    const { convertToApplicationData } = await import(
      "../../src/applications/utils/convertToApplicationData"
    );

    const request = {
      ref: "123",
      name: "My Application",
      type: "STREAMS" as ApplicationType,
      appEndpoint: "localhost:50061",
      textToSpeech: {
        productRef: "123",
        secretRef: "123",
        config: {
          fields: {
            voice: {
              stringValue: "angela"
            }
          }
        }
      },
      speechToText: {
        productRef: "123",
        secretRef: "123",
        config: {
          fields: {
            languageCode: {
              stringValue: "en-US"
            }
          }
        }
      }
    };

    // Act
    const result = convertToApplicationData(request);

    // Assert
    chai.expect(result).to.deep.equal({
      ref: "123",
      name: "My Application",
      type: "STREAMS",
      appEndpoint: "localhost:50061",
      textToSpeech: {
        create: {
          productRef: "123",
          secretRef: "123",
          config: {
            voice: "angela"
          }
        }
      },
      speechToText: {
        create: {
          productRef: "123",
          secretRef: "123",
          config: {
            languageCode: "en-US"
          }
        }
      }
    });
  });
});
