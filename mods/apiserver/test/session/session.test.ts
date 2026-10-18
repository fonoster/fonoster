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
import { AddressInfo } from "net";
import { status } from "@grpc/grpc-js";
import { expect } from "chai";
import express from "express";
import jwt from "jsonwebtoken";
import {
  createSessionRouter,
  identityFromHandlers,
  SESSION_COOKIE,
  SESSION_PATH,
  SessionIdentityError,
  SessionTokens
} from "../../src/session";

const inSeconds = (s: number) => Math.floor(Date.now() / 1000) + s;
const token = (claims: object) => jwt.sign(claims, "test-only");

/**
 * Identity stand-in with #955's rotation: each refresh token works once, and a spent one is
 * refused (UNAUTHENTICATED), as is anything revoked.
 */
function fakeIdentity() {
  let n = 0;
  const live = new Set<string>();
  const revoked: string[] = [];
  const issue = (): SessionTokens => {
    n += 1;
    const refreshToken = token({ jti: `r${n}`, exp: inSeconds(86400) });
    live.add(refreshToken);
    return {
      refreshToken,
      accessToken: token({ tokenUse: "access", n, exp: inSeconds(600) }),
      idToken: token({ email: "ada@acme.com", n })
    };
  };
  let down = false;
  return {
    issue,
    live,
    revoked,
    exchanged: [] as string[],
    goDown: () => (down = true),
    async exchangeRefreshToken(refreshToken: string) {
      this.exchanged.push(refreshToken);
      if (down) throw new SessionIdentityError(status.UNAVAILABLE, "down");
      if (!live.delete(refreshToken))
        throw new SessionIdentityError(status.UNAUTHENTICATED, "Invalid");
      return issue();
    },
    async revokeToken(refreshToken: string) {
      revoked.push(refreshToken);
      live.delete(refreshToken);
    }
  };
}

type Cookie = {
  value: string;
  attributes: Map<string, string>;
};

function parseSetCookie(header: string | null): Cookie | undefined {
  if (!header) return undefined;
  const [pair, ...rest] = header.split(";").map((p) => p.trim());
  const [name, value] = [
    pair.slice(0, pair.indexOf("=")),
    pair.slice(pair.indexOf("=") + 1)
  ];
  if (name !== SESSION_COOKIE) return undefined;
  const attributes = new Map<string, string>();
  for (const a of rest) {
    const at = a.indexOf("=");
    if (at < 0) attributes.set(a.toLowerCase(), "");
    else attributes.set(a.slice(0, at).toLowerCase(), a.slice(at + 1));
  }
  return { value: decodeURIComponent(value), attributes };
}

describe("@apiserver[session] dashboard cookie session (M4)", function () {
  let server: ReturnType<ReturnType<typeof express>["listen"]>;
  let base: string;
  let identity: ReturnType<typeof fakeIdentity>;

  async function start(secureCookie = true) {
    identity = fakeIdentity();
    const app = express();
    app.use(SESSION_PATH, createSessionRouter({ identity, secureCookie }));
    server = app.listen(0);
    await new Promise((r) => server.once("listening", r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  }

  afterEach(() => server?.close());

  const post = (
    path: string,
    o: { cookie?: string; body?: object; csrf?: boolean } = {}
  ) =>
    fetch(`${base}${SESSION_PATH}${path}`, {
      method: "POST",
      headers: {
        ...(o.csrf === false ? {} : { "x-requested-with": "fonoster" }),
        ...(o.cookie ? { cookie: `${SESSION_COOKIE}=${o.cookie}` } : {}),
        ...(o.body ? { "content-type": "application/json" } : {})
      },
      body: o.body ? JSON.stringify(o.body) : undefined
    });

  it("adopts a sign-in's refresh token: rotates it, sets the cookie, returns no refresh token", async () => {
    await start();
    const signIn = identity.issue();
    const res = await post("", { body: { refreshToken: signIn.refreshToken } });

    expect(res.status).to.equal(200);
    const json = await res.json();
    expect(json).to.have.keys("accessToken", "idToken", "expiresAt");
    expect(JSON.stringify(json)).to.not.include(signIn.refreshToken);
    // The copy the page saw is spent.
    expect(identity.live.has(signIn.refreshToken)).to.equal(false);

    const cookie = parseSetCookie(res.headers.get("set-cookie"))!;
    expect(cookie.value).to.not.equal(signIn.refreshToken);
    expect(identity.live.has(cookie.value)).to.equal(true);
    expect(cookie.attributes.has("httponly")).to.equal(true);
    expect(cookie.attributes.has("secure")).to.equal(true);
    expect(cookie.attributes.get("samesite")).to.equal("Strict");
    expect(cookie.attributes.get("path")).to.equal(SESSION_PATH);
    // Lives as long as the refresh token (24 h here).
    expect(Number(cookie.attributes.get("max-age"))).to.be.within(86390, 86400);
    expect(res.headers.get("cache-control")).to.equal("no-store");
  });

  it("leaves Secure off when the deployment is plain http", async () => {
    await start(false);
    const res = await post("", {
      body: { refreshToken: identity.issue().refreshToken }
    });
    const cookie = parseSetCookie(res.headers.get("set-cookie"))!;
    expect(cookie.attributes.has("secure")).to.equal(false);
    expect(cookie.attributes.has("httponly")).to.equal(true);
  });

  it("refreshes from the cookie and rotates it every time", async () => {
    await start();
    const first = identity.issue().refreshToken;
    const res = await post("/refresh", { cookie: first });

    expect(res.status).to.equal(200);
    const json = await res.json();
    expect(json.accessToken).to.be.a("string");
    expect(json).to.not.have.property("refreshToken");
    const next = parseSetCookie(res.headers.get("set-cookie"))!.value;
    expect(next).to.not.equal(first);
    expect(identity.exchanged).to.deep.equal([first]);

    // The old cookie value is spent; the new one works once more.
    expect((await post("/refresh", { cookie: first })).status).to.equal(401);
    expect((await post("/refresh", { cookie: next })).status).to.equal(200);
  });

  it("answers 401 without a cookie and never calls Identity", async () => {
    await start();
    const res = await post("/refresh");
    expect(res.status).to.equal(401);
    expect(identity.exchanged).to.deep.equal([]);
  });

  it("clears the cookie when Identity refuses the token", async () => {
    await start();
    const res = await post("/refresh", { cookie: "not-a-token" });
    expect(res.status).to.equal(401);
    const cleared = parseSetCookie(res.headers.get("set-cookie"))!;
    expect(cleared.value).to.equal("");
    expect(cleared.attributes.get("path")).to.equal(SESSION_PATH);
  });

  it("keeps the cookie and answers 503 when Identity is unavailable", async () => {
    await start();
    const live = identity.issue().refreshToken;
    identity.goDown();
    const res = await post("/refresh", { cookie: live });
    expect(res.status).to.equal(503);
    expect(res.headers.get("set-cookie")).to.equal(null);
  });

  it("logs out: revokes the cookie's token and clears the cookie", async () => {
    await start();
    const live = identity.issue().refreshToken;
    const res = await post("/logout", { cookie: live });

    expect(res.status).to.equal(204);
    expect(identity.revoked).to.deep.equal([live]);
    const cleared = parseSetCookie(res.headers.get("set-cookie"))!;
    expect(cleared.value).to.equal("");
    expect(cleared.attributes.get("path")).to.equal(SESSION_PATH);
    expect(cleared.attributes.has("httponly")).to.equal(true);
    expect((await post("/refresh", { cookie: live })).status).to.equal(401);
  });

  it("logs out cleanly without a cookie", async () => {
    await start();
    expect((await post("/logout")).status).to.equal(204);
    expect(identity.revoked).to.deep.equal([]);
  });

  it("requires the X-Requested-With header (CSRF)", async () => {
    await start();
    const live = identity.issue().refreshToken;
    for (const path of ["", "/refresh", "/logout"]) {
      const res = await post(path, {
        cookie: live,
        body: { refreshToken: live },
        csrf: false
      });
      expect(res.status, path).to.equal(403);
      expect(res.headers.get("set-cookie"), path).to.equal(null);
    }
    expect(identity.exchanged).to.deep.equal([]);
    expect(identity.revoked).to.deep.equal([]);
  });

  it("only takes POST", async () => {
    await start();
    const res = await fetch(`${base}${SESSION_PATH}/refresh`, {
      headers: { "x-requested-with": "fonoster" }
    });
    expect(res.status).to.equal(405);
  });

  it("needs a refresh token to adopt", async () => {
    await start();
    expect((await post("", { body: {} })).status).to.equal(400);
  });
});

describe("@apiserver[session] identityFromHandlers", function () {
  it("calls Identity's gRPC handlers and surfaces their status codes", async () => {
    const tokens = { accessToken: "a", refreshToken: "r2", idToken: "i" };
    const identity = identityFromHandlers({
      exchangeRefreshToken: (
        call: { request: { refreshToken: string } },
        cb: (e: unknown, r?: unknown) => void
      ) =>
        call.request.refreshToken === "r1"
          ? cb(null, tokens)
          : cb({ code: status.UNAUTHENTICATED, message: "Invalid" }),
      revokeToken: (
        call: { request: { token: string } },
        cb: (e: unknown, r?: unknown) => void
      ) => cb(null, { token: call.request.token })
    });

    expect(await identity.exchangeRefreshToken("r1")).to.deep.equal(tokens);
    const error = await identity.exchangeRefreshToken("x").catch((e) => e);
    expect(error).to.be.instanceOf(SessionIdentityError);
    expect(error.code).to.equal(status.UNAUTHENTICATED);
    await identity.revokeToken("r2");
  });

  it("refuses to start without the Identity service", () => {
    expect(() => identityFromHandlers({})).to.throw(/Identity/);
  });
});
