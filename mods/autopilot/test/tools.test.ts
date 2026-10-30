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
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { expect } from "chai";
import { toGoogleTool } from "../src/models/google/Google";
import { Tool } from "../src/tools/types";

// The Gemini function declarations @langchain/google-genai builds from Fonoster tools (#1224):
// the tool's JSON Schema reaches Gemini as is, without a detour through Zod.

const model = new ChatGoogleGenerativeAI({
  apiKey: "test",
  model: "gemini-2.5-flash"
});

function declarationsFor(tools: Tool[]) {
  const params = model.invocationParams({
    tools: tools.map(toGoogleTool)
  }) as {
    tools: { functionDeclarations: Record<string, unknown>[] }[];
  };
  return params.tools[0].functionDeclarations;
}

describe("@autopilot/tools", () => {
  it("sends the tool's properties, required, enum and descriptions", () => {
    const parameters = {
      type: "object",
      properties: {
        orderId: { type: "string", description: "The order number" },
        status: {
          type: "string",
          description: "Where the order is",
          enum: ["open", "shipped", "delivered"]
        },
        address: {
          type: "object",
          description: "Where to ship it",
          properties: {
            city: { type: "string", description: "City" },
            zip: { type: "string" }
          },
          required: ["city"]
        }
      },
      required: ["orderId", "status"]
    };
    const tool = {
      name: "update_order",
      description: "Updates an order",
      parameters
    } as unknown as Tool;

    const [declaration] = declarationsFor([tool]);

    expect(declaration.name).to.equal("update_order");
    expect(declaration.description).to.equal("Updates an order");
    expect(declaration.parameters).to.deep.equal(parameters);
  });

  it("drops JSON Schema keywords Gemini rejects", () => {
    const tool = {
      name: "lookup",
      description: "Looks up a thing",
      parameters: {
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "object",
        additionalProperties: false,
        properties: { id: { type: "string" } },
        required: ["id"]
      }
    } as unknown as Tool;

    const [declaration] = declarationsFor([tool]);

    expect(declaration.parameters).to.deep.equal({
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"]
    });
  });

  it("sends a tool without parameters as a bare declaration", () => {
    const tool = { name: "hangup", description: "Ends the call" } as Tool;

    expect(declarationsFor([tool])).to.deep.equal([
      { name: "hangup", description: "Ends the call" }
    ]);
  });
});
