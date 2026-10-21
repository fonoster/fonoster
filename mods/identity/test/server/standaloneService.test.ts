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
import { createServiceDefinition } from "@fonoster/common";
import { IdentityClient } from "@fonoster/identity-client";
import * as grpc from "@grpc/grpc-js";
import { status } from "@grpc/grpc-js";
import { expect } from "chai";
import jwt from "jsonwebtoken";
import { StandaloneIdentity, startStandaloneIdentity } from "./standalone";

// identity-service spec, against the real `fonoster-identity` bin and a fresh Postgres database
// (harden-conformance 4.1–4.3). Needs PERSISTENCE_TEST_DATABASE_URL; skipped without one.

const PASSWORD = "s3cret-passw0rd";

/** RevokeToken isn't wrapped by @fonoster/identity-client yet. */
const revokeToken = (endpoint: string, token: string) => {
  const Identity = grpc.makeGenericClientConstructor(
    createServiceDefinition({
      serviceName: "Identity",
      pckg: "identity",
      proto: "identity.proto",
      version: "v1beta2"
    }),
    "",
    {}
  );
  const client = new Identity(endpoint, grpc.credentials.createInsecure()) as unknown as {
    revokeToken(req: object, cb: (e: grpc.ServiceError | null) => void): void;
    close(): void;
  };
  return new Promise<void>((resolve, reject) =>
    client.revokeToken({ token }, (error) => {
      client.close();
      return error ? reject(error) : resolve();
    })
  );
};

/** The email body with quoted-printable soft breaks and escapes undone. */
const decoded = (data: string) =>
  data.replace(/=\r?\n/g, "").replace(/=3D/g, "=");

const rejectsWith = async (call: Promise<unknown>, code: status) => {
  try {
    await call;
  } catch (error) {
    expect((error as { code: number }).code).to.equal(code);
    return;
  }
  expect.fail(`expected the call to fail with ${status[code]}`);
};

describe("@identity[standalone service] (needs PERSISTENCE_TEST_DATABASE_URL)", function () {
  this.timeout(60000);

  let identity: StandaloneIdentity | undefined;
  let client: IdentityClient;

  before(async function () {
    identity = await startStandaloneIdentity();
    if (!identity)
      throw new Error(
        "PERSISTENCE_TEST_DATABASE_URL is required: a skipped case is Blocked, never Pass"
      );
    client = new IdentityClient(identity.endpoint);
  });

  after(async function () {
    client?.close();
    await identity?.stop();
  });

  it("[API-058] serves fonoster.identity.v1beta2 on the configured port and reports healthy", async function () {
    expect(await identity!.health()).to.equal("SERVING");

    const { publicKey } = await client.getPublicKey();
    expect(publicKey).to.equal(identity!.publicKey);
  });

  it("[API-059] provisions a fresh database with the entrypoint, then signs up, logs in and creates a workspace", async function () {
    const applied = await identity!.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      "SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL"
    );
    expect(Number(applied[0].count)).to.equal(identity!.migrations);

    const email = "ada@identity.test";
    const { ref: userRef } = await client.createUser({
      name: "Ada",
      email,
      password: PASSWORD
    });
    const { accessToken } = await client.exchangeCredentials({
      username: email,
      password: PASSWORD
    });
    expect(jwt.decode(accessToken)).to.include({ sub: userRef });

    const { ref } = await client.createWorkspace(
      "Ada's workspace",
      accessToken
    );
    const workspace = await identity!.prisma.workspace.findUnique({
      where: { ref }
    });
    expect(workspace).to.include({
      name: "Ada's workspace",
      ownerRef: userRef
    });
  });

  it("[API-060] runs allow-listed methods without a token and requires a valid token for the rest", async function () {
    // Allow-listed: sign-up, login and the public key need no token.
    const email = "grace@identity.test";
    await client.createUser({ name: "Grace", email, password: PASSWORD });
    const { accessToken } = await client.exchangeCredentials({
      username: email,
      password: PASSWORD
    });
    await client.getPublicKey();

    // Not allow-listed: no token, or one signed by another key, is unauthenticated.
    await rejectsWith(client.listWorkspaces(""), status.UNAUTHENTICATED);
    // CreateWorkspace takes its owner from the token, so it isn't allow-listed.
    await rejectsWith(
      client.createWorkspace("No owner", ""),
      status.UNAUTHENTICATED
    );
    const { privateKey: otherKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" }
    });
    const forged = jwt.sign(jwt.decode(accessToken) as object, otherKey, {
      algorithm: "RS256"
    });
    await rejectsWith(client.listWorkspaces(forged), status.UNAUTHENTICATED);

    // With the access token Identity issued, the same call goes through.
    const { items } = await client.listWorkspaces(accessToken);
    expect(items).to.be.an("array");
  });

  it("[API-030] never accepts a refresh token as an access token, and keeps serving", async function () {
    const email = "linus@identity.test";
    await client.createUser({ name: "Linus", email, password: PASSWORD });
    const { refreshToken, idToken, accessToken } =
      await client.exchangeCredentials({ username: email, password: PASSWORD });

    await rejectsWith(client.listWorkspaces(refreshToken), status.UNAUTHENTICATED);
    await rejectsWith(client.listWorkspaces(idToken), status.UNAUTHENTICATED);
    expect(await identity!.health()).to.equal("SERVING");
    const { items } = await client.listWorkspaces(accessToken);
    expect(items).to.be.an("array");
  });

  it("[API-023] rotates refresh tokens, detects reuse, and revokes on sign-out", async function () {
    const email = "edsger@identity.test";
    await client.createUser({ name: "Edsger", email, password: PASSWORD });
    const first = await client.exchangeCredentials({
      username: email,
      password: PASSWORD
    });

    // An access token is not a refresh token.
    await rejectsWith(
      client.exchangeRefreshToken(first.accessToken),
      status.UNAUTHENTICATED
    );

    const second = await client.exchangeRefreshToken(first.refreshToken);
    const third = await client.exchangeRefreshToken(second.refreshToken);

    // Replaying a used token (after the short grace period) revokes the chain.
    await identity!.prisma.refreshToken.updateMany({
      where: { usedAt: { not: null } },
      data: { usedAt: new Date(Date.now() - 60_000) }
    });
    await rejectsWith(
      client.exchangeRefreshToken(first.refreshToken),
      status.UNAUTHENTICATED
    );
    await rejectsWith(
      client.exchangeRefreshToken(third.refreshToken),
      status.UNAUTHENTICATED
    );

    // A new sign-in, then sign-out with RevokeToken.
    const session = await client.exchangeCredentials({
      username: email,
      password: PASSWORD
    });
    await revokeToken(identity!.endpoint, session.refreshToken);
    await rejectsWith(
      client.exchangeRefreshToken(session.refreshToken),
      status.UNAUTHENTICATED
    );
  });

  it("[API-042] scopes API keys to the caller's workspace and enforces their expiry", async function () {
    const signUp = async (name: string, email: string) => {
      await client.createUser({ name, email, password: PASSWORD });
      const { accessToken } = await client.exchangeCredentials({
        username: email,
        password: PASSWORD
      });
      const { ref } = await client.createWorkspace(`${name}'s`, accessToken);
      const workspace = await identity!.prisma.workspace.findUnique({
        where: { ref }
      });
      // The new workspace reaches the token on the next sign-in.
      const fresh = await client.exchangeCredentials({
        username: email,
        password: PASSWORD
      });
      return { token: fresh.accessToken, workspace: workspace!.accessKeyId };
    };
    const alice = await signUp("Alice", "alice@identity.test");
    const bob = await signUp("Bob", "bob@identity.test");

    const key = await client.createApiKey(
      { role: "WORKSPACE_ADMIN" } as never,
      alice.workspace,
      alice.token
    );

    // Bob, in his own workspace, can't touch Alice's key by its ref...
    await rejectsWith(
      client.regenerateApiKey(key.ref, bob.workspace, bob.token),
      status.NOT_FOUND
    );
    await rejectsWith(
      client.deleteApiKey(key.ref, bob.workspace, bob.token),
      status.NOT_FOUND
    );
    // ...nor by naming Alice's workspace.
    await rejectsWith(
      client.deleteApiKey(key.ref, alice.workspace, bob.token),
      status.PERMISSION_DENIED
    );
    const stored = await identity!.prisma.apiKey.findUnique({
      where: { ref: key.ref }
    });
    expect(stored).to.exist;

    // A key past its expiresAt no longer exchanges.
    await client.exchangeApiKey(key.accessKeyId, key.accessKeySecret);
    await identity!.prisma.apiKey.update({
      where: { ref: key.ref },
      data: { expiresAt: new Date(Date.now() - 1000) }
    });
    await rejectsWith(
      client.exchangeApiKey(key.accessKeyId, key.accessKeySecret),
      status.PERMISSION_DENIED
    );
  });

  it("[API-043] links reset emails to the configured page, whatever URL the request names", async function () {
    const email = "barbara@identity.test";
    await client.createUser({ name: "Barbara", email, password: PASSWORD });

    await client.sendResetPasswordCode(email, "https://attacker.example/steal");

    const message = identity!.emails.filter((e) => e.to === email).pop();
    expect(message, "reset email").to.exist;
    const body = decoded(message!.data);
    // Handlebars escapes the "=" after token.
    expect(body).to.include('href="https://identity.test/reset-password?token');
    expect(body).to.not.include("attacker.example");
  });

  it("[API-045] rate limits reset emails per address", async function () {
    const email = "frances@identity.test";
    await client.createUser({ name: "Frances", email, password: PASSWORD });

    for (let i = 0; i < 3; i++) {
      await client.sendResetPasswordCode(email, "");
    }
    await rejectsWith(
      client.sendResetPasswordCode(email, ""),
      status.RESOURCE_EXHAUSTED
    );
  });
});
