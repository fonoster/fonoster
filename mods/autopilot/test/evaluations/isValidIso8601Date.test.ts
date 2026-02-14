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
import { isValidIso8601Date } from "../../src/models/evaluations/isValidIso8601Date";

describe("isValidIso8601Date", () => {
  it("returns true for valid ISO 8601 date string", () => {
    expect(isValidIso8601Date("2024-01-15")).to.be.true;
    expect(isValidIso8601Date("2024-01-15T12:00:00Z")).to.be.true;
  });

  it("returns false for non-string", () => {
    expect(isValidIso8601Date(123)).to.be.false;
    expect(isValidIso8601Date(null)).to.be.false;
  });

  it("returns false for invalid date string", () => {
    expect(isValidIso8601Date("not-a-date")).to.be.false;
    expect(isValidIso8601Date("")).to.be.false;
  });
});
