/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import Auth from "../src/client/auth";
import { APIClient } from "@fonoster/common";
import { AuthPB } from "../src/client/auth";
import { CreateTokenResponse } from "../src/client/types";
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

const createTokenResponse = new AuthPB.CreateTokenResponse();
createTokenResponse.setToken("...");

describe("@fonoster/auth/client", () => {
  afterEach(() => sandbox.restore());

  it("creates a new no access token", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const stubAuth = sandbox.stub(APIClient.prototype, "getService").returns({
      createNoAccessToken: () => {
        return {
          sendMessage: () => Promise.resolve(createTokenResponse)
        };
      }
    });

    const auth = new Auth();
    const result: CreateTokenResponse = await auth.createNoAccessToken({
      accessKeyId: "603693c0afaa1a080000000e"
    });

    expect(stubAuth).to.be.calledTwice;
    expect(result)
      .to.have.property("token")
      .to.be.equal(createTokenResponse.getToken());
  });

  it("creates a new access token", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const stubAuth = sandbox.stub(APIClient.prototype, "getService").returns({
      createToken: () => {
        return {
          sendMessage: () => Promise.resolve(createTokenResponse)
        };
      }
    });

    const auth = new Auth();
    const result: CreateTokenResponse = await auth.createToken({
      accessKeyId: "603693c0afaa1a080000000e"
    });

    expect(stubAuth).to.be.calledTwice;
    expect(result)
      .to.have.property("token")
      .to.be.equal(createTokenResponse.getToken());
  });

  it("checks if a token is valid", async () => {
    sandbox.stub(APIClient.prototype, "init").returns();
    const stubAuth = sandbox.stub(APIClient.prototype, "getService").returns({
      validateToken: () => {
        return {
          sendMessage: () =>
            Promise.resolve({
              getValid: () => true
            })
        };
      }
    });

    const auth = new Auth();
    const result = await auth.validateToken({
      token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJmb25vcyIsInJvbGUiOiJVU0VSIiwiYWNjZXNzS2V5SWQiOiI2MDM2OTNjMGFmYWExYTA4MDAwMDAwMGMiLCJpYXQiOjE2MTQxODk1MDQsImV4cCI6MTYxNjc4MTUwNH0.4baHuvasGcJXjgqNfWCfh_qgRshdNf5WsACzE5DGUQ8"
    });

    expect(stubAuth).to.be.calledTwice;
    expect(result).to.be.equal(true);
  });
});
