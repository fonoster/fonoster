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
import * as grpc from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import { Prisma } from "../../src/core/db";
import { createCheckNumberPreconditions } from "../../src/utils/createCheckNumberPreconditions";

chai.use(chaiAsPromised);
const sandbox = createSandbox();

// RV-B4: a number may only point at an application of the caller's workspace.
describe("@apiserver/checkNumberPreconditions", function () {
  afterEach(() => sandbox.restore());

  it("looks the application up in the caller's workspace only", async function () {
    const findUnique = sandbox.stub().resolves(null);
    const check = createCheckNumberPreconditions({
      application: { findUnique }
    } as unknown as Prisma);
    await expect(
      check({ appRef: "theirs", accessKeyId: "WO-mine" })
    ).to.be.rejected.and.eventually.have.property(
      "code",
      grpc.status.INVALID_ARGUMENT
    );
    expect(findUnique.firstCall.args[0]).to.deep.equal({
      where: { ref: "theirs", accessKeyId: "WO-mine" }
    });
  });

  it("refuses to link an application without the caller's workspace", async function () {
    const findUnique = sandbox.stub().resolves({ ref: "any" });
    const check = createCheckNumberPreconditions({
      application: { findUnique }
    } as unknown as Prisma);
    await expect(
      check({ appRef: "any", accessKeyId: undefined })
    ).to.be.rejected.and.eventually.have.property(
      "code",
      grpc.status.PERMISSION_DENIED
    );
    expect(findUnique).not.to.have.been.called;
  });
});
