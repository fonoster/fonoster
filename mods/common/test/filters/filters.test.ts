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
import { expect } from "chai";
import { FILTER_BY_PROVIDER, parseFilters } from "../../src/filters";

describe("@common/filters", function () {
  it("accepts a known filter with public options", function () {
    expect(parseFilters([{ name: "aiCoustics" }])).to.deep.equal([
      { name: "aiCoustics" }
    ]);
    expect(
      parseFilters([{ name: "aiCoustics", options: { enhancementLevel: 0.8 } }])
    ).to.deep.equal([
      { name: "aiCoustics", options: { enhancementLevel: 0.8 } }
    ]);
    expect(parseFilters([])).to.deep.equal([]);
  });

  it("rejects server-side options, keys and unknown filters", function () {
    expect(() =>
      parseFilters([
        { name: "aiCoustics", options: { modelFile: "/etc/passwd" } }
      ])
    ).to.throw(/aiCoustics.*modelFile/);
    expect(() =>
      parseFilters([{ name: "aiCoustics", options: { license: "abc" } }])
    ).to.throw(/license/);
    expect(() =>
      parseFilters([{ name: "aiCoustics", options: { enhancementLevel: 2 } }])
    ).to.throw(/enhancementLevel/);
    expect(() =>
      parseFilters([{ name: "aiCoustics", options: { model: "../x" } }])
    ).to.throw(/model/);
    expect(() => parseFilters([{ name: "krisp" }])).to.throw(
      'unknown audio filter "krisp"'
    );
    expect(() => parseFilters("aiCoustics")).to.throw(/list/);
  });

  it("maps the nc provider to its filter", function () {
    expect(FILTER_BY_PROVIDER.aicoustics).to.equal("aiCoustics");
  });
});
