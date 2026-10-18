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
import { SIGN_IN_FAILURE_LIMITS } from "../../src/constants";
import { Prisma } from "../../src/db";
import { createExchangeCredentials } from "../../src/exchanges/createExchangeCredentials";
import { createExchangeOauth2Code } from "../../src/exchanges/createExchangeOauth2Code";
import { createExchangeVerificationCode } from "../../src/exchanges/createExchangeVerificationCode";
import { IdentityConfig } from "../../src/exchanges/types";
import { hashPassword } from "../../src/utils/passwords";
import { createSignInThrottle } from "../../src/utils/signInThrottle";
import { createVerifyCode } from "../../src/verification/createVerifyCode";
import { TEST_PRIVATE_KEY } from "../utils";

// M1: failed sign-ins are throttled per email and per IP.
// M2: an account whose email was never verified loses its password when the
// address's owner signs in with an emailed code or GitHub, and an email code
// verifies only the account with that email.

const sandbox = createSandbox();

const config = (methods: IdentityConfig["auth"]["methods"]) =>
  ({
    auth: { methods, signup: "open" },
    issuer: "https://id.test",
    audience: "api",
    privateKey: TEST_PRIVATE_KEY,
    idTokenExpiresIn: "15m",
    accessTokenExpiresIn: "15m",
    refreshTokenExpiresIn: "24h",
    githubOauth2Config: {
      clientId: "id",
      clientSecret: "secret",
      url: "https://github.test",
      apiUrl: "https://api.github.test"
    }
  }) as IdentityConfig;

const fromIp = (ip: string) => {
  const metadata = new Metadata();
  metadata.set("x-forwarded-for", ip);
  return metadata;
};

function invoke(handler: Function, call: unknown) {
  return new Promise<{ error?: { code: number } | null; response?: unknown }>(
    (resolve) =>
      handler(call, (error: { code: number } | null, response: unknown) =>
        resolve({ error, response })
      )
  );
}

const user = (overrides: Record<string, unknown> = {}) => ({
  ref: "u1",
  accessKeyId: "USuser0001",
  email: "ana@acme.com",
  emailVerified: true,
  ownedWorkspaces: [],
  memberships: [],
  ...overrides
});

describe("@identity[sign-in protection]", function () {
  afterEach(() => sandbox.restore());

  describe("createSignInThrottle", function () {
    const limits = { perEmail: 3, perIp: 5, windowMs: 1000 };

    it("blocks an email after its limit of failures, for one window", function () {
      const throttle = createSignInThrottle(limits);

      for (let i = 0; i < 3; i++) {
        expect(throttle.isBlocked("ana@acme.com", `10.0.0.${i}`, 0)).to.be
          .false;
        throttle.recordFailure("ana@acme.com", `10.0.0.${i}`, 0);
      }

      expect(throttle.isBlocked("ANA@acme.com ", "10.9.9.9", 10)).to.be.true;
      expect(throttle.isBlocked("bob@acme.com", "10.9.9.9", 10)).to.be.false;
      expect(throttle.isBlocked("ana@acme.com", "10.9.9.9", 1010)).to.be.false;
    });

    it("blocks an IP after its limit of failures across emails", function () {
      const throttle = createSignInThrottle(limits);

      for (let i = 0; i < 5; i++)
        throttle.recordFailure(`user${i}@acme.com`, "10.0.0.9", 0);

      expect(throttle.isBlocked("new@acme.com", "10.0.0.9", 1)).to.be.true;
      expect(throttle.isBlocked("new@acme.com", "10.0.0.8", 1)).to.be.false;
    });
  });

  describe("ExchangeCredentials", function () {
    it("refuses sign-in, even with the right password, after too many failures", async function () {
      const findFirst = sandbox
        .stub()
        .resolves(
          user({ passwordDigest: await hashPassword("right-passw0rd") })
        );
      const prisma = {
        user: { findFirst },
        refreshToken: {
          create: sandbox.stub().resolves({}),
          deleteMany: sandbox.stub().resolves({ count: 0 })
        }
      } as unknown as Prisma;
      const handler = createExchangeCredentials(
        prisma,
        config(["password"]),
        createSignInThrottle()
      );
      const attempt = (password: string, ip: string) =>
        invoke(handler, {
          metadata: fromIp(ip),
          request: { username: "ana@acme.com", password }
        });

      for (let i = 0; i < SIGN_IN_FAILURE_LIMITS.perEmail; i++) {
        const { error } = await attempt("wrong-passw0rd", `10.0.0.${i}`);
        expect(error).to.include({ code: status.PERMISSION_DENIED });
      }

      const lookups = findFirst.callCount;
      const { error } = await attempt("right-passw0rd", "10.0.1.1");

      expect(error).to.include({ code: status.RESOURCE_EXHAUSTED });
      expect(findFirst.callCount).to.equal(lookups);
    });

    it("doesn't count successful sign-ins", async function () {
      const prisma = {
        user: {
          findFirst: sandbox
            .stub()
            .resolves(
              user({ passwordDigest: await hashPassword("right-passw0rd") })
            )
        },
        refreshToken: {
          create: sandbox.stub().resolves({}),
          deleteMany: sandbox.stub().resolves({ count: 0 })
        }
      } as unknown as Prisma;
      const handler = createExchangeCredentials(
        prisma,
        config(["password"]),
        createSignInThrottle()
      );

      for (let i = 0; i < SIGN_IN_FAILURE_LIMITS.perEmail + 2; i++) {
        const { error, response } = await invoke(handler, {
          metadata: fromIp("10.0.0.1"),
          request: { username: "ana@acme.com", password: "right-passw0rd" }
        });
        expect(error).to.be.null;
        expect(response).to.have.property("accessToken");
      }
    });
  });

  describe("ExchangeVerificationCode", function () {
    const prismaWith = (
      existing: Record<string, unknown>,
      validCode = true
    ) => {
      const updateUser = sandbox
        .stub()
        .callsFake(async ({ data }) => ({ ...existing, ...data }));
      const revoke = sandbox.stub().resolves({ count: 1 });
      const prisma = {
        verificationCode: {
          deleteMany: sandbox.stub().resolves({ count: 0 }),
          findFirst: sandbox
            .stub()
            .resolves(validCode ? { ref: "c1", code: "123456" } : null),
          update: sandbox.stub().resolves({}),
          updateMany: sandbox.stub().resolves({ count: 1 })
        },
        user: {
          findFirst: sandbox.stub().resolves(existing),
          update: updateUser
        },
        refreshToken: {
          create: sandbox.stub().resolves({}),
          deleteMany: sandbox.stub().resolves({ count: 0 }),
          updateMany: revoke
        }
      } as unknown as Prisma;
      return { prisma, updateUser, revoke };
    };

    it("clears the password of an unverified account and ends its sessions", async function () {
      const { prisma, updateUser, revoke } = prismaWith(
        user({ emailVerified: false, passwordDigest: "scrypt$x" })
      );

      const { error } = await invoke(
        createExchangeVerificationCode(prisma, config(["email_code"])),
        {
          metadata: fromIp("10.0.0.1"),
          request: { email: "ana@acme.com", code: "123456" }
        }
      );

      expect(error).to.be.null;
      expect(updateUser.firstCall.args[0].data).to.include({
        emailVerified: true,
        password: null,
        passwordDigest: null
      });
      expect(revoke.firstCall.args[0].where).to.include({
        accessKeyId: "USuser0001"
      });
    });

    it("leaves a verified account's password alone", async function () {
      const { prisma, updateUser, revoke } = prismaWith(
        user({ emailVerified: true, passwordDigest: "scrypt$x" })
      );

      const { error } = await invoke(
        createExchangeVerificationCode(prisma, config(["email_code"])),
        {
          metadata: fromIp("10.0.0.1"),
          request: { email: "ana@acme.com", code: "123456" }
        }
      );

      expect(error).to.be.null;
      expect(updateUser).not.to.have.been.called;
      expect(revoke).not.to.have.been.called;
    });

    it("throttles wrong codes", async function () {
      const { prisma } = prismaWith(user(), false);
      const handler = createExchangeVerificationCode(
        prisma,
        config(["email_code"]),
        createSignInThrottle()
      );

      for (let i = 0; i < SIGN_IN_FAILURE_LIMITS.perEmail; i++)
        await invoke(handler, {
          metadata: fromIp(`10.0.0.${i}`),
          request: { email: "ana@acme.com", code: "000000" }
        });

      const { error } = await invoke(handler, {
        metadata: fromIp("10.0.1.1"),
        request: { email: "ana@acme.com", code: "123456" }
      });
      expect(error).to.include({ code: status.RESOURCE_EXHAUSTED });
    });
  });

  describe("ExchangeOauth2Code", function () {
    it("clears the password of an unverified account GitHub proves", async function () {
      const existing = user({
        emailVerified: false,
        passwordDigest: "scrypt$x"
      });
      const updateUser = sandbox
        .stub()
        .callsFake(async ({ data }) => ({ ...existing, ...data }));
      const prisma = {
        user: {
          findFirst: sandbox.stub().resolves(existing),
          update: updateUser
        },
        refreshToken: {
          create: sandbox.stub().resolves({}),
          deleteMany: sandbox.stub().resolves({ count: 0 }),
          updateMany: sandbox.stub().resolves({ count: 1 })
        }
      } as unknown as Prisma;
      const fetchStub = sandbox.stub(globalThis, "fetch");
      fetchStub
        .onCall(0)
        .resolves(new Response(JSON.stringify({ access_token: "gh-token" })));
      fetchStub
        .onCall(1)
        .resolves(
          new Response(JSON.stringify({ login: "ana", name: "Ana", id: 1 }))
        );
      fetchStub
        .onCall(2)
        .resolves(
          new Response(
            JSON.stringify([
              { email: "ana@acme.com", primary: true, verified: true }
            ])
          )
        );

      const { error } = await invoke(
        createExchangeOauth2Code(prisma, config(["github"])),
        { request: { provider: "GITHUB", code: "abc" } }
      );

      expect(error).to.be.null;
      expect(updateUser.firstCall.args[0].data).to.include({
        emailVerified: true,
        passwordDigest: null
      });
    });
  });

  describe("VerifyCode", function () {
    it("verifies only the account whose email received the code", async function () {
      const updateUser = sandbox.stub().resolves({});
      const findCode = sandbox.stub().resolves({ ref: "c1", code: "123456" });
      const prisma = {
        verificationCode: {
          deleteMany: sandbox.stub().resolves({ count: 0 }),
          findFirst: findCode,
          update: sandbox.stub().resolves({}),
          updateMany: sandbox.stub().resolves({ count: 1 })
        },
        user: { update: updateUser }
      } as unknown as Prisma;

      const { error } = await invoke(createVerifyCode(prisma), {
        request: {
          username: "victim@acme.com",
          contactType: "EMAIL",
          value: "someone-else@acme.com",
          verificationCode: "123456"
        }
      });

      expect(error).to.include({ code: status.PERMISSION_DENIED });
      expect(findCode).not.to.have.been.called;
      expect(updateUser).not.to.have.been.called;
    });
  });
});
