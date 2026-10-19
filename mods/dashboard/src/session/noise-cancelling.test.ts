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
import {
  filtersFor,
  noiseCancellingOf,
  noiseCancellingOptions
} from "./noise-cancelling";

const aic = { id: "aicoustics", label: "ai-coustics" };
const tuned = { name: "aiCoustics", options: { enhancementLevel: 0.6 } };
const other = { name: "test-mute" };

describe("noise cancelling select", () => {
  it("reads the nc provider behind the filters, wherever it sits", () => {
    expect(noiseCancellingOf(undefined)).toBe("none");
    expect(noiseCancellingOf([other])).toBe("none");
    expect(noiseCancellingOf([other, tuned])).toBe("aicoustics");
  });

  it("offers None, the catalog's nc providers, and a saved one that is no longer offered", () => {
    expect(
      noiseCancellingOptions([aic], undefined).map((o) => o.value)
    ).toEqual(["none", "aicoustics"]);
    expect(noiseCancellingOptions([], [tuned]).map((o) => o.label)).toEqual([
      "None",
      "aicoustics (unavailable)"
    ]);
  });

  it("changes only the noise-cancelling entry and keeps tuned options", () => {
    expect(filtersFor("aicoustics", undefined)).toEqual([
      { name: "aiCoustics" }
    ]);
    expect(filtersFor("aicoustics", [other, tuned])).toEqual([tuned, other]);
    expect(filtersFor("none", [other, tuned])).toEqual([other]);
    expect(filtersFor("krisp", [tuned])).toEqual([tuned]);
  });
});
