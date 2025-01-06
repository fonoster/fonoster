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
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinonChai from "sinon-chai";
import { MappingTuple } from "../src/client/types";

chai.use(chaiAsPromised);
chai.use(sinonChai);

enum ExampleEnum {
  VALUE1 = 0,
  VALUE2 = 1
}

const enumMapping = [["test", ExampleEnum]] as MappingTuple<unknown>;

describe("@sdk[client/utils]", function () {
  it("should verify if a key is an enum", async function () {
    // Arrange
    const { isMapping } = await import("../src/client/utils");

    // Act
    const result = isMapping("test", enumMapping);

    // Assert
    expect(result).to.be.true;
  });

  it("should return the enum value", async function () {
    // Arrange
    const { getEnumValue } = await import("../src/client/utils");

    // Act
    const result = getEnumValue("test", "VALUE1", enumMapping);

    // Assert
    expect(result).to.be.equal(ExampleEnum.VALUE1);
  });

  it("should return the enum key", async function () {
    // Arrange
    const { getEnumKey } = await import("../src/client/utils");

    // Act
    const result = getEnumKey("test", ExampleEnum.VALUE1, enumMapping);

    // Assert
    expect(result).to.be.equal("VALUE1");
  });
});
