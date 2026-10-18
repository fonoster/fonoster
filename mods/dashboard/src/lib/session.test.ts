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
import { GrpcCode } from "./errors";
import { createSessionApi, SessionError } from "./session";

function reply(status: number, body?: object) {
  return new Response(body ? JSON.stringify(body) : null, {
    status,
    headers: body ? { "content-type": "application/json" } : {}
  });
}

describe("createSessionApi", () => {
  it("posts same-origin with the CSRF header and returns the tokens", async () => {
    const fetchImpl = vi.fn(async () =>
      reply(200, { accessToken: "a", idToken: "i", expiresAt: 1 })
    );
    const api = createSessionApi("https://app.test", fetchImpl);

    expect(await api.refresh()).toEqual({ accessToken: "a", idToken: "i" });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit
    ];
    expect(url).toBe("https://app.test/api/session/refresh");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("same-origin");
    expect(init.headers).toMatchObject({
      "X-Requested-With": "fonoster-dashboard"
    });
  });

  it("sends a sign-in's refresh token in the body to adopt it", async () => {
    const fetchImpl = vi.fn(async () =>
      reply(200, { accessToken: "a", idToken: "i" })
    );
    await createSessionApi("https://app.test", fetchImpl).adopt("r1");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit
    ];
    expect(url).toBe("https://app.test/api/session");
    expect(JSON.parse(init.body as string)).toEqual({ refreshToken: "r1" });
  });

  it("calls the logout endpoint", async () => {
    const fetchImpl = vi.fn(async (_url: string) => reply(204));
    await createSessionApi(
      "https://app.test",
      fetchImpl as typeof fetch
    ).logout();
    expect(fetchImpl.mock.calls[0][0]).toBe(
      "https://app.test/api/session/logout"
    );
  });

  it("maps a refusal to UNAUTHENTICATED and anything else to UNAVAILABLE", async () => {
    const refused = createSessionApi("", async () => reply(401, {}));
    await expect(refused.refresh()).rejects.toMatchObject({
      code: GrpcCode.UNAUTHENTICATED,
      status: 401
    });

    const down = createSessionApi("", async () => reply(503, {}));
    await expect(down.refresh()).rejects.toMatchObject({
      code: GrpcCode.UNAVAILABLE
    });

    const offline = createSessionApi("", async () => {
      throw new TypeError("Failed to fetch");
    });
    const error = await offline.refresh().catch((e) => e);
    expect(error).toBeInstanceOf(SessionError);
    expect(error.code).toBe(GrpcCode.UNAVAILABLE);
  });
});
