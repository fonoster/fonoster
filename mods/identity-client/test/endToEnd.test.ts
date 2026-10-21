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
import { status } from "@grpc/grpc-js";
import { expect } from "chai";
import {
  StandaloneIdentity,
  startStandaloneIdentity
} from "../../identity/test/server/standalone";
import { IdentityClient } from "../src";

// identity-client spec: one client instance drives a standalone Identity service through
// sign-up → login → create/rename workspace → invite, forwarding each caller's own token
// (harden-conformance 5.1). Needs PERSISTENCE_TEST_DATABASE_URL and `npm run build`; skipped
// without a test database.

const PASSWORD = "s3cret-passw0rd";

describe("@identity-client[end to end] (needs PERSISTENCE_TEST_DATABASE_URL)", function () {
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

  const signUp = async (name: string, email: string) => {
    const { ref } = await client.createUser({
      name,
      email,
      password: PASSWORD
    });
    const tokens = await client.exchangeCredentials({
      username: email,
      password: PASSWORD
    });
    return { ref, ...tokens };
  };

  it("[API-064] signs up, logs in, creates and renames a workspace, and invites a member", async function () {
    const owner = await signUp("Owner", "owner@identity.test");

    const { ref } = await client.createWorkspace("Acme", owner.accessToken);
    // A new workspace reaches the access token on the next refresh.
    const { accessToken } = await client.exchangeRefreshToken(
      owner.refreshToken
    );
    const claims = await client.verifyToken(accessToken);
    const workspace = await client.getWorkspace(ref, accessToken);
    expect(workspace).to.include({ ref, name: "Acme", ownerRef: owner.ref });
    expect(claims?.access.map((a) => a.accessKeyId)).to.include(
      workspace.accessKeyId
    );

    await client.updateWorkspace(ref, "Acme Corp", accessToken);
    expect((await client.getWorkspace(ref, accessToken)).name).to.equal(
      "Acme Corp"
    );

    const { userRef } = await client.inviteUserToWorkspace(
      {
        email: "invitee@identity.test",
        name: "Invitee",
        role: "WORKSPACE_MEMBER"
      },
      workspace.accessKeyId,
      accessToken
    );
    const { items } = await client.listWorkspaceMembers(
      workspace.accessKeyId,
      accessToken
    );
    expect(items.find((m) => m.userRef === userRef)).to.include({
      email: "invitee@identity.test",
      role: "WORKSPACE_MEMBER",
      status: "PENDING"
    });
    const invite = identity!.emails.find(
      (e) => e.to === "invitee@identity.test"
    );
    expect(invite, "invitation email").to.exist;
    expect(invite!.data).to.include("Acme Corp");
  });

  it("[API-064] revokes the refresh token on sign-out", async function () {
    const user = await signUp("Leaver", "leaver@identity.test");
    await client.revokeToken(user.refreshToken);
    const error = await client.exchangeRefreshToken(user.refreshToken).then(
      () => undefined,
      (e: { code: number }) => e
    );
    expect(error?.code, "exchange after revoke").to.equal(
      status.UNAUTHENTICATED
    );
  });

  it("[API-068] forwards each caller's own token through one client instance", async function () {
    const alice = await signUp("Alice", "alice@identity.test");
    const bob = await signUp("Bob", "bob@identity.test");
    const { ref } = await client.createWorkspace("Alice's", alice.accessToken);

    // Same client, different callers: each call carries its caller's token.
    const mine = await client.listWorkspaces(alice.accessToken);
    const theirs = await client.listWorkspaces(bob.accessToken);
    expect(mine.items.map((w) => w.ref)).to.include(ref);
    expect(theirs.items.map((w) => w.ref)).not.to.include(ref);

    // And a call without a token is still unauthenticated afterwards.
    const error = await client.listWorkspaces("").then(
      () => undefined,
      (e: { code: number }) => e
    );
    expect(error?.code, "listWorkspaces without a token").to.equal(
      status.UNAUTHENTICATED
    );
  });
});
