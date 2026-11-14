/**
 * Copyright (C) 2026 by Fonoster Inc (https://fonoster.com)
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
import { parseAliases } from "../../src/utils/parseAliases";

describe("@ctl[sipnet:numbers] aliases", function () {
  it("splits on commas, trims, and drops empty parts and repeats", function () {
    expect(parseAliases(" 01234 ,5678, ,01234")).to.deep.equal([
      "01234",
      "5678"
    ]);
  });

  it("reads an empty answer as no aliases", function () {
    expect(parseAliases("")).to.deep.equal([]);
  });
});
