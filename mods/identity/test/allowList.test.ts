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
import { createAuthInterceptor } from "@fonoster/common";
import { Metadata, ServerInterceptingCall, status } from "@grpc/grpc-js";
import { expect } from "chai";
import jwt from "jsonwebtoken";
import sinon from "sinon";
import { identityAllowList } from "../src/allowList";

const CREATE_WORKSPACE = "/fonoster.identity.v1beta2.Identity/CreateWorkspace";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" }
});

/** A user access token, shaped like the ones Identity issues. */
const userToken = () =>
  jwt.sign(
    {
      sub: "user-ref",
      accessKeyId: "USabc123",
      access: [],
      tokenUse: "access"
    },
    privateKey,
    { algorithm: "RS256", expiresIn: "5m" }
  );

const fakeCall = (token?: string) => {
  const metadata = new Metadata();
  if (token) metadata.set("token", token);
  return {
    metadata,
    sendStatus: sinon.spy()
  } as unknown as ServerInterceptingCall & { sendStatus: sinon.SinonSpy };
};

describe("@identity[allowList]", function () {
  const intercept = createAuthInterceptor(publicKey, identityAllowList);

  it("doesn't allow-list CreateWorkspace: its handler takes the owner from the token", function () {
    expect(identityAllowList).to.not.include(CREATE_WORKSPACE);
  });

  it("rejects CreateWorkspace without a token as UNAUTHENTICATED at the interceptor", function () {
    const call = fakeCall();
    intercept({ path: CREATE_WORKSPACE }, call);
    expect(call.sendStatus.calledOnce).to.be.true;
    expect(call.sendStatus.firstCall.args[0]).to.include({
      code: status.UNAUTHENTICATED
    });
  });

  it("passes CreateWorkspace with a valid user token on to the handler", function () {
    const call = fakeCall(userToken());
    expect(intercept({ path: CREATE_WORKSPACE }, call)).to.equal(call);
    expect(call.sendStatus.called).to.be.false;
  });

  it("still lets the sign-up and sign-in methods through without a token", function () {
    [
      "/fonoster.identity.v1beta2.Identity/CreateUser",
      "/fonoster.identity.v1beta2.Identity/ExchangeCredentials",
      "/fonoster.identity.v1beta2.Identity/GetPublicKey"
    ].forEach((path) => {
      const call = fakeCall();
      expect(intercept({ path }, call)).to.equal(call);
      expect(call.sendStatus.called).to.be.false;
    });
  });
});
