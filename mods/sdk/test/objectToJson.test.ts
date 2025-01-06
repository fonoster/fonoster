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

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("@sdk[client/objectToJson]", function () {
  it("should return a object from a json", async function () {
    // Arrange
    const { objectToJson } = await import("../src/client/objectToJson");

    enum ExampleEnum {
      FOO = 0,
      BAR = 1,
      BAZ = 2
    }

    class RepeatableObject {
      private value: string;

      public getValue(): string {
        return this.value;
      }

      public setValue(value: string): void {
        this.value = value;
      }
    }

    class Example {
      public getFoo(): string {
        return "foo";
      }

      public getBar(): string {
        return "bar";
      }

      public getBaz(): ExampleEnum {
        return ExampleEnum.BAZ;
      }

      public getItemsList(): Array<RepeatableObject> {
        const items = ["foo", "bar", "baz"];
        return items.map((item) => {
          const obj = new RepeatableObject();
          obj.setValue(item);
          return obj;
        });
      }
    }

    const obj = new Example() as unknown as new () => unknown;

    type CreateExampleResponse = {
      foo: string;
      bar: string;
      baz: ExampleEnum;
      items: Array<{ value: string }>;
    };

    // Act
    const result = objectToJson<CreateExampleResponse>(
      obj,
      [["baz", ExampleEnum]],
      null,
      [["itemsList", RepeatableObject]]
    );

    // Assert
    expect(result).to.deep.equal({
      foo: "foo",
      bar: "bar",
      baz: "BAZ",
      items: [
        {
          value: "foo"
        },
        {
          value: "bar"
        },
        {
          value: "baz"
        }
      ]
    });
  });
});
