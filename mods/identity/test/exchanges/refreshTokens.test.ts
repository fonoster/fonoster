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
import { status } from "@grpc/grpc-js";
import { expect } from "chai";
import jwt from "jsonwebtoken";
import { REFRESH_TOKEN_REUSE_GRACE_MS } from "../../src/constants";
import { Prisma } from "../../src/db";
import { createExchangeApiKey } from "../../src/exchanges/createExchangeApiKey";
import { createExchangeRefreshToken } from "../../src/exchanges/createExchangeRefreshToken";
import { createRevokeToken } from "../../src/exchanges/createRevokeToken";
import { exchangeTokens } from "../../src/exchanges/exchangeTokens";
import { IdentityConfig } from "../../src/exchanges/types";

// H4 (API key expiry) and H6 (refresh tokens only, rotation, revocation).

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" }
});

const config = {
  issuer: "https://id.test",
  audience: "api",
  privateKey,
  publicKey,
  idTokenExpiresIn: "15m",
  accessTokenExpiresIn: "15m",
  refreshTokenExpiresIn: "24h",
  auth: { methods: ["password"], signup: "open" }
} as unknown as IdentityConfig;

type Row = {
  jti: string;
  familyId: string;
  accessKeyId: string;
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
};

type Where = Record<string, unknown>;

/** Matches the filters the store uses: equality, null, { gt }, { lt }. */
const matches = (row: Row, where: Where) =>
  Object.entries(where).every(([field, condition]) => {
    const value = row[field as keyof Row];
    if (condition && typeof condition === "object" && !(condition instanceof Date)) {
      const { gt, lt } = condition as { gt?: Date; lt?: Date };
      if (gt) return (value as Date) > gt;
      if (lt) return (value as Date) < lt;
    }
    return value === condition;
  });

/** Prisma with in-memory refresh tokens, one user and one API key. */
function fakePrisma(apiKey?: { expiresAt: Date | null }) {
  const rows: Row[] = [];
  const user = {
    ref: "user-ref",
    accessKeyId: "USuser0001",
    email: "ana@acme.com",
    ownedWorkspaces: [],
    memberships: []
  };
  const key = apiKey && {
    ref: "key-ref",
    accessKeyId: "APkey0001",
    accessKeySecret: "secret",
    role: "WORKSPACE_ADMIN",
    workspace: { accessKeyId: "WOworkspace01" },
    ...apiKey
  };
  const prisma = {
    rows,
    user: {
      findFirst: async ({ where }: { where: Where }) =>
        where.accessKeyId === user.accessKeyId ? user : null
    },
    apiKey: {
      findFirst: async ({ where }: { where: Where }) =>
        key && where.accessKeyId === key.accessKeyId ? key : null
    },
    refreshToken: {
      create: async ({ data }: { data: Row }) => {
        rows.push({ usedAt: null, revokedAt: null, ...data });
      },
      deleteMany: async ({ where }: { where: Where }) => {
        const keep = rows.filter((r) => !matches(r, where));
        const count = rows.length - keep.length;
        rows.splice(0, rows.length, ...keep);
        return { count };
      },
      updateMany: async ({ where, data }: { where: Where; data: object }) => {
        const hit = rows.filter((r) => matches(r, where));
        hit.forEach((r) => Object.assign(r, data));
        return { count: hit.length };
      },
      findUnique: async ({ where }: { where: { jti: string } }) =>
        rows.find((r) => r.jti === where.jti) ?? null
    }
  };
  return prisma as unknown as Prisma & { rows: Row[] };
}

/** Calls a handler and resolves with what it passed to the callback. */
function invoke(handler: Function, request: unknown) {
  return new Promise<{ error?: { code: number }; response?: any }>((resolve) =>
    handler({ request }, (error: { code: number }, response: unknown) =>
      resolve({ error, response })
    )
  );
}

describe("@identity[exchanges/refresh tokens]", function () {
  it("rotates: a refresh token works once, and its successor works", async function () {
    const prisma = fakePrisma();
    const refresh = createExchangeRefreshToken(prisma, config);
    const first = await exchangeTokens(prisma, config)("USuser0001");

    const second = await invoke(refresh, { refreshToken: first.refreshToken });
    expect(second.error).to.be.null;
    expect(second.response.refreshToken).to.not.equal(first.refreshToken);

    const third = await invoke(refresh, {
      refreshToken: second.response.refreshToken
    });
    expect(third.error).to.be.null;
    // All three belong to the same sign-in.
    expect(new Set(prisma.rows.map((r) => r.familyId)).size).to.equal(1);
  });

  it("lets a just-used token be used again within the grace period (two tabs)", async function () {
    const prisma = fakePrisma();
    const refresh = createExchangeRefreshToken(prisma, config);
    const first = await exchangeTokens(prisma, config)("USuser0001");

    const [a, b] = await Promise.all([
      invoke(refresh, { refreshToken: first.refreshToken }),
      invoke(refresh, { refreshToken: first.refreshToken })
    ]);
    expect(a.error).to.be.null;
    expect(b.error).to.be.null;
  });

  it("treats reuse of a used token as theft: refused, and the family is revoked", async function () {
    const prisma = fakePrisma();
    const refresh = createExchangeRefreshToken(prisma, config);
    const first = await exchangeTokens(prisma, config)("USuser0001");
    const second = await invoke(refresh, { refreshToken: first.refreshToken });
    // Past the grace period for concurrent renewals.
    const used = prisma.rows.find((r) => r.usedAt);
    used!.usedAt = new Date(Date.now() - REFRESH_TOKEN_REUSE_GRACE_MS - 1000);

    const replay = await invoke(refresh, { refreshToken: first.refreshToken });
    expect(replay.error).to.include({ code: status.UNAUTHENTICATED });

    // The legitimate successor stops working too.
    const next = await invoke(refresh, {
      refreshToken: second.response.refreshToken
    });
    expect(next.error).to.include({ code: status.UNAUTHENTICATED });
  });

  it("accepts only refresh tokens", async function () {
    const prisma = fakePrisma();
    const refresh = createExchangeRefreshToken(prisma, config);
    const { idToken, accessToken } = await exchangeTokens(prisma, config)(
      "USuser0001"
    );
    const sign = (claims: object) =>
      jwt.sign(claims, privateKey, {
        algorithm: "RS256",
        expiresIn: "1h",
        issuer: config.issuer,
        audience: config.audience
      });
    const invite = sign({
      sub: "user-ref",
      accessKeyId: "USuser0001",
      memberRef: "m",
      tokenUse: "invite"
    });
    const legacyInvite = sign({
      sub: "user-ref",
      accessKeyId: "USuser0001",
      memberRef: "m"
    });
    // A refresh token issued before rotation (no jti) is refused as well.
    const unrecorded = sign({
      sub: "user-ref",
      accessKeyId: "USuser0001",
      tokenUse: "refresh"
    });

    for (const token of [idToken, accessToken, invite, legacyInvite, unrecorded, "junk"]) {
      const { error, response } = await invoke(refresh, { refreshToken: token });
      expect(error).to.include({ code: status.UNAUTHENTICATED });
      expect(response).to.be.undefined;
    }
  });

  it("refuses refresh tokens for another issuer or audience", async function () {
    const prisma = fakePrisma();
    const refresh = createExchangeRefreshToken(prisma, config);
    const { refreshToken } = await exchangeTokens(prisma, {
      ...config,
      issuer: "https://elsewhere.test"
    })("USuser0001");

    const { error } = await invoke(refresh, { refreshToken });
    expect(error).to.include({ code: status.UNAUTHENTICATED });
  });

  it("RevokeToken signs the session out: its refresh tokens stop working", async function () {
    const prisma = fakePrisma();
    const refresh = createExchangeRefreshToken(prisma, config);
    const revoke = createRevokeToken(prisma, config);
    const first = await exchangeTokens(prisma, config)("USuser0001");
    const second = await invoke(refresh, { refreshToken: first.refreshToken });
    const other = await exchangeTokens(prisma, config)("USuser0001");

    const revoked = await invoke(revoke, {
      token: second.response.refreshToken
    });
    expect(revoked.error).to.be.null;

    const after = await invoke(refresh, {
      refreshToken: second.response.refreshToken
    });
    expect(after.error).to.include({ code: status.UNAUTHENTICATED });

    // Another sign-in (another family) is unaffected.
    const elsewhere = await invoke(refresh, { refreshToken: other.refreshToken });
    expect(elsewhere.error).to.be.null;
  });

  it("RevokeToken refuses tokens that aren't refresh tokens", async function () {
    const prisma = fakePrisma();
    const revoke = createRevokeToken(prisma, config);
    const { accessToken } = await exchangeTokens(prisma, config)("USuser0001");

    const { error } = await invoke(revoke, { token: accessToken });
    expect(error).to.include({ code: status.UNAUTHENTICATED });
  });
});

describe("@identity[exchanges/API key expiry]", function () {
  const past = () => new Date(Date.now() - 1000);
  const future = () => new Date(Date.now() + 3600_000);

  it("exchanges a key that hasn't expired, or never expires", async function () {
    for (const expiresAt of [future(), null]) {
      const prisma = fakePrisma({ expiresAt });
      const { error, response } = await invoke(
        createExchangeApiKey(prisma, config),
        { accessKeyId: "APkey0001", accessKeySecret: "secret" }
      );
      expect(error).to.be.null;
      expect(response).to.have.property("accessToken");
    }
  });

  it("refuses an expired key like a wrong secret", async function () {
    const prisma = fakePrisma({ expiresAt: past() });
    const { error, response } = await invoke(
      createExchangeApiKey(prisma, config),
      { accessKeyId: "APkey0001", accessKeySecret: "secret" }
    );
    expect(error).to.deep.equal({
      code: status.PERMISSION_DENIED,
      message: "Invalid credentials"
    });
    expect(response).to.be.undefined;
  });

  it("stops refreshing a key's session once the key expires", async function () {
    const key = { expiresAt: future() as Date | null };
    const prisma = fakePrisma(key);
    const { refreshToken } = await exchangeTokens(prisma, config)("APkey0001");

    // Expire the key (fakePrisma spreads `key`, so change it through the lookup).
    const stored = await prisma.apiKey.findFirst({
      where: { accessKeyId: "APkey0001" }
    });
    (stored as { expiresAt: Date }).expiresAt = past();

    const { error } = await invoke(createExchangeRefreshToken(prisma, config), {
      refreshToken
    });
    expect(error).to.include({ code: status.UNAUTHENTICATED });
  });
});
