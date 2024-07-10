/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinonChai from "sinon-chai";
import { EnumMapping } from "../src/client/types";

chai.use(chaiAsPromised);
chai.use(sinonChai);

enum ExampleEnum {
  VALUE1 = 0,
  VALUE2 = 1
}

const enumMapping = [["test", ExampleEnum]] as EnumMapping<unknown>;

describe("@sdk[client/enumUtils]", function () {
  it("should verify if a key is an enum", async function () {
    // Arrange
    const { isEnum } = await import("../src/client/enumsUtil");

    // Act
    const result = isEnum("test", enumMapping);

    // Assert
    expect(result).to.be.true;
  });

  it("should return the enum value", async function () {
    // Arrange
    const { getEnumValue } = await import("../src/client/enumsUtil");

    // Act
    const result = getEnumValue("test", "VALUE1", enumMapping);

    // Assert
    expect(result).to.be.equal(ExampleEnum.VALUE1);
  });
});
