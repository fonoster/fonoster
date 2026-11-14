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
import { NumbersApi } from "@fonoster/types";
import * as grpc from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { getExtendedFieldsHelper } from "./getExtendedFieldsHelper";
import { TEST_TOKEN } from "./testToken";

chai.use(sinonChai);
const sandbox = createSandbox();

describe("@sipnet[numbers/updateNumber] aliases", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  async function update(request: Record<string, unknown>) {
    const { updateNumber } = await import("../src/numbers/updateNumber");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    metadata.set("accessKeyId", "GRahn02s8tgdfghz72vb0fz538qpb5z35p");
    const numbers = {
      updateNumber: sandbox.stub().resolves({ ref: "123" }),
      getNumber: getExtendedFieldsHelper(sandbox)
    } as unknown as NumbersApi;
    const callback = sandbox.stub();
    await updateNumber(numbers, sandbox.stub())(
      { metadata, request: { ref: "123", ...request } },
      callback
    );
    return { numbers, callback };
  }

  it("replaces the aliases with a non-empty list", async function () {
    // Act
    const { numbers, callback } = await update({ aliases: ["01234", "5678"] });

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly(null, { ref: "123" });
    const sent = (numbers.updateNumber as sinon.SinonStub).firstCall.args[0];
    expect(sent.aliases).to.deep.equal(["01234", "5678"]);
    expect(sent).to.not.have.property("clearAliases");
  });

  it("keeps the aliases when the request has none", async function () {
    // Act
    const { numbers } = await update({ name: "Renamed", aliases: [] });

    // Assert
    const sent = (numbers.updateNumber as sinon.SinonStub).firstCall.args[0];
    expect(sent).to.not.have.property("aliases");
    expect(sent).to.not.have.property("clearAliases");
  });

  it("removes every alias with clearAliases", async function () {
    // Act
    const { numbers } = await update({ clearAliases: true });

    // Assert
    const sent = (numbers.updateNumber as sinon.SinonStub).firstCall.args[0];
    expect(sent.clearAliases).to.equal(true);
  });
});
