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

describe("@sdk[client/jsonToObject]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should return a new instance of the object", async function () {
    // Arrange
    const { jsonToObject } = await import("../src/client/jsonToObject");
    class CreateExampleRequest {
      private name: string;
      private marray: string[];

      public setName(name: string): void {
        this.name = name;
      }

      public getName(): string {
        return this.name;
      }

      public setMarray(marray: string[]): void {
        this.marray = marray;
      }

      public getMarray(): string[] {
        return this.marray;
      }
    }

    const jsonObj = {
      name: "test",
      marray: ["test1", "test2"]
    };

    // Act
    const result = jsonToObject<{ name: string }, CreateExampleRequest>(
      jsonObj,
      CreateExampleRequest
    );

    // Assert
    expect(result).to.be.an.instanceOf(Object);
    expect(result.getName()).to.be.equal(jsonObj.name);
    expect(result.getMarray()).to.be.eql(jsonObj.marray);
  });
});
