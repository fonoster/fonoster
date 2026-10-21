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
import { CallRecords } from "../src/CallRecords";
import { Regions } from "../src/Regions";
import type { FonosterClient } from "../src/client/types";

// Browsers refuse a detached `fetch` ("Illegal invocation"); Node does not. This fake behaves like
// a browser so the HTTP clients are caught if they ever store and call the global as a method.
function browserLikeFetch(this: unknown, url: string) {
  if (this !== undefined && this !== globalThis) {
    return Promise.reject(
      new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation")
    );
  }
  calls.push(url);
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({ items: [] })
  });
}
const calls: string[] = [];

const client = {
  getAccessToken: () => "token",
  getAccessKeyId: () => "WO1",
  getIdToken: () => "id",
  getHttpUrl: () => "http://api.test",
  refreshToken: async () => undefined
} as unknown as FonosterClient;

describe("@sdk[http/fetch-binding]", function () {
  const original = globalThis.fetch;
  beforeEach(() => {
    calls.length = 0;
    globalThis.fetch = browserLikeFetch as unknown as typeof fetch;
  });
  afterEach(() => {
    globalThis.fetch = original;
  });

  it("Regions calls the global fetch the way a browser allows", async function () {
    const regions = new Regions(client);
    await regions.listRegions();
    expect(calls).to.deep.equal(["http://api.test/api/regions"]);
  });

  it("CallRecords calls the global fetch the way a browser allows", async function () {
    const records = new CallRecords(client);
    await records.listRecords({} as never);
    expect(calls).to.have.length(1);
    expect(calls[0]).to.match(/^http:\/\/api\.test\/api\/records/);
  });
});
