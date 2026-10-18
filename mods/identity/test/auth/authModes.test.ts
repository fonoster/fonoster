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
import { status } from "@grpc/grpc-js";
import { expect } from "chai";
import { createSandbox } from "sinon";
import { Prisma } from "../../src/db";
import { createExchangeCredentials } from "../../src/exchanges/createExchangeCredentials";
import { createExchangeOauth2Code } from "../../src/exchanges/createExchangeOauth2Code";
import { createExchangeVerificationCode } from "../../src/exchanges/createExchangeVerificationCode";
import { IdentityConfig } from "../../src/exchanges/types";
import { hashPassword } from "../../src/utils/passwords";
import { TEST_PRIVATE_KEY } from "../utils";

const sandbox = createSandbox();

type Auth = IdentityConfig["auth"];

const configWith = (auth: Auth, extra: Partial<IdentityConfig> = {}) =>
  ({
    auth,
    issuer: "https://id.test",
    audience: "api",
    privateKey: TEST_PRIVATE_KEY,
    idTokenExpiresIn: "15m",
    accessTokenExpiresIn: "15m",
    refreshTokenExpiresIn: "24h",
    ...extra
  }) as IdentityConfig;

const COMMUNITY: Auth = { methods: ["password"], signup: "invite" };
const CLOUD: Auth = { methods: ["github", "email_code"], signup: "open" };

const tokenUser = (overrides: Record<string, unknown> = {}) => ({
  ref: "u1",
  accessKeyId: "US123",
  email: "ana@acme.com",
  emailVerified: true,
  ownedWorkspaces: [],
  memberships: [],
  ...overrides
});

/** Where issued refresh tokens are recorded (rotation). */
const refreshTokenStore = () => ({
  create: sandbox.stub().resolves({}),
  deleteMany: sandbox.stub().resolves({ count: 0 })
});

/** Calls a handler and resolves with what it passed to the callback. */
function invoke(handler: Function, request: unknown) {
  return new Promise<{ error?: unknown; response?: unknown }>((resolve) =>
    handler({ request }, (error: unknown, response: unknown) =>
      resolve({ error, response })
    )
  );
}

describe("@identity[auth modes]", function () {
  afterEach(() => sandbox.restore());

  describe("ExchangeCredentials", function () {
    it("is refused when password sign-in is disabled", async function () {
      const findFirst = sandbox.stub();
      const prisma = { user: { findFirst } } as unknown as Prisma;

      const { error } = await invoke(
        createExchangeCredentials(prisma, configWith(CLOUD)),
        { username: "ana@acme.com", password: "pw-123456" }
      );

      expect(error).to.deep.equal({
        code: status.PERMISSION_DENIED,
        message: "Password sign-in is disabled"
      });
      expect(findFirst).not.to.have.been.called;
    });

    it("signs in with a hashed password", async function () {
      const user = tokenUser({ passwordDigest: await hashPassword("pw-123456") });
      const prisma = {
        user: { findFirst: sandbox.stub().resolves(user) },
        refreshToken: refreshTokenStore()
      } as unknown as Prisma;

      const ok = await invoke(
        createExchangeCredentials(prisma, configWith(COMMUNITY)),
        { username: "ana@acme.com", password: "pw-123456" }
      );
      const bad = await invoke(
        createExchangeCredentials(prisma, configWith(COMMUNITY)),
        { username: "ana@acme.com", password: "wrong-pw" }
      );

      expect(ok.response).to.have.keys("idToken", "accessToken", "refreshToken");
      expect(bad.error).to.deep.equal({
        code: status.PERMISSION_DENIED,
        message: "Invalid credentials"
      });
    });
  });

  describe("ExchangeOauth2Code", function () {
    it("is refused when GitHub sign-in is disabled", async function () {
      const { error } = await invoke(
        createExchangeOauth2Code({} as Prisma, configWith(COMMUNITY)),
        { provider: "GITHUB", code: "abc" }
      );
      expect(error).to.deep.equal({
        code: status.PERMISSION_DENIED,
        message: "GitHub sign-in is disabled"
      });
    });
  });

  describe("ExchangeVerificationCode", function () {
    const liveCode = () => ({
      deleteMany: sandbox.stub().resolves(),
      findFirst: sandbox.stub().resolves({ ref: "c1", code: "123456" }),
      update: sandbox.stub().resolves(),
      updateMany: sandbox.stub().resolves({ count: 1 })
    });

    it("is refused when email-code sign-in is disabled", async function () {
      const { error } = await invoke(
        createExchangeVerificationCode({} as Prisma, configWith(COMMUNITY)),
        { email: "ana@acme.com", code: "123456" }
      );
      expect(error).to.deep.equal({
        code: status.PERMISSION_DENIED,
        message: "Email code sign-in is disabled"
      });
    });

    it("signs in an existing user and marks the email verified", async function () {
      const update = sandbox.stub().resolves(tokenUser());
      const prisma = {
        verificationCode: liveCode(),
        user: {
          findFirst: sandbox.stub().resolves(tokenUser({ emailVerified: false })),
          update,
          create: sandbox.stub()
        },
        refreshToken: {
          ...refreshTokenStore(),
          updateMany: sandbox.stub().resolves({ count: 0 })
        }
      } as unknown as Prisma;

      const { error, response } = await invoke(
        createExchangeVerificationCode(prisma, configWith(CLOUD)),
        { email: "Ana@Acme.com", code: "123456" }
      );

      expect(error).to.be.null;
      expect(response).to.have.keys("idToken", "accessToken", "refreshToken");
      // The email was unverified, so its password is cleared too (M2).
      expect(update.firstCall.args[0].data).to.deep.equal({
        emailVerified: true,
        password: null,
        passwordDigest: null,
        mustChangePassword: false
      });
    });

    it("creates the account on first sign-in when sign-up is open", async function () {
      const findFirst = sandbox.stub();
      findFirst.onFirstCall().resolves(null); // lookup by email
      findFirst.resolves(tokenUser()); // token payloads
      const create = sandbox.stub().resolves(tokenUser());
      const prisma = {
        verificationCode: liveCode(),
        user: { findFirst, create, update: sandbox.stub() },
        refreshToken: refreshTokenStore()
      } as unknown as Prisma;

      const { response } = await invoke(
        createExchangeVerificationCode(prisma, configWith(CLOUD)),
        { email: "new@acme.com", code: "123456" }
      );

      expect(response).to.have.keys("idToken", "accessToken", "refreshToken");
      const { data } = create.firstCall.args[0];
      expect(data).to.include({ email: "new@acme.com", emailVerified: true });
      expect(data).not.to.have.property("passwordDigest");
    });

    it("treats unknown emails like a wrong code when sign-up is by invite", async function () {
      const create = sandbox.stub();
      const prisma = {
        verificationCode: liveCode(),
        user: { findFirst: sandbox.stub().resolves(null), create }
      } as unknown as Prisma;

      const { error } = await invoke(
        createExchangeVerificationCode(
          prisma,
          configWith({ methods: ["email_code"], signup: "invite" })
        ),
        { email: "stranger@acme.com", code: "123456" }
      );

      expect(error).to.deep.equal({
        code: status.PERMISSION_DENIED,
        message: "Invalid verification code"
      });
      expect(create).not.to.have.been.called;
    });

    it("rejects a malformed code before touching the database", async function () {
      const { error } = await invoke(
        createExchangeVerificationCode({} as Prisma, configWith(CLOUD)),
        { email: "ana@acme.com", code: "12ab" }
      );
      expect((error as { code: number }).code).to.equal(status.INVALID_ARGUMENT);
    });
  });
});
