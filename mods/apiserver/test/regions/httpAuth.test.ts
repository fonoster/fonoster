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
import { generateKeyPairSync } from "crypto";
import { expect } from "chai";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  createHttpAuth,
  createUserAuth,
  optionalUser
} from "../../src/regions/httpAuth";

// M5: the regions HTTP API takes Identity access tokens only, from the
// configured issuer and for the configured audience.

const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PUBLIC = rsa.publicKey.export({ type: "spki", format: "pem" }).toString();
const PRIVATE = rsa.privateKey
  .export({ type: "pkcs8", format: "pem" })
  .toString();
const OPTIONS = { issuer: "https://id.test", audience: "api" };

const token = (
  claims: Record<string, unknown>,
  options: jwt.SignOptions = {}
) =>
  jwt.sign(
    {
      sub: "user-1",
      accessKeyId: "US1",
      tokenUse: "access",
      access: [{ accessKeyId: "WO1", role: "WORKSPACE_OWNER" }],
      ...claims
    },
    PRIVATE,
    {
      algorithm: "RS256",
      expiresIn: 300,
      issuer: OPTIONS.issuer,
      audience: OPTIONS.audience,
      ...options
    }
  );

function run(
  middleware: (req: Request, res: Response, next: () => void) => unknown,
  bearer: string
) {
  const req = {
    headers: { authorization: `Bearer ${bearer}`, "x-accesskey-id": "WO1" }
  } as unknown as Request;
  let status = 0;
  let nextCalled = false;
  const res = {
    locals: {} as Record<string, unknown>,
    status(code: number) {
      status = code;
      return { json: () => undefined };
    }
  } as unknown as Response;
  middleware(req, res, () => {
    nextCalled = true;
  });
  return { status, next: nextCalled, locals: res.locals };
}

describe("@apiserver[regions/httpAuth]", function () {
  const cases = [
    ["workspace", createHttpAuth(PUBLIC, OPTIONS)],
    ["user", createUserAuth(PUBLIC, OPTIONS)]
  ] as const;

  for (const [name, auth] of cases) {
    describe(`${name} auth`, function () {
      it("accepts an access token from the configured issuer and audience", function () {
        expect(run(auth, token({})).next).to.be.true;
      });

      it("refuses refresh, id and invite tokens", function () {
        for (const tokenUse of ["refresh", "id", "invite"])
          expect(run(auth, token({ tokenUse })).status).to.equal(401);
      });

      it("refuses another issuer or audience", function () {
        expect(
          run(auth, token({}, { issuer: "https://other.test" })).status
        ).to.equal(401);
        expect(run(auth, token({}, { audience: "other" })).status).to.equal(
          401
        );
      });
    });
  }

  it("optionalUser ignores tokens from another issuer", function () {
    const maybeUser = optionalUser(PUBLIC, OPTIONS);
    const foreign = run(maybeUser, token({}, { issuer: "https://other.test" }));
    expect(foreign.next).to.be.true;
    expect(foreign.locals.user).to.be.undefined;
    expect(run(maybeUser, token({})).locals.user).to.deep.equal({
      userRef: "user-1"
    });
  });
});
