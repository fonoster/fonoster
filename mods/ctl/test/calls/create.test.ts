/**
 * Copyright (C) 2026 by Fonoster Inc (https://fonoster.com)
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
import * as SDK from "@fonoster/sdk";
import { runCommand } from "@oclif/test";
import * as chai from "chai";
import { expect } from "chai";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { stubClient } from "../helpers";

chai.use(sinonChai);
const sandbox = createSandbox();

async function* statuses(...list: string[]) {
  for (const status of list) yield { status };
}

describe("@ctl[sipnet:calls:create]", function () {
  beforeEach(function () {
    stubClient(sandbox);
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("places a call and prints each status until a final one", async function () {
    const create = sandbox.stub(SDK.Calls.prototype, "createCall").resolves({
      ref: "call-1",
      statusStream: statuses(
        "TRYING",
        "PROGRESS",
        "ANSWER",
        "NEVER-SHOWN"
      ) as never
    });

    const { stdout } = await runCommand([
      "sipnet:calls:create",
      "-f",
      "+17853178070",
      "-t",
      "+18287854037",
      "-a",
      "app-1",
      "-m",
      '{"name":"Jane"}'
    ]);

    expect(create.firstCall.args[0]).to.deep.equal({
      from: "+17853178070",
      to: "+18287854037",
      appRef: "app-1",
      timeout: 30,
      metadata: { name: "Jane" }
    });
    expect(stdout).to.contain("Call created: call-1");
    expect(stdout).to.contain("Call status: TRYING");
    expect(stdout).to.contain("Call status: ANSWER");
    expect(stdout).to.not.contain("NEVER-SHOWN");
  });

  it("returns right away with --detach", async function () {
    sandbox.stub(SDK.Calls.prototype, "createCall").resolves({
      ref: "call-2",
      statusStream: statuses("TRYING") as never
    });

    const { stdout } = await runCommand([
      "sipnet:calls:create",
      "-f",
      "+1",
      "-t",
      "+2",
      "-a",
      "app-1",
      "--detach"
    ]);

    expect(stdout).to.contain("Call created: call-2");
    expect(stdout).to.not.contain("Call status");
  });

  it("rejects metadata that is not JSON", async function () {
    const create = sandbox.stub(SDK.Calls.prototype, "createCall");

    const { error } = await runCommand([
      "sipnet:calls:create",
      "-f",
      "+1",
      "-t",
      "+2",
      "-a",
      "app-1",
      "-m",
      "{oops"
    ]);

    expect(error?.message).to.contain("--metadata must be a JSON object");
    expect(create).to.not.have.been.called;
  });
});
