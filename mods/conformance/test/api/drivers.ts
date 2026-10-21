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
import { join, resolve } from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as SDK from "../../../sdk/src/node";

// The two clients every shared case runs through: the Node SDK, and plain gRPC on the canonical
// protos (the way a client in another language sees the API). A case names the SDK class and
// method; the gRPC driver calls the same RPC. They must agree: when only one fails, the bug is in
// the SDK's mapping or in the server's handling of the raw message.

const PROTOS = resolve(__dirname, "../../../common/src/protos");

/** Who makes a call: the active workspace (or user) and an access token for it. */
type Who = { accessKeyId: string; accessToken: string };

type CallError = Error & { code: number; details?: string };

type Driver = {
  name: "sdk" | "grpc";
  call<T = Record<string, unknown>>(
    who: Who | undefined,
    api: string,
    method: string,
    request: unknown
  ): Promise<T>;
};

/** SDK class -> the service that serves it. */
const SERVICES: Record<
  string,
  { proto: string; pckg: string; service: string }
> = {
  Applications: {
    proto: "applications.proto",
    pckg: "applications",
    service: "Applications"
  },
  Secrets: { proto: "secrets.proto", pckg: "secrets", service: "Secrets" },
  Numbers: { proto: "numbers.proto", pckg: "numbers", service: "Numbers" },
  Trunks: { proto: "trunks.proto", pckg: "trunks", service: "Trunks" },
  Agents: { proto: "agents.proto", pckg: "agents", service: "Agents" },
  Credentials: {
    proto: "credentials.proto",
    pckg: "credentials",
    service: "CredentialsService"
  },
  Domains: { proto: "domains.proto", pckg: "domains", service: "Domains" },
  Acls: { proto: "acls.proto", pckg: "acls", service: "Acls" },
  Calls: { proto: "calls.proto", pckg: "calls", service: "Calls" },
  Capabilities: {
    proto: "capabilities.proto",
    pckg: "capabilities",
    service: "Capabilities"
  },
  ApiKeys: { proto: "identity.proto", pckg: "identity", service: "Identity" },
  Users: { proto: "identity.proto", pckg: "identity", service: "Identity" },
  Workspaces: {
    proto: "identity.proto",
    pckg: "identity",
    service: "Identity"
  },
  Identity: { proto: "identity.proto", pckg: "identity", service: "Identity" }
};

/** SDK methods whose argument is the bare ref, not a request object. */
const REF_ONLY =
  /^(get|delete)[A-Z]|^regenerateApiKey$|^resendWorkspaceMembershipInvitation$|^removeUserFromWorkspace$/;

/** SDK method -> RPC, where the names differ. */
const RPC_NAMES: Record<string, string> = {};

const rpcName = (method: string) =>
  RPC_NAMES[method] ?? method[0].toUpperCase() + method.slice(1);

const loadOptions = {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  arrays: true,
  oneofs: true
};

function createGrpcDriver(endpoint: string): Driver {
  const clients = new Map<string, grpc.Client>();
  const client = (api: string) => {
    const s = SERVICES[api];
    if (!s) throw new Error(`no service for ${api}`);
    const key = `${s.pckg}.${s.service}`;
    if (!clients.has(key)) {
      const pkg = grpc.loadPackageDefinition(
        protoLoader.loadSync(join(PROTOS, s.proto), loadOptions)
      ) as unknown as Record<
        string,
        Record<string, Record<string, Record<string, typeof grpc.Client>>>
      >;
      const Ctor = pkg.fonoster[s.pckg].v1beta2[s.service];
      clients.set(key, new Ctor(endpoint, grpc.credentials.createInsecure()));
    }
    return clients.get(key)! as unknown as Record<
      string,
      (
        req: unknown,
        md: grpc.Metadata,
        cb: (e: grpc.ServiceError | null, r: unknown) => void
      ) => void
    >;
  };
  return {
    name: "grpc",
    call: (who, api, method, request) => {
      const metadata = new grpc.Metadata();
      if (who) {
        metadata.set("token", who.accessToken);
        metadata.set("accesskeyid", who.accessKeyId);
      }
      const c = client(api);
      const rpc = rpcName(method);
      const fn = c[rpc] ?? c[rpc[0].toLowerCase() + rpc.slice(1)];
      if (!fn) throw new Error(`${api} has no RPC ${rpc}`);
      return new Promise((done, fail) =>
        fn.call(c, request ?? {}, metadata, (error, response) =>
          error ? fail(error) : done(response as never)
        )
      );
    }
  };
}

function createSdkDriver(endpoint: string): Driver {
  return {
    name: "sdk",
    call: async (who, api, method, request) => {
      const client = new SDK.Client({
        endpoint,
        accessKeyId: who?.accessKeyId ?? "",
        allowInsecure: true,
        withoutInterceptors: true
      });
      if (who) client.setAccessToken(who.accessToken);
      const Api = (
        SDK as unknown as Record<
          string,
          new (
            c: SDK.Client
          ) => Record<string, (r: unknown) => Promise<unknown>>
        >
      )[api];
      if (!Api) throw new Error(`the SDK has no ${api}`);
      const instance = new Api(client);
      if (typeof instance[method] !== "function")
        throw new Error(`SDK ${api} has no ${method}`);
      const arg =
        REF_ONLY.test(method) && request && typeof request === "object"
          ? (request as { ref: string }).ref
          : request;
      return (await instance[method](arg)) as never;
    }
  };
}

function createDrivers(endpoint: string): Driver[] {
  return [createSdkDriver(endpoint), createGrpcDriver(endpoint)];
}

/** The gRPC status of a rejected call, or "ok". */
async function codeOf(p: Promise<unknown>): Promise<number | "ok"> {
  try {
    await p;
    return "ok";
  } catch (e) {
    const code = (e as CallError).code;
    if (typeof code !== "number") throw e;
    return code;
  }
}

export { createDrivers, codeOf, Driver, Who, CallError, SERVICES };
