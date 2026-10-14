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
import { createGenerateVerificationCode } from "../../src/utils/createGenerateVerificationCode";
import { createIsValidVerificationCode } from "../../src/utils/createIsValidVerificationCode";
import { createRateLimiter } from "../../src/utils/rateLimiter";
import { ContactType } from "../../src/verification/types";

const sandbox = createSandbox();

const codeRecord = (overrides: Record<string, unknown> = {}) => ({
  ref: "c1",
  code: "123456",
  attempts: 0,
  consumedAt: null,
  ...overrides
});

function prismaWith(current: unknown, consumedCount = 1) {
  return {
    verificationCode: {
      deleteMany: sandbox.stub().resolves(),
      create: sandbox.stub().resolves(),
      findFirst: sandbox.stub().resolves(current),
      update: sandbox.stub().resolves(),
      updateMany: sandbox.stub().resolves({ count: consumedCount })
    }
  };
}

describe("@identity[utils/verificationCodes]", function () {
  afterEach(() => sandbox.restore());

  it("issues a 6-digit code and invalidates earlier unused codes", async function () {
    const prisma = prismaWith(null);
    const code = await createGenerateVerificationCode(
      prisma as unknown as Prisma
    )({ type: ContactType.EMAIL, value: " Ana@Example.com " });

    expect(code).to.match(/^\d{6}$/);
    expect(prisma.verificationCode.deleteMany).to.have.been.calledWith({
      where: { type: ContactType.EMAIL, value: "ana@example.com", consumedAt: null }
    });
    expect(
      prisma.verificationCode.create.firstCall.args[0].data.value
    ).to.equal("ana@example.com");
  });

  it("only looks at live codes: unexpired, unconsumed, under 5 attempts", async function () {
    const prisma = prismaWith(null);
    const isValid = createIsValidVerificationCode(prisma as unknown as Prisma);

    expect(
      await isValid({ type: ContactType.EMAIL, value: "a@b.co", code: "123456" })
    ).to.be.false;

    const { where } = prisma.verificationCode.findFirst.firstCall.args[0];
    expect(where.consumedAt).to.be.null;
    expect(where.attempts).to.deep.equal({ lt: 5 });
    expect(where.expiresAt.gt).to.be.instanceOf(Date);
  });

  it("consumes a matching code", async function () {
    const prisma = prismaWith(codeRecord());
    const isValid = createIsValidVerificationCode(prisma as unknown as Prisma);

    expect(
      await isValid({ type: ContactType.EMAIL, value: "a@b.co", code: "123456" })
    ).to.be.true;
    expect(prisma.verificationCode.updateMany.firstCall.args[0].where).to.deep.equal(
      { ref: "c1", consumedAt: null }
    );
  });

  it("counts a wrong guess against the code", async function () {
    const prisma = prismaWith(codeRecord());
    const isValid = createIsValidVerificationCode(prisma as unknown as Prisma);

    expect(
      await isValid({ type: ContactType.EMAIL, value: "a@b.co", code: "000000" })
    ).to.be.false;
    expect(prisma.verificationCode.update).to.have.been.calledWith({
      where: { ref: "c1" },
      data: { attempts: { increment: 1 } }
    });
    expect(prisma.verificationCode.updateMany).not.to.have.been.called;
  });

  it("lets only one of two concurrent requests use a code", async function () {
    const prisma = prismaWith(codeRecord(), 0);
    const isValid = createIsValidVerificationCode(prisma as unknown as Prisma);

    expect(
      await isValid({ type: ContactType.EMAIL, value: "a@b.co", code: "123456" })
    ).to.be.false;
  });
});

describe("@identity[utils/rateLimiter]", function () {
  it("allows the limit per window, then refuses until the window resets", function () {
    const tryConsume = createRateLimiter({ limit: 2, windowMs: 1000 });

    expect(tryConsume("a", 0)).to.be.true;
    expect(tryConsume("a", 10)).to.be.true;
    expect(tryConsume("a", 20)).to.be.false;
    expect(tryConsume("b", 20)).to.be.true;
    expect(tryConsume("a", 1000)).to.be.true;
  });
});
