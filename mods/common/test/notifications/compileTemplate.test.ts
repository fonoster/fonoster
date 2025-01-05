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
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@apiserver[common/notifications/compileTemplate]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should compile a template", async function () {
    // Arrange
    const { compileTemplate } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("../../src/notifications/compileTemplate");

    const fsStub = sandbox.replace(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("fs"),
      "existsSync",
      sandbox.stub().returns(true)
    );

    sandbox.replace(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("fs"),
      "readFileSync",
      sandbox.stub().returns("Hello {{name}}!")
    );

    // Act
    const result = compileTemplate({
      filePath: "path/to/template.hbs",
      data: { name: "World" }
    });

    // Assert
    expect(result).to.equal("Hello World!");
    expect(fsStub).to.have.been.calledOnce;
    expect(fsStub).to.have.been.calledWith("path/to/template.hbs");
  });
});
