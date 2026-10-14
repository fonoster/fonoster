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
import * as sinon from "sinon";
import { getGitHubUserWithOauth2Code } from "../../src/utils/getGitHubUserWithOauth2Code";

const json = (body: unknown, ok = true) =>
  ({ ok, json: async () => body }) as unknown as Response;

describe("@identity[utils/getGitHubUserWithOauth2Code]", function () {
  let fetchStub: sinon.SinonStub;

  beforeEach(function () {
    fetchStub = sinon.stub(globalThis, "fetch");
    fetchStub.callsFake(async (url: string) => {
      if (url.endsWith("/login/oauth/access_token")) return json({ access_token: "tok" });
      if (url.endsWith("/user/emails"))
        return json([
          { email: "public@acme.com", primary: false, verified: true },
          { email: "ada@acme.com", primary: true, verified: true }
        ]);
      return json({ login: "ada", name: "Ada Lovelace" });
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it("uses github.com and api.github.com by default", async function () {
    const user = await getGitHubUserWithOauth2Code({ clientId: "id", clientSecret: "s", code: "c" });

    expect(fetchStub.getCalls().map((c) => c.args[0])).to.deep.equal([
      "https://github.com/login/oauth/access_token",
      "https://api.github.com/user",
      "https://api.github.com/user/emails"
    ]);
    expect(user).to.include({ name: "Ada Lovelace", email: "ada@acme.com" });
  });

  it("calls a configured GitHub instead", async function () {
    await getGitHubUserWithOauth2Code({
      clientId: "id",
      clientSecret: "s",
      code: "c",
      url: "http://fake-github:3999",
      apiUrl: "http://fake-github:3999"
    });

    expect(fetchStub.getCalls().map((c) => c.args[0])).to.deep.equal([
      "http://fake-github:3999/login/oauth/access_token",
      "http://fake-github:3999/user",
      "http://fake-github:3999/user/emails"
    ]);
  });

  it("ignores an unverified primary email", async function () {
    fetchStub.callsFake(async (url: string) => {
      if (url.endsWith("/login/oauth/access_token")) return json({ access_token: "tok" });
      if (url.endsWith("/user/emails")) return json([{ email: "ada@acme.com", primary: true, verified: false }]);
      return json({ login: "ada" });
    });

    const user = await getGitHubUserWithOauth2Code({ clientId: "id", clientSecret: "s", code: "c" });

    expect(user.email).to.equal(undefined);
  });
});
