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
import { Role } from "@fonoster/types";
import * as grpc from "@grpc/grpc-js";
import { expect } from "chai";
import jwt from "jsonwebtoken";
import { createAuthInterceptor } from "../../src/identity/createAuthInterceptor";

// C1/H3: the interceptor accepts access tokens only, fails closed, pins the
// issuer and audience, and checks the role held in the target workspace.

const ISSUER = "https://identity.test";
const AUDIENCE = "api";
const GET_USER = "/fonoster.identity.v1beta2.Identity/GetUser";
const SET_PROVIDER_KEY = "/fonoster.providers.v1beta2.Providers/SetProviderKey";
const LIST_APPS = "/fonoster.applications.v1beta2.Applications/ListApplications";

const keyPair = () =>
  generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" }
  });

const { privateKey, publicKey } = keyPair();

const sign = (
  claims: object,
  options: jwt.SignOptions = {},
  key: string = privateKey
) =>
  jwt.sign(claims, key, {
    algorithm: "RS256",
    expiresIn: "5m",
    issuer: ISSUER,
    audience: AUDIENCE,
    ...options
  });

const access = (accessList: object[] = []) =>
  sign({
    sub: "user-ref",
    accessKeyId: "USuser0001",
    tokenUse: "access",
    access: accessList
  });

const json = {
  serialize: (value: object) => Buffer.from(JSON.stringify(value)),
  deserialize: (buffer: Buffer) => JSON.parse(buffer.toString() || "{}")
};

/** A service whose methods have the paths the RBAC knows. */
const definition = Object.fromEntries(
  [GET_USER, SET_PROVIDER_KEY, LIST_APPS].map((path) => [
    path.split("/").pop() as string,
    {
      path,
      requestStream: false,
      responseStream: false,
      requestSerialize: json.serialize,
      requestDeserialize: json.deserialize,
      responseSerialize: json.serialize,
      responseDeserialize: json.deserialize
    }
  ])
) as grpc.ServiceDefinition;

type Client = grpc.Client &
  Record<
    string,
    (
      req: object,
      md: grpc.Metadata,
      cb: (err: grpc.ServiceError | null, res: object) => void
    ) => void
  >;

describe("@common[identity/createAuthInterceptor] (real gRPC server)", function () {
  let server: grpc.Server;
  let client: Client;

  before(async function () {
    server = new grpc.Server({
      interceptors: [
        createAuthInterceptor(publicKey, [], {
          issuer: ISSUER,
          audience: AUDIENCE
        })
      ]
    });
    const ok = (_: unknown, cb: (e: null, r: object) => void) =>
      cb(null, { ok: true });
    server.addService(definition, {
      GetUser: ok,
      SetProviderKey: ok,
      ListApplications: ok
    });
    const port = await new Promise<number>((resolve, reject) =>
      server.bindAsync(
        "127.0.0.1:0",
        grpc.ServerCredentials.createInsecure(),
        (error, bound) => (error ? reject(error) : resolve(bound))
      )
    );
    const Ctor = grpc.makeGenericClientConstructor(definition, "Test");
    client = new Ctor(
      `127.0.0.1:${port}`,
      grpc.credentials.createInsecure()
    ) as unknown as Client;
  });

  after(function () {
    client?.close();
    server?.forceShutdown();
  });

  const call = (method: string, token?: string, accessKeyId?: string) =>
    new Promise<number>((resolve) => {
      const metadata = new grpc.Metadata();
      if (token !== undefined) metadata.set("token", token);
      if (accessKeyId) metadata.set("accesskeyid", accessKeyId);
      client[method]({}, metadata, (error) =>
        resolve(error ? error.code : grpc.status.OK)
      );
    });

  it("accepts a valid access token", async function () {
    expect(await call("GetUser", access())).to.equal(grpc.status.OK);
  });

  [
    {
      name: "a refresh token",
      token: () =>
        sign({ sub: "u", accessKeyId: "USuser0001", tokenUse: "refresh" })
    },
    {
      name: "an id token",
      token: () =>
        sign({
          sub: "u",
          accessKeyId: "USuser0001",
          tokenUse: "id",
          email: "a@b.c"
        })
    },
    {
      name: "an invite token",
      token: () =>
        sign({
          sub: "u",
          accessKeyId: "WOworkspace01",
          tokenUse: "invite",
          memberRef: "m"
        })
    },
    {
      name: "an invite token from before invites had a tokenUse",
      token: () =>
        sign({ sub: "u", accessKeyId: "WOworkspace01", memberRef: "m" })
    },
    {
      name: "an access token without an access claim",
      token: () =>
        sign({ sub: "u", accessKeyId: "USuser0001", tokenUse: "access" })
    },
    {
      name: "an access token with a malformed access claim",
      token: () =>
        sign({
          sub: "u",
          accessKeyId: "USuser0001",
          tokenUse: "access",
          access: [null, 42]
        })
    },
    {
      name: "an access token for another issuer",
      token: () =>
        sign(
          { sub: "u", accessKeyId: "USuser0001", tokenUse: "access", access: [] },
          { issuer: "https://elsewhere.test" }
        )
    },
    {
      name: "an access token for another audience",
      token: () =>
        sign(
          { sub: "u", accessKeyId: "USuser0001", tokenUse: "access", access: [] },
          { audience: "other" }
        )
    },
    {
      name: "an access token signed by another key",
      token: () =>
        sign(
          { sub: "u", accessKeyId: "USuser0001", tokenUse: "access", access: [] },
          {},
          keyPair().privateKey
        )
    },
    { name: "garbage", token: () => "not-a-jwt" },
    { name: "no token", token: () => undefined }
  ].forEach(({ name, token }) => {
    it(`answers UNAUTHENTICATED to ${name} and keeps serving`, async function () {
      expect(await call("GetUser", token())).to.equal(
        grpc.status.UNAUTHENTICATED
      );
      expect(await call("ListApplications", token(), "WOworkspace01")).to.equal(
        grpc.status.UNAUTHENTICATED
      );
      // The server is still up and still serves valid callers.
      expect(await call("GetUser", access())).to.equal(grpc.status.OK);
    });
  });

  it("uses the caller's role in the target workspace only", async function () {
    const token = access([
      { accessKeyId: "WOworkspaceA", role: Role.WORKSPACE_OWNER },
      { accessKeyId: "WOworkspaceB", role: Role.WORKSPACE_MEMBER }
    ]);

    expect(await call("SetProviderKey", token, "WOworkspaceA")).to.equal(
      grpc.status.OK
    );
    // Owner of A, member of B: no owner-only methods in B.
    expect(await call("SetProviderKey", token, "WOworkspaceB")).to.equal(
      grpc.status.PERMISSION_DENIED
    );
    // Membership is enough for ordinary workspace methods.
    expect(await call("ListApplications", token, "WOworkspaceB")).to.equal(
      grpc.status.OK
    );
    // A workspace not in the token is refused.
    expect(await call("ListApplications", token, "WOworkspaceC")).to.equal(
      grpc.status.PERMISSION_DENIED
    );
  });
});
