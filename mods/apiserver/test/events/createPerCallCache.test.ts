/* eslint-disable prettier/prettier */
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
import { createPerCallCache } from "../../src/events/createPerCallCache";

describe("@events/createPerCallCache", function () {
  it("should return undefined for a key that was never set", function () {
    // Arrange
    const cache = createPerCallCache<string>(1000);

    // Act & Assert
    expect(cache.get("missing")).to.be.undefined;
  });

  it("should return the last value set for a key", function () {
    // Arrange
    const cache = createPerCallCache<string>(1000);

    // Act
    cache.set("call-1", "ref-1");
    cache.set("call-1", "ref-2");

    // Assert
    expect(cache.get("call-1")).to.equal("ref-2");
  });

  it("should keep entries for different keys independent", function () {
    // Arrange
    const cache = createPerCallCache<string>(1000);

    // Act
    cache.set("call-1", "ref-1");
    cache.set("call-2", "ref-2");

    // Assert
    expect(cache.get("call-1")).to.equal("ref-1");
    expect(cache.get("call-2")).to.equal("ref-2");
  });
});
