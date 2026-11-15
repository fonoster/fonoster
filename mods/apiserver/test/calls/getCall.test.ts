/**
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
import { Metadata, status } from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { TEST_TOKEN, TEST_UUID } from "../utils";

chai.use(sinonChai);
const sandbox = createSandbox();

describe("@calls/getCall", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("answers NOT_FOUND naming the ref when the workspace has no such call", async function () {
    const { getCall } = await import("../../src/calls/getCall");
    const metadata = new Metadata();
    metadata.set("token", TEST_TOKEN);
    const callback = sandbox.stub();

    await getCall(sandbox.stub().resolves(null))(
      { metadata, request: { ref: TEST_UUID } } as never,
      callback
    );

    expect(callback.firstCall.args[0]).to.deep.equal({
      code: status.NOT_FOUND,
      message: `Call not found: ${TEST_UUID}`
    });
  });
});
