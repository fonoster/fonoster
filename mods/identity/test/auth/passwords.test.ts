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
import { expect } from "chai";
import { createSandbox } from "sinon";
import { Prisma } from "../../src/db";
import { hashPassword, verifyPasswordDigest } from "../../src/utils/passwords";
import {
  backfillPasswordDigests,
  createVerifyUserPassword
} from "../../src/utils/userPasswords";

const sandbox = createSandbox();

describe("@identity[utils/passwords]", function () {
  afterEach(() => sandbox.restore());

  it("hashes with a fresh salt and verifies only the right password", async function () {
    const first = await hashPassword("correct horse");
    const second = await hashPassword("correct horse");

    expect(first).to.match(/^scrypt\$32768\$8\$1\$/);
    expect(first).not.to.equal(second);
    expect(await verifyPasswordDigest("correct horse", first)).to.be.true;
    expect(await verifyPasswordDigest("wrong", first)).to.be.false;
    expect(await verifyPasswordDigest("x", "not-a-digest")).to.be.false;
  });

  it("checks the digest when the user has one", async function () {
    const update = sandbox.stub();
    const prisma = { user: { update } } as unknown as Prisma;
    const user = { ref: "u1", passwordDigest: await hashPassword("pw-123456") };

    const verify = createVerifyUserPassword(prisma);

    expect(await verify(user, "pw-123456")).to.be.true;
    expect(await verify(user, "nope")).to.be.false;
    expect(update).not.to.have.been.called;
  });

  it("accepts a legacy password once, then stores a digest and clears it", async function () {
    const update = sandbox.stub().resolves();
    const prisma = { user: { update } } as unknown as Prisma;
    const verify = createVerifyUserPassword(prisma);

    expect(await verify({ ref: "u1", password: "legacy-pw" }, "wrong")).to.be
      .false;
    expect(update).not.to.have.been.called;

    expect(await verify({ ref: "u1", password: "legacy-pw" }, "legacy-pw")).to
      .be.true;
    const { where, data } = update.firstCall.args[0];
    expect(where).to.deep.equal({ ref: "u1" });
    expect(data.password).to.be.null;
    expect(await verifyPasswordDigest("legacy-pw", data.passwordDigest)).to.be
      .true;
  });

  it("rejects users without any password (GitHub or email-code users)", async function () {
    const prisma = { user: { update: sandbox.stub() } } as unknown as Prisma;
    expect(await createVerifyUserPassword(prisma)({ ref: "u1" }, "anything")).to
      .be.false;
  });

  it("backfills in batches until no legacy password is left", async function () {
    const findMany = sandbox.stub();
    findMany.onFirstCall().resolves([
      { ref: "a", password: "pw-a" },
      { ref: "b", password: "pw-b" }
    ]);
    findMany.onSecondCall().resolves([]);
    const update = sandbox.stub().resolves();
    const prisma = { user: { findMany, update } } as unknown as Prisma;

    expect(await backfillPasswordDigests(prisma)).to.equal(2);
    expect(update).to.have.been.calledTwice;
    expect(findMany.firstCall.args[0].where).to.deep.equal({
      passwordDigest: null,
      password: { not: null }
    });

    // Running again with nothing left does nothing.
    findMany.resetBehavior();
    findMany.resolves([]);
    update.resetHistory();
    expect(await backfillPasswordDigests(prisma)).to.equal(0);
    expect(update).not.to.have.been.called;
  });
});
