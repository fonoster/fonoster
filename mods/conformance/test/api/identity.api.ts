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
import { status } from "@grpc/grpc-js";
import { expect } from "chai";
import jwt from "jsonwebtoken";
import { codeOf, createDrivers, Driver, Who } from "./drivers";
import { decode, getWorld, PASSWORD, World } from "./world";

// identity: users, workspaces, roles, tokens, exchanges, codes and keys on the real Identity
// service inside the apiserver (API-011 to API-049 in mods/conformance/catalog/areas/api.md).
// Token exchanges have no SDK class (the SDK wraps them in Client.login), so these run over gRPC.

type Tokens = { idToken: string; accessToken: string; refreshToken: string };

/** The body of an email, with quoted-printable soft breaks and escapes undone. */
const body = (data: string) =>
  data
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#x([0-9A-F]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));

/** The one-time password in an invite. */
const otpIn = (mail: string) => mail.match(/one-time password:\s*<b>([^<]+)<\/b>/i)?.[1];

describe("@api identity", function () {
  this.timeout(60_000);
  let world: World;
  let raw: Driver;
  const id = (who: Who | undefined, method: string, request: unknown, d: Driver = raw) =>
    d.call<Record<string, unknown>>(who, "Identity", method, request);
  const exchange = (email: string, password: string, d: Driver = raw) =>
    d.call<Tokens>(undefined, "Identity", "exchangeCredentials", { username: email, password });
  const refresh = (refreshToken: string, d: Driver = raw) =>
    d.call<Tokens>(undefined, "Identity", "exchangeRefreshToken", { refreshToken });

  /** The email an action sends to an address (Identity sends after answering, so it is awaited). */
  async function emailAfter(to: string, action: () => Promise<unknown>) {
    const sent = () => world.stack.emails.filter((e) => e.to === to);
    const before = sent().length;
    await action();
    for (let i = 0; i < 100; i++) {
      const mails = sent();
      if (mails.length > before) return body(mails[mails.length - 1].data);
      await new Promise((done) => setTimeout(done, 100));
    }
    throw new Error(`no email to ${to}`);
  }
  /** Sends a verification code to an email and returns it. */
  const emailedCode = async (email: string, d: Driver = raw) =>
    (await emailAfter(email, () => id(undefined, "sendVerificationCode", { contactType: "EMAIL", value: email }, d))).match(
      /verification-code">(\d{6})</
    )![1];

  before(async function () {
    world = await getWorld();
    raw = world.raw;
  });

  describe("users, workspaces and ownership", function () {
    it("[API-011] the creator of a workspace owns it and can belong to other workspaces", async function () {
      const user = await world.signUp("Creator");
      const { ref } = await id(user.user, "createWorkspace", { name: "Mine" });
      const [row] = (await world.stack.identitySql(
        `SELECT access_key_id FROM workspaces WHERE ref = $1`,
        ref
      )) as { access_key_id: string }[];
      await id(await world.as(world.ownerA, world.wsA), "inviteUserToWorkspace", {
        email: user.email,
        name: "Creator",
        role: "WORKSPACE_MEMBER"
      });
      await world.stack.identitySql(
        `UPDATE workspace_members SET status = 'ACTIVE' WHERE user_ref = $1 AND workspace_ref = $2`,
        user.userRef,
        world.wsA.ref
      );

      const access = decode((await refresh(user.refreshToken)).accessToken).access as {
        accessKeyId: string;
        role: string;
      }[];

      expect(access).to.deep.include({ accessKeyId: row.access_key_id, role: "WORKSPACE_OWNER" });
      expect(access).to.deep.include({ accessKeyId: world.wsA.accessKeyId, role: "WORKSPACE_MEMBER" });
    });

    it("[API-012] a user's accessKeyId starts with US and a workspace's with WO", async function () {
      expect(world.ownerA.user.accessKeyId).to.match(/^US/);
      expect(world.wsA.accessKeyId).to.match(/^WO/);
    });
  });

  describe("role-based access control", function () {
    it("[API-013] a member may call the methods of the member role", async function () {
      const member = await world.as(world.memberA, world.wsA);
      for (const d of world.drivers)
        expect(await codeOf(d.call(member, "Applications", "listApplications", { pageSize: 10 })), d.name).to.equal("ok");
    });

    it("[API-014] a member calling an owner/admin method is PERMISSION_DENIED", async function () {
      const member = await world.as(world.memberA, world.wsA);
      for (const d of world.drivers)
        expect(
          await codeOf(d.call(member, "Workspaces", "inviteUserToWorkspace", { email: `x-${world.unique()}@api.test`, name: "X", role: "WORKSPACE_MEMBER" })),
          d.name
        ).to.equal(status.PERMISSION_DENIED);
    });

    it("[API-015] owning another workspace does not lift a member's role in this one", async function () {
      const memberOwnsC = await world.as(world.memberA, world.wsA);
      await id(world.memberA.user, "createWorkspace", { name: `Member's own ${world.unique()}` });

      expect(
        await codeOf(id(await world.as(world.memberA, world.wsA), "inviteUserToWorkspace", {
          email: `y-${world.unique()}@api.test`,
          name: "Y",
          role: "WORKSPACE_MEMBER"
        }))
      ).to.equal(status.PERMISSION_DENIED);
      expect(memberOwnsC.accessKeyId).to.equal(world.wsA.accessKeyId);
    });
  });

  describe("tokens", function () {
    it("[API-016] signing in issues an id, an access and a refresh token, each signed by Identity", async function () {
      const tokens = await exchange(world.ownerA.email, PASSWORD);

      for (const t of [tokens.idToken, tokens.accessToken, tokens.refreshToken])
        expect(() => jwt.verify(t, world.stack.publicKey, { algorithms: ["RS256"] })).to.not.throw();
      expect(decode(tokens.idToken).tokenUse).to.equal("id");
      expect(decode(tokens.accessToken).tokenUse).to.equal("access");
      expect(decode(tokens.refreshToken).tokenUse).to.equal("refresh");
    });

    it("[API-017] the access token carries the caller's accessKeyId and a role per workspace", async function () {
      const claims = decode((await exchange(world.adminA.email, PASSWORD)).accessToken);

      expect(claims.accessKeyId).to.equal(world.adminA.user.accessKeyId);
      expect(claims.access).to.deep.include({ accessKeyId: world.wsA.accessKeyId, role: "WORKSPACE_ADMIN" });
    });

    it("[API-018] a right password is exchanged for tokens and a wrong one is not", async function () {
      const tokens = await exchange(world.ownerB.email, PASSWORD);
      expect(tokens.accessToken).to.be.a("string").and.not.empty;
      expect(tokens.refreshToken).to.be.a("string").and.not.empty;

      expect(await codeOf(exchange(world.ownerB.email, "not-the-password"))).to.not.equal("ok");
    });

    it("[API-019] with MFA enforced, valid credentials without a valid MFA code are refused", async function () {
      const variant = await world.stack.identityVariant({ twoFactorAuthenticationRequired: true });
      try {
        const d = createDrivers(variant.endpoint).find((x) => x.name === "grpc")!;
        const user = await world.signUp("Mfa");

        expect(await codeOf(exchange(user.email, PASSWORD, d)), "no code").to.not.equal("ok");
        expect(
          await codeOf(d.call(undefined, "Identity", "exchangeCredentials", { username: user.email, password: PASSWORD, twoFactorCode: "000000" })),
          "wrong code"
        ).to.not.equal("ok");
      } finally {
        await variant.stop();
      }
    });

    it("[API-020] a refresh token is exchanged for a new access and refresh token", async function () {
      const first = await exchange(world.ownerA.email, PASSWORD);

      const next = await refresh(first.refreshToken);

      // Access tokens issued in the same second may be equal; the refresh token is new every time.
      expect(next.accessToken).to.be.a("string").and.not.empty;
      expect(decode(next.refreshToken).jti).to.not.equal(decode(first.refreshToken).jti);
    });

    it("[API-021] ExchangeRefreshToken given an access or id token is UNAUTHENTICATED", async function () {
      const tokens = await exchange(world.ownerA.email, PASSWORD);

      expect(await codeOf(refresh(tokens.accessToken)), "access").to.equal(status.UNAUTHENTICATED);
      expect(await codeOf(refresh(tokens.idToken)), "id").to.equal(status.UNAUTHENTICATED);
    });

    it("[API-022] a refresh token past its lifetime is refused", async function () {
      const variant = await world.stack.identityVariant({ refreshTokenExpiresIn: "1s" });
      try {
        const d = createDrivers(variant.endpoint).find((x) => x.name === "grpc")!;
        const tokens = await exchange(world.ownerB.email, PASSWORD, d);
        await new Promise((done) => setTimeout(done, 2500));

        expect(await codeOf(refresh(tokens.refreshToken, d))).to.equal(status.UNAUTHENTICATED);
      } finally {
        await variant.stop();
      }
    });

    it("[API-023] reusing a refresh token after the grace period revokes the whole sign-in", async function () {
      const first = await exchange(world.ownerB.email, PASSWORD);
      const second = await refresh(first.refreshToken);
      await world.stack.identitySql(
        `UPDATE refresh_tokens SET used_at = now() - interval '1 minute' WHERE jti = $1`,
        String(decode(first.refreshToken).jti)
      );

      expect(await codeOf(refresh(first.refreshToken)), "reuse").to.equal(status.UNAUTHENTICATED);
      expect(await codeOf(refresh(second.refreshToken)), "the rotated token").to.equal(status.UNAUTHENTICATED);
    });

    it("[API-024] RevokeToken ends the sign-in: neither the token nor its rotations can be exchanged", async function () {
      const first = await exchange(world.ownerB.email, PASSWORD);
      const second = await refresh(first.refreshToken);

      await id(undefined, "revokeToken", { token: second.refreshToken });

      expect(await codeOf(refresh(second.refreshToken)), "revoked").to.equal(status.UNAUTHENTICATED);
      expect(await codeOf(refresh(first.refreshToken)), "earlier in the family").to.equal(status.UNAUTHENTICATED);
    });
  });

  describe("dashboard cookie session", function () {
    const post = (path: string, headers: Record<string, string> = {}, json?: unknown) =>
      fetch(`${world.stack.httpUrl}/api/session${path}`, {
        method: "POST",
        headers: {
          "x-requested-with": "fonoster",
          ...(json ? { "content-type": "application/json" } : {}),
          ...headers
        },
        body: json ? JSON.stringify(json) : undefined
      });
    const cookieOf = (res: Response) =>
      (res.headers.get("set-cookie") ?? "").match(/fonoster_session=([^;]*)/)?.[1] ?? "";

    it("[API-025] refresh answers new tokens, moves the cookie to the next refresh token and retires the previous one", async function () {
      const { refreshToken } = await exchange(world.ownerA.email, PASSWORD);

      const res = await post("/refresh", { cookie: `fonoster_session=${refreshToken}` });

      expect(res.status).to.equal(200);
      const json = (await res.json()) as Tokens;
      expect(json.accessToken).to.be.a("string").and.not.empty;
      expect(json.idToken).to.be.a("string").and.not.empty;
      const next = cookieOf(res);
      expect(next).to.not.be.empty.and.not.equal(refreshToken);
      await world.stack.identitySql(
        `UPDATE refresh_tokens SET used_at = now() - interval '1 minute' WHERE jti = $1`,
        String(decode(refreshToken).jti)
      );
      expect(await codeOf(refresh(refreshToken)), "the previous value").to.equal(status.UNAUTHENTICATED);
    });

    it("[API-026] refresh without a cookie, or with one Identity refuses, is 401 and clears the cookie", async function () {
      expect((await post("/refresh")).status, "no cookie").to.equal(401);

      const res = await post("/refresh", { cookie: "fonoster_session=not-a-token" });
      expect(res.status, "refused").to.equal(401);
      expect(res.headers.get("set-cookie") ?? "").to.match(/fonoster_session=;/);
    });

    it("[API-027] logout revokes the sign-in and clears the cookie", async function () {
      const { refreshToken } = await exchange(world.ownerA.email, PASSWORD);

      const res = await post("/logout", { cookie: `fonoster_session=${refreshToken}` });

      expect(res.headers.get("set-cookie") ?? "").to.match(/fonoster_session=;/);
      expect(await codeOf(refresh(refreshToken))).to.equal(status.UNAUTHENTICATED);
    });

    it("[API-028] a request without X-Requested-With is 403 and the cookie is neither used nor changed", async function () {
      const { refreshToken } = await exchange(world.ownerA.email, PASSWORD);

      const res = await fetch(`${world.stack.httpUrl}/api/session/refresh`, {
        method: "POST",
        headers: { cookie: `fonoster_session=${refreshToken}` }
      });

      expect(res.status).to.equal(403);
      expect(res.headers.get("set-cookie")).to.equal(null);
      expect(await codeOf(refresh(refreshToken)), "still good").to.equal("ok");
    });
  });

  describe("token verification", function () {
    it("[API-029] with the key from GetPublicKey a good token verifies and a tampered or foreign one does not", async function () {
      const { publicKey } = (await id(undefined, "getPublicKey", {})) as { publicKey: string };
      const { accessToken } = await exchange(world.ownerA.email, PASSWORD);
      const claims = decode(accessToken);

      expect(() => jwt.verify(accessToken, publicKey, { algorithms: ["RS256"], issuer: String(claims.iss), audience: String(claims.aud) })).to.not.throw();
      const [h, p, s] = accessToken.split(".");
      const forged = Buffer.from(JSON.stringify({ ...claims, accessKeyId: "USforged" })).toString("base64url");
      expect(() => jwt.verify(`${h}.${forged}.${s}`, publicKey, { algorithms: ["RS256"] })).to.throw();
      expect(() => jwt.verify(accessToken, publicKey, { algorithms: ["RS256"], audience: "someone-else" })).to.throw();
      expect(p).to.be.a("string");
    });

    it("[API-030] a protected method given a refresh or id token, or a forged access token, is UNAUTHENTICATED", async function () {
      const tokens = await exchange(world.ownerA.email, PASSWORD);
      const call = (accessToken: string) =>
        codeOf(raw.call({ accessKeyId: world.wsA.accessKeyId, accessToken }, "Applications", "listApplications", { pageSize: 10 }));
      const [h, , s] = tokens.accessToken.split(".");
      const noAccess = Buffer.from(JSON.stringify({ ...decode(tokens.accessToken), access: "everything" })).toString("base64url");

      expect(await call(tokens.refreshToken), "refresh").to.equal(status.UNAUTHENTICATED);
      expect(await call(tokens.idToken), "id").to.equal(status.UNAUTHENTICATED);
      expect(await call(`${h}.${noAccess}.${s}`), "tampered").to.equal(status.UNAUTHENTICATED);
      expect(await call("garbage"), "garbage").to.equal(status.UNAUTHENTICATED);
      // The server keeps serving.
      expect(await codeOf(raw.call(await world.as(world.ownerA, world.wsA), "Applications", "listApplications", { pageSize: 10 }))).to.equal("ok");
    });
  });

  describe("sign-in methods and email codes", function () {
    it("[API-031] with password sign-in disabled, a right password is PERMISSION_DENIED", async function () {
      const variant = await world.stack.identityVariant({ auth: { methods: ["github", "email_code"], signup: "open" } });
      try {
        const d = createDrivers(variant.endpoint).find((x) => x.name === "grpc")!;
        expect(await codeOf(exchange(world.ownerA.email, PASSWORD, d))).to.equal(status.PERMISSION_DENIED);
      } finally {
        await variant.stop();
      }
    });

    it("[API-032] an existing user exchanges an emailed code for the three tokens and is marked verified", async function () {
      const user = await world.signUp("Coded");
      const code = await emailedCode(user.email);

      const tokens = await id(undefined, "exchangeVerificationCode", { email: user.email, code });

      expect(tokens.idToken && tokens.accessToken && tokens.refreshToken).to.be.a("string").and.not.empty;
      const [row] = (await world.stack.identitySql(`SELECT email_verified FROM users WHERE ref = $1`, user.userRef)) as { email_verified: boolean }[];
      expect(row.email_verified).to.equal(true);
    });

    it("[API-033] with invite-only sign-up, an unknown email's valid code is refused and no user is created", async function () {
      const variant = await world.stack.identityVariant({ auth: { methods: ["password", "email_code"], signup: "invite" } });
      try {
        const d = createDrivers(variant.endpoint).find((x) => x.name === "grpc")!;
        const email = `stranger-${world.unique()}@api.test`;
        const code = await emailedCode(email, d);

        const error = await d.call(undefined, "Identity", "exchangeVerificationCode", { email, code }).then(() => undefined, (e) => e);

        expect(error, "refused").to.exist;
        expect(error.details ?? error.message).to.match(/Invalid verification code/);
        expect(await world.stack.identitySql(`SELECT ref FROM users WHERE email = $1`, email)).to.have.length(0);
      } finally {
        await variant.stop();
      }
    });

    it("[API-034] a code works once", async function () {
      const user = await world.signUp("Once");
      const code = await emailedCode(user.email);

      await id(undefined, "exchangeVerificationCode", { email: user.email, code });

      expect(await codeOf(id(undefined, "exchangeVerificationCode", { email: user.email, code }))).to.not.equal("ok");
    });

    it("[API-035] after 5 wrong codes the right one no longer works", async function () {
      const user = await world.signUp("Guesser");
      const code = await emailedCode(user.email);
      const wrong = String((Number(code) + 1) % 1_000_000).padStart(6, "0");

      for (let i = 0; i < 5; i++)
        expect(await codeOf(id(undefined, "exchangeVerificationCode", { email: user.email, code: wrong }))).to.not.equal("ok");

      expect(await codeOf(id(undefined, "exchangeVerificationCode", { email: user.email, code }))).to.not.equal("ok");
    });

    it("[API-036] a code used 6 minutes after it was sent fails", async function () {
      const user = await world.signUp("Late");
      const code = await emailedCode(user.email);
      await world.stack.identitySql(
        `UPDATE verification_codes SET expires_at = expires_at - interval '6 minutes', created_at = created_at - interval '6 minutes' WHERE value = $1`,
        user.email
      );

      expect(await codeOf(id(undefined, "exchangeVerificationCode", { email: user.email, code }))).to.not.equal("ok");
    });
  });

  describe("passwords", function () {
    it("[API-037] a user from before digests signs in, gets a digest and loses the encrypted password", async function () {
      const user = await world.signUp("Legacy");
      // What an old release stored: the password field-encrypted, no digest.
      await world.stack.identityPrisma.user.update({
        where: { ref: user.userRef },
        data: { password: PASSWORD, passwordDigest: null }
      });

      expect(await codeOf(exchange(user.email, PASSWORD))).to.equal("ok");

      const [row] = (await world.stack.identitySql(
        `SELECT password_hash, password_digest FROM users WHERE ref = $1`,
        user.userRef
      )) as { password_hash: string | null; password_digest: string | null }[];
      expect(row.password_digest).to.match(/^scrypt\$/);
      expect(row.password_hash).to.equal(null);
    });

    it("[API-038] an invitee signing in with the one-time password gets mustChangePassword in the id token", async function () {
      const email = `invitee-${world.unique()}@api.test`;
      const invite = await emailAfter(email, async () =>
        id(await world.as(world.ownerA, world.wsA), "inviteUserToWorkspace", { email, name: "Invitee", role: "WORKSPACE_MEMBER" })
      );
      const otp = otpIn(invite);
      expect(otp, "a one-time password in the invite").to.be.a("string");

      const tokens = await exchange(email, otp!);

      expect(decode(tokens.idToken).mustChangePassword).to.equal(true);
    });

    it("[API-039] a resent invite carries a new one-time password", async function () {
      const email = `resent-${world.unique()}@api.test`;
      const owner = await world.as(world.ownerA, world.wsA);
      let userRef = "";
      const first = await emailAfter(email, async () => {
        ({ userRef } = (await id(owner, "inviteUserToWorkspace", { email, name: "Resent", role: "WORKSPACE_MEMBER" })) as { userRef: string });
      });

      const second = await emailAfter(email, () => id(owner, "resendWorkspaceMembershipInvitation", { userRef }));

      expect(otpIn(first), "first one-time password").to.be.a("string");
      expect(otpIn(second), "second one-time password").to.be.a("string").and.not.equal(otpIn(first));
    });
  });

  describe("API keys", function () {
    it("[API-040] a member's CreateApiKey is PERMISSION_DENIED and no key is created", async function () {
      const owner = await world.as(world.ownerA, world.wsA);
      const before = ((await id(owner, "listApiKeys", { pageSize: 100 })).items as unknown[]).length;

      for (const d of world.drivers)
        expect(await codeOf(d.call(await world.as(world.memberA, world.wsA), "ApiKeys", "createApiKey", { role: "WORKSPACE_ADMIN" })), d.name).to.equal(
          status.PERMISSION_DENIED
        );

      expect(((await id(owner, "listApiKeys", { pageSize: 100 })).items as unknown[]).length).to.equal(before);
    });

    it("[API-041] deleting or regenerating another workspace's key is NOT_FOUND and the key is unchanged", async function () {
      const key = (await id(await world.as(world.ownerB, world.wsB), "createApiKey", { role: "WORKSPACE_ADMIN" })) as { ref: string; accessKeyId: string; accessKeySecret: string };
      const adminA = await world.as(world.adminA, world.wsA);

      for (const d of world.drivers) {
        expect(await codeOf(d.call(adminA, "ApiKeys", "deleteApiKey", { ref: key.ref })), `${d.name} delete`).to.equal(status.NOT_FOUND);
        expect(await codeOf(d.call(adminA, "ApiKeys", "regenerateApiKey", { ref: key.ref })), `${d.name} regenerate`).to.equal(status.NOT_FOUND);
      }

      expect(await codeOf(id(undefined, "exchangeApiKey", { accessKeyId: key.accessKeyId, accessKeySecret: key.accessKeySecret })), "B's key still works").to.equal("ok");
    });

    it("[API-042] an expired key with the right secret is PERMISSION_DENIED", async function () {
      const key = (await id(await world.as(world.ownerA, world.wsA), "createApiKey", { role: "WORKSPACE_ADMIN" })) as { ref: string; accessKeyId: string; accessKeySecret: string };
      await world.stack.identitySql(`UPDATE api_keys SET expires_at = now() - interval '1 day' WHERE ref = $1`, key.ref);

      const error = await id(undefined, "exchangeApiKey", { accessKeyId: key.accessKeyId, accessKeySecret: key.accessKeySecret }).then(() => undefined, (e) => e);

      expect(error, "refused").to.exist;
      expect(error.code).to.equal(status.PERMISSION_DENIED);
      expect(error.details ?? error.message).to.match(/Invalid credentials/);
    });
  });

  describe("password reset and throttling", function () {
    it("[API-043] a reset link points at the configured app URL, not the one in the request", async function () {
      const user = await world.signUp("Reset");

      const mail = await emailAfter(user.email, () =>
        id(undefined, "sendResetPasswordCode", { username: user.email, resetPasswordUrl: "https://evil.example.com/steal" })
      );
      expect(mail).to.contain("https://api.test/reset-password?token=");
      expect(mail).to.not.contain("evil.example.com");
    });

    it("[API-044] the reset limit holds across replicas, one of which restarts", async function () {
      const user = await world.signUp("Replicas");
      let one = await world.stack.identityVariant({});
      const two = await world.stack.identityVariant({});
      const grpcOf = (endpoint: string) => createDrivers(endpoint).find((x) => x.name === "grpc")!;
      const ask = (d: Driver) => codeOf(id(undefined, "sendResetPasswordCode", { username: user.email }, d));
      try {
        expect(await ask(grpcOf(one.endpoint)), "1st").to.equal("ok");
        expect(await ask(grpcOf(two.endpoint)), "2nd").to.equal("ok");
        await one.stop();
        one = await world.stack.identityVariant({});
        expect(await ask(grpcOf(one.endpoint)), "3rd").to.equal("ok");
        expect(await ask(grpcOf(two.endpoint)), "4th").to.equal(status.RESOURCE_EXHAUSTED);
      } finally {
        await one.stop();
        await two.stop();
      }
    });

    it("[API-045] a fourth reset email within 10 minutes is RESOURCE_EXHAUSTED and not sent", async function () {
      const user = await world.signUp("Many");
      for (let i = 0; i < 3; i++) await emailAfter(user.email, () => id(undefined, "sendResetPasswordCode", { username: user.email }));

      expect(await codeOf(id(undefined, "sendResetPasswordCode", { username: user.email }))).to.equal(status.RESOURCE_EXHAUSTED);
      await new Promise((done) => setTimeout(done, 1000));
      expect(world.stack.emails.filter((e) => e.to === user.email).length, "emails").to.equal(3);
    });

    it("[API-046] after ten wrong passwords the next sign-in is RESOURCE_EXHAUSTED, right password or not", async function () {
      const user = await world.signUp("Guessed");
      for (let i = 0; i < 10; i++) await codeOf(exchange(user.email, `wrong-${i}`));

      expect(await codeOf(exchange(user.email, PASSWORD))).to.equal(status.RESOURCE_EXHAUSTED);
    });
  });

  describe("email ownership and password changes", function () {
    it("[API-047] the email's owner signing in with a code takes the account and the squatter's password stops working", async function () {
      const squatter = await world.signUp("Squatter");

      const code = await emailedCode(squatter.email);
      await id(undefined, "exchangeVerificationCode", { email: squatter.email, code });

      expect(await codeOf(exchange(squatter.email, PASSWORD))).to.not.equal("ok");
    });

    it("[API-048] VerifyCode with one user's code and another's username is PERMISSION_DENIED and leaves them unverified", async function () {
      const a = await world.signUp("Verifier");
      const b = await world.signUp("Victim");
      const verificationCode = await emailedCode(a.email);

      const code = await codeOf(id(a.user, "verifyCode", { username: b.email, contactType: "EMAIL", value: a.email, verificationCode }));

      expect(code).to.equal(status.PERMISSION_DENIED);
      const [row] = (await world.stack.identitySql(`SELECT email_verified FROM users WHERE ref = $1`, b.userRef)) as { email_verified: boolean }[];
      expect(row.email_verified).to.equal(false);
    });

    it("[API-049] UpdateUser with a new password but no current one is PERMISSION_DENIED and the password is unchanged", async function () {
      const user = await world.signUp("Stolen");

      expect(await codeOf(raw.call(user.user, "Users", "updateUser", { ref: user.userRef, password: "N3w-password-123" }))).to.equal(status.PERMISSION_DENIED);
      expect(await codeOf(exchange(user.email, PASSWORD))).to.equal("ok");
    });
  });
});
