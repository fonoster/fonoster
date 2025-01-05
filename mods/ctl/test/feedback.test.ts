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
import { runCommand } from "@oclif/test";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@ctl[feedback]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("ensures it contains the feedback link", async function () {
    const { stdout } = await runCommand("feedback");
    expect(stdout).to.contain(
      "Please provide feedback on your experience by filling out the form below:"
    );
    expect(stdout).to.contain(
      "https://docs.google.com/forms/d/e/1FAIpQLSd1G2ahRYqkbksOvz7XhNHfSLepUh3KzRHsXh2HXfZr68nhtQ/viewform?vc=0&c=0&w=1&flr=0"
    );
  });
});
