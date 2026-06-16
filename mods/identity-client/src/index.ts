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
import { join } from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const PROTO_PATH = join(__dirname, "..", "proto", "identity.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: false,
  arrays: true,
  oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition) as unknown as {
  fonoster: { identity: { v1beta2: { Identity: grpc.ServiceClientConstructor } } };
};

const IdentityService = proto.fonoster.identity.v1beta2.Identity;

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
}

export interface ExchangeCredentialsRequest {
  username: string;
  password: string;
  twoFactorCode?: string;
}

export interface ExchangeResponse {
  idToken?: string;
  accessToken: string;
  refreshToken: string;
}

export interface Workspace {
  ref: string;
  name: string;
  ownerRef: string;
  accessKeyId: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface WorkspaceMember {
  ref: string;
  userRef: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface InviteMemberRequest {
  email: string;
  role: string;
  name?: string;
}

/**
 * Lightweight, stateless client for the Fonoster Identity gRPC service. Targets
 * any Identity endpoint and wraps the callback-based stubs in promises.
 *
 * Authenticated calls accept the caller's access `token` and active `accessKeyId`
 * per call, forwarded as gRPC metadata — so a server can act on behalf of many
 * different callers using one client instance.
 */
export class IdentityClient {
  private readonly client: grpc.Client;

  constructor(
    endpoint: string,
    credentials: grpc.ChannelCredentials = grpc.credentials.createInsecure()
  ) {
    this.client = new IdentityService(endpoint, credentials);
  }

  private unary<TRes>(
    method: string,
    request: object,
    meta: { token?: string; accessKeyId?: string } = {}
  ): Promise<TRes> {
    const metadata = new grpc.Metadata();
    if (meta.token) metadata.set("token", meta.token);
    if (meta.accessKeyId) metadata.set("accesskeyid", meta.accessKeyId);

    const client = this.client as unknown as Record<
      string,
      (
        req: object,
        md: grpc.Metadata,
        cb: (err: grpc.ServiceError | null, res: TRes) => void
      ) => void
    >;

    return new Promise<TRes>((resolve, reject) => {
      client[method](request, metadata, (err, res) => (err ? reject(err) : resolve(res)));
    });
  }

  getPublicKey(): Promise<{ publicKey: string }> {
    return this.unary("getPublicKey", {});
  }

  createUser(request: CreateUserRequest): Promise<{ ref: string }> {
    return this.unary("createUser", request);
  }

  exchangeCredentials(request: ExchangeCredentialsRequest): Promise<ExchangeResponse> {
    return this.unary("exchangeCredentials", request);
  }

  exchangeRefreshToken(refreshToken: string): Promise<ExchangeResponse> {
    return this.unary("exchangeRefreshToken", { refreshToken });
  }

  createWorkspace(name: string, token: string): Promise<{ ref: string }> {
    return this.unary("createWorkspace", { name }, { token });
  }

  listWorkspaces(token: string): Promise<{ items: Workspace[]; nextPageToken?: string }> {
    return this.unary("listWorkspaces", {}, { token });
  }

  getWorkspace(ref: string, token: string): Promise<Workspace> {
    return this.unary("getWorkspace", { ref }, { token });
  }

  updateWorkspace(ref: string, name: string, token: string): Promise<{ ref: string }> {
    return this.unary("updateWorkspace", { ref, name }, { token });
  }

  listWorkspaceMembers(
    accessKeyId: string,
    token: string
  ): Promise<{ items: WorkspaceMember[]; nextPageToken?: string }> {
    return this.unary("listWorkspaceMembers", {}, { token, accessKeyId });
  }

  inviteUserToWorkspace(
    request: InviteMemberRequest,
    accessKeyId: string,
    token: string
  ): Promise<{ userRef: string }> {
    return this.unary("inviteUserToWorkspace", request, { token, accessKeyId });
  }

  removeUserFromWorkspace(
    userRef: string,
    accessKeyId: string,
    token: string
  ): Promise<{ userRef: string }> {
    return this.unary("removeUserFromWorkspace", { userRef }, { token, accessKeyId });
  }

  resendWorkspaceMembershipInvitation(
    userRef: string,
    accessKeyId: string,
    token: string
  ): Promise<{ userRef: string }> {
    return this.unary("resendWorkspaceMembershipInvitation", { userRef }, { token, accessKeyId });
  }

  sendResetPasswordCode(username: string, resetPasswordUrl: string): Promise<void> {
    return this.unary("sendResetPasswordCode", { username, resetPasswordUrl });
  }

  resetPassword(username: string, password: string, verificationCode: string): Promise<void> {
    return this.unary("resetPassword", { username, password, verificationCode });
  }

  close() {
    this.client.close();
  }
}

/** Convenience factory. The endpoint is required — no environment-variable fallback. */
export function createIdentityClient(
  endpoint: string,
  credentials?: grpc.ChannelCredentials
): IdentityClient {
  return new IdentityClient(endpoint, credentials);
}
