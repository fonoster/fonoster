/*
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
import { Client } from "../src/client/Client";
import { RevokeTokenResponse } from "../src/generated/node/identity_pb";

// Sign-out revokes the refresh token (the RevokeToken RPC), so a copied refresh
// token stops working once its user signs out.

type Callback = (err: Error | null, res?: RevokeTokenResponse) => void;

function clientWith(revoke: (token: string, cb: Callback) => void) {
  const client = new Client({
    endpoint: "localhost:1",
    accessKeyId: "WO1",
    allowInsecure: true,
    withoutInterceptors: true
  });
  const internals = client as unknown as {
    identityClient: unknown;
    _refreshToken: string;
    _accessToken: string;
    _idToken: string;
  };
  internals.identityClient = {
    revokeToken: (req: { getToken(): string }, _md: unknown, cb: Callback) =>
      revoke(req.getToken(), cb)
  };
  internals._refreshToken = "refresh-1";
  internals._accessToken = "access-1";
  internals._idToken = "id-1";
  return client;
}

describe("@sdk[logout]", function () {
  it("revokes the refresh token and forgets every token", async function () {
    const revoked: string[] = [];
    const client = clientWith((token, cb) => {
      revoked.push(token);
      cb(null, new RevokeTokenResponse());
    });

    const done = client.logout();
    // Forgotten right away, before the server answers.
    expect(client.getRefreshToken()).to.equal("");
    await done;

    expect(revoked).to.deep.equal(["refresh-1"]);
    expect(client.getAccessToken()).to.equal("");
    expect(client.getIdToken()).to.equal("");
  });

  it("still signs out when the server cannot revoke", async function () {
    const client = clientWith((_token, cb) => cb(new Error("unavailable")));
    await client.logout();
    expect(client.getRefreshToken()).to.equal("");
  });

  it("calls nothing when there is no refresh token", async function () {
    let calls = 0;
    const client = clientWith((_token, cb) => {
      calls++;
      cb(null, new RevokeTokenResponse());
    });
    await client.logout();
    await client.logout();
    expect(calls).to.equal(1);
  });

  it("revokeToken surfaces server errors", async function () {
    const client = clientWith((_token, cb) => cb(new Error("unauthenticated")));
    const error = await client.revokeToken("refresh-x").then(
      () => undefined,
      (e: Error) => e
    );
    expect(error?.message).to.equal("unauthenticated");
  });
});
