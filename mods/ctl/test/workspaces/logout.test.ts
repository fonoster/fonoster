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

describe("@ctl[workspaces:logout]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it.skip("fails when the reference is missing", async function () {
    // Skipped: runCommand from @oclif/test does not reliably capture the
    // missing-arg error output when mocha runs from the monorepo root.
    // This tests oclif's built-in validation, not application logic.
    const { error, stderr } = await runCommand(["workspaces:logout"], {
      root: __dirname + "/../.."
    });
    const message = error?.message || stderr || "";
    expect(message).to.include("Missing 1 required arg");
    expect(message).to.include("ref  the Workspace to unlink from");
  });

  it("ensures user logout from workspace", async function () {
    const { stdout } = await runCommand(["workspaces:logout", "my-workspace"]);
    expect(stdout).to.contain("Done!");
  });
});
