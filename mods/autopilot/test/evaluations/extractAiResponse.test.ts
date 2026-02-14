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
import { extractAiResponse } from "../../src/models/evaluations/extractAiResponse";

describe("extractAiResponse", () => {
  const baseConfig = {
    conversationSettings: {
      goodbyeMessage: "Bye!",
      transferOptions: { message: "Transferring..." }
    },
    languageModel: {},
    eventsHook: undefined,
    testCases: undefined
  } as Parameters<typeof extractAiResponse>[1];

  it("returns content when no tool calls", () => {
    const out = extractAiResponse(
      { type: "say", content: "Hello there" },
      baseConfig
    );
    expect(out).to.equal("Hello there");
  });

  it("returns goodbyeMessage when first tool is hangup", () => {
    const out = extractAiResponse(
      {
        type: "hangup",
        toolCalls: [{ name: "hangup", args: {} }] as never
      },
      baseConfig
    );
    expect(out).to.equal("Bye!");
  });

  it("returns transfer message when first tool is transfer", () => {
    const out = extractAiResponse(
      {
        type: "transfer",
        toolCalls: [{ name: "transfer", args: {} }] as never
      },
      baseConfig
    );
    expect(out).to.equal("Transferring...");
  });

  it("returns content when first tool is not hangup/transfer", () => {
    const out = extractAiResponse(
      {
        type: "say",
        content: "Ok",
        toolCalls: [{ name: "book", args: {} }] as never
      },
      baseConfig
    );
    expect(out).to.equal("Ok");
  });
});
