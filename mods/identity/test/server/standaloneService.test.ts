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
import { IdentityClient } from "@fonoster/identity-client";
import { status } from "@grpc/grpc-js";
import { expect } from "chai";
import jwt from "jsonwebtoken";
import { StandaloneIdentity, startStandaloneIdentity } from "./standalone";

// identity-service spec, against the real `fonoster-identity` bin and a fresh Postgres database
// (harden-conformance 4.1–4.3). Needs PERSISTENCE_TEST_DATABASE_URL; skipped without one.

const PASSWORD = "s3cret-passw0rd";

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
    if (!identity) this.skip();
    client = new IdentityClient(identity.endpoint);
  });

  after(async function () {
    client?.close();
    await identity?.stop();
  });

  it("serves fonoster.identity.v1beta2 on the configured port and reports healthy", async function () {
    expect(await identity!.health()).to.equal("SERVING");

    const { publicKey } = await client.getPublicKey();
    expect(publicKey).to.equal(identity!.publicKey);
  });

  it("provisions a fresh database with the entrypoint, then signs up, logs in and creates a workspace", async function () {
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

  it("runs allow-listed methods without a token and requires a valid token for the rest", async function () {
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
});
