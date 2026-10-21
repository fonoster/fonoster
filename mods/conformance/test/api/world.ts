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
import { randomBytes } from "crypto";
import { createDrivers, Driver, Who } from "./drivers";
import { Stack, startStack } from "./stack";

// The world every API case runs in: one stack for the whole run, two workspaces (A and B) with
// their owners, and a member and an admin of A. Users sign up and sign in through the API itself;
// only membership acceptance is set in the database (it is an emailed link, not an RPC).

type Account = {
  email: string;
  password: string;
  userRef: string;
  /** The user's own accessKeyId (US...), for calls outside a workspace. */
  user: Who;
  refreshToken: string;
};

type Workspace = { ref: string; accessKeyId: string };

type World = {
  stack: Stack;
  drivers: Driver[];
  /** The gRPC driver, for setup the cases do not test. */
  raw: Driver;
  ownerA: Account;
  ownerB: Account;
  memberA: Account;
  adminA: Account;
  wsA: Workspace;
  wsB: Workspace;
  /** A workspace-scoped caller: the account's token, refreshed to carry its roles, on that workspace. */
  as(account: Account, ws: Workspace): Promise<Who>;
  /** A new user that signed up with a password. */
  signUp(name?: string): Promise<Account>;
  /** A new workspace owned by the account. */
  createWorkspace(owner: Account, name: string): Promise<Workspace>;
  /** A fresh unique suffix for names. */
  unique(): string;
};

const PASSWORD = "Sup3r-secret-pass";

const decode = (jwt: string) =>
  JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString()) as Record<
    string,
    unknown
  >;

let world: Promise<World> | undefined;

async function build(): Promise<World> {
  const stack = await startStack();
  const drivers = createDrivers(stack.endpoint);
  const raw = drivers.find((d) => d.name === "grpc")!;
  const unique = () => randomBytes(4).toString("hex");

  async function exchange(email: string, password: string) {
    return raw.call<{
      accessToken: string;
      refreshToken: string;
      idToken: string;
    }>(undefined, "Identity", "exchangeCredentials", {
      username: email,
      password
    });
  }

  async function signUp(name = "User"): Promise<Account> {
    const email = `${name.toLowerCase().replace(/\W/g, "")}-${unique()}@api.test`;
    const { ref } = await raw.call<{ ref: string }>(
      undefined,
      "Users",
      "createUser",
      {
        name,
        email,
        password: PASSWORD
      }
    );
    const tokens = await exchange(email, PASSWORD);
    const accessKeyId = String(decode(tokens.accessToken).accessKeyId);
    return {
      email,
      password: PASSWORD,
      userRef: ref,
      user: { accessKeyId, accessToken: tokens.accessToken },
      refreshToken: tokens.refreshToken
    };
  }

  async function as(account: Account, ws: Workspace): Promise<Who> {
    const tokens = await raw.call<{
      accessToken: string;
      refreshToken: string;
    }>(undefined, "Identity", "exchangeRefreshToken", {
      refreshToken: account.refreshToken
    });
    account.refreshToken = tokens.refreshToken;
    return { accessKeyId: ws.accessKeyId, accessToken: tokens.accessToken };
  }

  async function createWorkspace(
    owner: Account,
    name: string
  ): Promise<Workspace> {
    const { ref } = await raw.call<{ ref: string }>(
      owner.user,
      "Workspaces",
      "createWorkspace",
      { name }
    );
    const [row] = (await stack.identitySql(
      `SELECT access_key_id FROM workspaces WHERE ref = $1`,
      ref
    )) as { access_key_id: string }[];
    return { ref, accessKeyId: row.access_key_id };
  }

  /** Invites an existing user with a role and accepts the invitation for them. */
  async function join(
    owner: Account,
    ws: Workspace,
    account: Account,
    role: string
  ) {
    await raw.call(await as(owner, ws), "Workspaces", "inviteUserToWorkspace", {
      email: account.email,
      name: "Invited",
      role
    });
    await stack.identitySql(
      `UPDATE workspace_members SET status = 'ACTIVE' WHERE user_ref = $1 AND workspace_ref = $2`,
      account.userRef,
      ws.ref
    );
  }

  const ownerA = await signUp("Owner A");
  const ownerB = await signUp("Owner B");
  const memberA = await signUp("Member A");
  const adminA = await signUp("Admin A");
  const wsA = await createWorkspace(ownerA, "Acme");
  const wsB = await createWorkspace(ownerB, "Bravo");
  await join(ownerA, wsA, memberA, "WORKSPACE_MEMBER");
  await join(ownerA, wsA, adminA, "WORKSPACE_ADMIN");

  return {
    stack,
    drivers,
    raw,
    ownerA,
    ownerB,
    memberA,
    adminA,
    wsA,
    wsB,
    as,
    signUp,
    createWorkspace,
    unique
  };
}

/** The world for this run, built once. */
function getWorld() {
  world ??= build();
  return world;
}

async function stopWorld() {
  if (world) await (await world).stack.stop();
  world = undefined;
}

export { getWorld, stopWorld, decode, World, Account, Workspace, PASSWORD };
