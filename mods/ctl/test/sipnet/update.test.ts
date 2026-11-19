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
import { refChange } from "../../src/utils/refChange";

describe("@ctl[sipnet:*:update] references", function () {
  it("sends \"\" when a set reference moves to None", function () {
    expect(refChange(null, "trunk-1")).to.equal("");
  });

  it("sends the new reference when it changes", function () {
    expect(refChange("trunk-2", "trunk-1")).to.equal("trunk-2");
    expect(refChange("trunk-2", undefined)).to.equal("trunk-2");
  });

  it("sends nothing when the reference is unchanged", function () {
    expect(refChange("trunk-1", "trunk-1")).to.equal(undefined);
    expect(refChange(null, undefined)).to.equal(undefined);
    expect(refChange(null, "")).to.equal(undefined);
  });
});
