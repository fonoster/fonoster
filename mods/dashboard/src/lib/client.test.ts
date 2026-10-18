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
import * as SDK from "@fonoster/sdk";
import { DashboardClient } from "./client";
import { GrpcCode } from "./errors";
import { SessionError, type SessionApi } from "./session";

type Tokens = {
  _accessToken: string;
  _refreshToken: string;
  _idToken: string;
};

function fakeSession() {
  let n = 0;
  const next = async () => {
    n += 1;
    return { accessToken: `access-${n}`, idToken: `id-${n}` };
  };
  return {
    adopt: vi.fn(async (_refreshToken: string) => next()),
    refresh: vi.fn(next),
    logout: vi.fn(async () => undefined)
  } satisfies SessionApi;
}

/** The SDK's own sign-in, minus the network: it sets all three tokens. */
function stubSdkSignIn() {
  vi.spyOn(SDK.WebClient.prototype, "login").mockImplementation(async function (
    this: unknown
  ) {
    Object.assign(this as Tokens, {
      _accessToken: "sign-in-access",
      _refreshToken: "sign-in-refresh",
      _idToken: "sign-in-id"
    });
  });
}

afterEach(() => vi.restoreAllMocks());

describe("DashboardClient", () => {
  it("moves a sign-in's refresh token into the cookie and forgets it", async () => {
    stubSdkSignIn();
    const session = fakeSession();
    const client = new DashboardClient("http://api.test", session);
    await client.login("ada@acme.com", "pw");

    expect(session.adopt).toHaveBeenCalledWith("sign-in-refresh");
    expect(client.getRefreshToken()).toBe("");
    expect(client.getAccessToken()).toBe("access-1");
    expect(client.getIdToken()).toBe("id-1");
  });

  it("refreshes through the cookie, one request for concurrent callers", async () => {
    const session = fakeSession();
    const client = new DashboardClient("http://api.test", session);
    await Promise.all([client.refreshToken(), client.refreshToken()]);
    expect(session.refresh).toHaveBeenCalledTimes(1);
    expect(client.getAccessToken()).toBe("access-1");
    await client.refreshToken();
    expect(session.refresh).toHaveBeenCalledTimes(2);
  });

  it("surfaces a refused session", async () => {
    const session = fakeSession();
    session.refresh.mockRejectedValue(
      new SessionError(401, GrpcCode.UNAUTHENTICATED)
    );
    const client = new DashboardClient("http://api.test", session);
    await expect(client.refreshToken()).rejects.toMatchObject({
      code: GrpcCode.UNAUTHENTICATED
    });
  });

  it("keeps the token in memory when there is no session endpoint", async () => {
    stubSdkSignIn();
    const renew = vi
      .spyOn(SDK.WebClient.prototype, "loginWithRefreshToken")
      .mockResolvedValue(undefined);
    const session = fakeSession();
    session.adopt.mockRejectedValue(
      new SessionError(404, GrpcCode.UNAVAILABLE)
    );
    const client = new DashboardClient("http://api.test", session);
    await client.login("ada@acme.com", "pw");

    expect(client.getAccessToken()).toBe("sign-in-access");
    await client.refreshToken();
    expect(renew).toHaveBeenCalledWith("sign-in-refresh");
    expect(session.refresh).not.toHaveBeenCalled();
  });

  it("signs out through the session endpoint, which revokes", async () => {
    const session = fakeSession();
    const client = new DashboardClient("http://api.test", session);
    await client.refreshToken();
    await client.logout();
    expect(session.logout).toHaveBeenCalledTimes(1);
    expect(client.getAccessToken()).toBe("");
    expect(client.getIdToken()).toBe("");
  });
});
