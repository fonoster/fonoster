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
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@sdk[client/objectToJson]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should return a object from a json", async function () {
    // Arrange
    const { objectToJson } = await import("../src/client/objectToJson");
    class Example {
      public getFoo(): string {
        return "foo";
      }

      public getBar(): string {
        return "bar";
      }

      public getBaz(): string {
        return "baz";
      }
    }

    const obj = new Example() as unknown as new () => unknown;

    type CreateExampleRequest = {
      foo: string;
      bar: string;
      baz: string;
    };

    // Act
    const result = objectToJson<CreateExampleRequest>(obj);

    // Assert
    expect(result).to.deep.equal({
      foo: "foo",
      bar: "bar",
      baz: "baz"
    });
  });
});
