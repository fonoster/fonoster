/**
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
import { expect } from "chai";
import { convertToolToLangchainTool } from "../src/tools/convertToolToLangchainTool";
import { Tool } from "../src/tools/types";
import { z } from "zod";

describe("@autopilot/tools", () => {
  it("should convert a Fonoster tool to a LangChain structured tool", () => {
    // Arrange
    const mockTool: Tool = {
      name: "test_tool",
      description: "A test tool",
      parameters: {
        type: "object",
        properties: {
          testString: {
            type: "string"
          },
          testNumber: {
            type: "number"
          },
          testBoolean: {
            type: "boolean"
          }
        },
        required: ["testString"]
      }
    };

    // Act
    const result = convertToolToLangchainTool(mockTool);

    // Assert
    expect(result.name).to.equal(mockTool.name);
    expect(result.description).to.equal(mockTool.description);
    expect(result.schema).to.be.instanceOf(z.ZodObject);

    // Verify the schema can be used to parse valid data
    const validData = {
      testString: "hello",
      testNumber: 42,
      testBoolean: true
    };
    const parsed = result.schema.parse(validData);
    expect(parsed).to.deep.equal(validData);

    // Verify schema validation works for invalid data
    const invalidData = {
      testString: 123, // Should be a string
      testNumber: "not a number", // Should be a number
      testBoolean: "not a boolean" // Should be a boolean
    };

    try {
      result.schema.parse(invalidData);
      expect.fail("Schema should have thrown an error for invalid data");
    } catch (error) {
      expect(error).to.exist;
    }
  });

  it("should convert a Fonoster tool with no parameters to a LangChain structured tool", () => {
    // Arrange
    const mockTool: Tool = {
      name: "test_tool",
      description: "A test tool"
    };

    // Act
    const result = convertToolToLangchainTool(mockTool);

    // Assert
    expect(result.name).to.equal(mockTool.name);
    expect(result.description).to.equal(mockTool.description);
    expect(result.schema).to.be.instanceOf(z.ZodObject);

    // Verify the schema can be used to parse valid data
    const validData = {};
    const parsed = result.schema.parse(validData);
    expect(parsed).to.deep.equal(validData);
  });
}); 