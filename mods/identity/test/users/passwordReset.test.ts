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
import { expect } from "chai";
import { createSandbox } from "sinon";
import {
  RESET_PASSWORD_ATTEMPT_LIMITS,
  VERIFICATION_CODE_SEND_LIMITS
} from "../../src/constants";
import { Prisma } from "../../src/db";
import { IdentityConfig } from "../../src/exchanges/types";
import { createResetPassword } from "../../src/users/createResetPassword";
import { createSendResetPasswordCode } from "../../src/users/createSendResetPasswordCode";

// H5: reset requests and attempts are rate limited per email and per IP, and a
// reset signs the user out everywhere. (The emailed link is checked end to end
// in the standalone service test, which catches the email.)

const sandbox = createSandbox();

const fromIp = (ip: string) => {
  const metadata = new Metadata();
  metadata.set("x-forwarded-for", ip);
  return metadata;
};

function invoke(handler: Function, call: unknown) {
  return new Promise<{ error?: { code: number } | null }>((resolve) =>
    handler(call, (error: { code: number } | null) => resolve({ error }))
  );
}

describe("@identity[users/password reset]", function () {
  afterEach(() => sandbox.restore());

  describe("SendResetPasswordCode", function () {
    // Unknown emails: no email is sent, so the limit is all that's exercised.
    const prisma = () =>
      ({
        user: { findUnique: sandbox.stub().resolves(null) }
      }) as unknown as Prisma;
    const config = { issuer: "https://id.test" } as IdentityConfig;

    it("limits requests per email, the same way for unknown emails", async function () {
      const handler = createSendResetPasswordCode(prisma(), config);
      const { perEmail } = VERIFICATION_CODE_SEND_LIMITS;

      for (let i = 0; i < perEmail; i++) {
        const { error } = await invoke(handler, {
          metadata: fromIp(`10.0.0.${i}`),
          request: { username: "ana@acme.com" }
        });
        expect(error).to.be.null;
      }

      const { error } = await invoke(handler, {
        metadata: fromIp("10.0.1.1"),
        request: { username: "ANA@acme.com" }
      });
      expect(error).to.include({ code: status.RESOURCE_EXHAUSTED });
    });

    it("limits requests per client IP across emails", async function () {
      const handler = createSendResetPasswordCode(prisma(), config);
      const { perIp } = VERIFICATION_CODE_SEND_LIMITS;

      for (let i = 0; i < perIp; i++) {
        const { error } = await invoke(handler, {
          metadata: fromIp("10.0.0.9"),
          request: { username: `user${i}@acme.com` }
        });
        expect(error).to.be.null;
      }

      const { error } = await invoke(handler, {
        metadata: fromIp("10.0.0.9"),
        request: { username: "another@acme.com" }
      });
      expect(error).to.include({ code: status.RESOURCE_EXHAUSTED });
    });
  });

  describe("ResetPassword", function () {
    const prismaWithCode = (code: string | null) => {
      const updateMany = sandbox.stub().resolves({ count: 1 });
      const tokens = sandbox.stub().resolves({ count: 2 });
      const prisma = {
        verificationCode: {
          deleteMany: sandbox.stub().resolves({ count: 0 }),
          findFirst: sandbox
            .stub()
            .resolves(code ? { ref: "c1", code } : null),
          update: sandbox.stub().resolves({}),
          updateMany
        },
        user: {
          update: sandbox
            .stub()
            .resolves({ ref: "u1", accessKeyId: "USuser0001" })
        },
        refreshToken: { updateMany: tokens }
      } as unknown as Prisma;
      return { prisma, tokens };
    };

    it("revokes the user's refresh tokens when the password changes", async function () {
      const { prisma, tokens } = prismaWithCode("123456");
      const { error } = await invoke(createResetPassword(prisma), {
        metadata: fromIp("10.0.0.1"),
        request: {
          username: "ana@acme.com",
          password: "a-new-passw0rd",
          verificationCode: "123456"
        }
      });

      expect(error).to.be.null;
      expect(tokens.firstCall.args[0].where).to.include({
        accessKeyId: "USuser0001"
      });
    });

    it("limits attempts per email", async function () {
      const { prisma } = prismaWithCode(null);
      const handler = createResetPassword(prisma);
      const { perEmail } = RESET_PASSWORD_ATTEMPT_LIMITS;
      const attempt = (i: number) =>
        invoke(handler, {
          metadata: fromIp(`10.1.0.${i}`),
          request: {
            username: "ana@acme.com",
            password: "a-new-passw0rd",
            verificationCode: "000000"
          }
        });

      for (let i = 0; i < perEmail; i++) {
        expect((await attempt(i)).error).to.include({
          code: status.PERMISSION_DENIED
        });
      }
      expect((await attempt(99)).error).to.include({
        code: status.RESOURCE_EXHAUSTED
      });
    });
  });
});
