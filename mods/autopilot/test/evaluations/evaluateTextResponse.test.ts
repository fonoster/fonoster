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
import { ExpectedTextType } from "@fonoster/types";
import { expect } from "chai";
import { evaluateTextResponse } from "../../src/models/evaluations/evaluateTextResponse";

describe("evaluateTextResponse", () => {
  it("EXACT: passes when strings match", async () => {
    const result = await evaluateTextResponse(
      { type: ExpectedTextType.EXACT, response: "Hello" },
      "Hello",
      async () => true
    );
    expect(result.passed).to.be.true;
    expect(result.errorMessage).to.be.undefined;
  });

  it("EXACT: fails when strings differ", async () => {
    const result = await evaluateTextResponse(
      { type: ExpectedTextType.EXACT, response: "Hello" },
      "Hi",
      async () => true
    );
    expect(result.passed).to.be.false;
    expect(result.errorMessage).to.include("Expected exact response");
    expect(result.errorMessage).to.include("Hello");
    expect(result.errorMessage).to.include("Hi");
  });

  it("SIMILAR: passes when similarity returns true", async () => {
    const result = await evaluateTextResponse(
      { type: ExpectedTextType.SIMILAR, response: "Bye" },
      "Goodbye!",
      async () => true
    );
    expect(result.passed).to.be.true;
  });

  it("SIMILAR: fails when similarity returns false", async () => {
    const result = await evaluateTextResponse(
      { type: ExpectedTextType.SIMILAR, response: "Yes" },
      "No",
      async () => false
    );
    expect(result.passed).to.be.false;
    expect(result.errorMessage).to.include("Expected similar response");
  });
});
