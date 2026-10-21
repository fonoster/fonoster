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
/*
 * An in-memory workspace behind GrpcWebMock: its name, API keys, webhooks and
 * members, kept the way the API keeps them (secrets returned once, on create,
 * regenerate or rotate). Registered after the fixture's defaults, so its
 * Identity/ListWorkspaces wins.
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { workspace as workspaceMessage } from "./fixtures";
import { identity, type GrpcWebMock } from "./grpc-web";

const require = createRequire(import.meta.url);
const sdkDir = dirname(require.resolve("@fonoster/sdk/package.json"));
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const webhooksPb: any = require(
  join(sdkDir, "src/generated/web", "webhooks_pb.js")
);

export type ApiKeyRow = {
  ref: string;
  accessKeyId: string;
  secret: string;
  role: string;
  expiresAt: number;
};
export type WebhookRow = {
  ref: string;
  url: string;
  events: string[];
  secret: string;
  previousSecretUntil: number;
};
export type MemberRow = {
  ref: string;
  userRef: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "PENDING";
};

const NOW = 1_760_000_000;

export class FakeWorkspace {
  name: string;
  deleted = false;
  readonly apiKeys = new Map<string, ApiKeyRow>();
  readonly webhooks = new Map<string, WebhookRow>();
  readonly members = new Map<string, MemberRow>();
  private seq = 0;

  constructor(
    readonly ref: string,
    name: string,
    readonly ownerRef: string
  ) {
    this.name = name;
  }

  private next(prefix: string) {
    this.seq += 1;
    return `${prefix}-${this.seq}`;
  }

  addMember(row: Omit<MemberRow, "ref">) {
    const ref = this.next("mb");
    this.members.set(ref, { ...row, ref });
    return ref;
  }

  addApiKey(row: Partial<ApiKeyRow> & { accessKeyId: string }) {
    const ref = row.ref ?? this.next("ak");
    this.apiKeys.set(ref, {
      secret: "old-secret",
      role: "WORKSPACE_ADMIN",
      expiresAt: 0,
      ...row,
      ref
    });
    return ref;
  }

  install(api: GrpcWebMock) {
    const decode = (type: string, bytes: Uint8Array) =>
      identity[type].deserializeBinary(bytes).toObject();

    api
      .on("Identity/ListWorkspaces", () => {
        const list = new identity.ListWorkspacesResponse();
        list.setItemsList(
          this.deleted
            ? []
            : [workspaceMessage(this.ref, this.name, this.ownerRef)]
        );
        return list;
      })
      .on("Identity/GetWorkspace", () =>
        workspaceMessage(this.ref, this.name, this.ownerRef)
      )
      .on("Identity/UpdateWorkspace", (bytes) => {
        const { name } = decode("UpdateWorkspaceRequest", bytes);
        if (name) this.name = name;
        const response = new identity.UpdateWorkspaceResponse();
        response.setRef(this.ref);
        return response;
      })
      .on("Identity/DeleteWorkspace", () => {
        this.deleted = true;
        const response = new identity.DeleteWorkspaceResponse();
        response.setRef(this.ref);
        return response;
      });

    // API keys: the secret only comes back from create and regenerate.
    const keyMessage = (row: ApiKeyRow) => {
      const key = new identity.ApiKey();
      key.setRef(row.ref);
      key.setAccessKeyId(row.accessKeyId);
      key.setRole(row.role);
      key.setExpiresAt(row.expiresAt);
      key.setCreatedAt(NOW);
      key.setUpdatedAt(NOW);
      return key;
    };
    api
      .on("Identity/ListApiKeys", () => {
        const list = new identity.ListApiKeysResponse();
        list.setItemsList([...this.apiKeys.values()].map(keyMessage));
        list.setNextPageToken("");
        return list;
      })
      .on("Identity/CreateApiKey", (bytes) => {
        const { role, expiresAt } = decode("CreateApiKeyRequest", bytes);
        const ref = this.next("ak");
        const row = {
          ref,
          accessKeyId: `AK${ref.replace("-", "")}e2e`,
          secret: `secret-${ref}`,
          role,
          expiresAt
        };
        this.apiKeys.set(ref, row);
        const response = new identity.CreateApiKeyResponse();
        response.setRef(ref);
        response.setAccessKeyId(row.accessKeyId);
        response.setAccessKeySecret(row.secret);
        return response;
      })
      .on("Identity/RegenerateApiKey", (bytes) => {
        const { ref } = decode("RegenerateApiKeyRequest", bytes);
        const row = this.apiKeys.get(ref)!;
        row.secret = `regenerated-${ref}`;
        const response = new identity.RegenerateApiKeyResponse();
        response.setRef(ref);
        response.setAccessKeyId(row.accessKeyId);
        response.setAccessKeySecret(row.secret);
        return response;
      })
      .on("Identity/DeleteApiKey", (bytes) => {
        const { ref } = decode("DeleteApiKeyRequest", bytes);
        this.apiKeys.delete(ref);
        const response = new identity.DeleteApiKeyResponse();
        response.setRef(ref);
        return response;
      });

    // Members.
    const memberMessage = (row: MemberRow) => {
      const m = new identity.WorkspaceMember();
      m.setRef(row.ref);
      m.setUserRef(row.userRef);
      m.setName(row.name);
      m.setEmail(row.email);
      m.setRole(row.role);
      m.setStatus(row.status);
      m.setCreatedAt(NOW);
      m.setUpdatedAt(NOW);
      return m;
    };
    api
      .on("Identity/ListWorkspaceMembers", () => {
        const list = new identity.ListWorkspaceMembersResponse();
        list.setItemsList([...this.members.values()].map(memberMessage));
        list.setNextPageToken("");
        return list;
      })
      .on("Identity/InviteUserToWorkspace", (bytes) => {
        const { email, role, name } = decode(
          "InviteUserToWorkspaceRequest",
          bytes
        );
        const userRef = `u-${email.split("@")[0]}`;
        this.addMember({ userRef, name, email, role, status: "PENDING" });
        const response = new identity.InviteUserToWorkspaceResponse();
        response.setUserRef(userRef);
        return response;
      })
      .on("Identity/ResendWorkspaceMembershipInvitation", (bytes) => {
        const { userRef } = decode(
          "ResendWorkspaceMembershipInvitationRequest",
          bytes
        );
        const response =
          new identity.ResendWorkspaceMembershipInvitationResponse();
        response.setUserRef(userRef);
        return response;
      })
      .on("Identity/RemoveUserFromWorkspace", (bytes) => {
        const { userRef } = decode("RemoveUserFromWorkspaceRequest", bytes);
        for (const [ref, m] of this.members)
          if (m.userRef === userRef) this.members.delete(ref);
        const response = new identity.RemoveUserFromWorkspaceResponse();
        response.setUserRef(userRef);
        return response;
      });

    // Webhooks: the signing secret only comes back from create and rotate.
    const w = webhooksPb;
    const hookMessage = (row: WebhookRow) => {
      const m = new w.Webhook();
      m.setRef(row.ref);
      m.setUrl(row.url);
      m.setEventsList(row.events);
      m.setSecretHint(row.secret.slice(-4));
      m.setPreviousSecretUntil(row.previousSecretUntil);
      m.setCreatedAt(NOW);
      m.setUpdatedAt(NOW);
      return m;
    };
    api
      .on("Webhooks/ListWebhooks", () => {
        const list = new w.ListWebhooksResponse();
        list.setItemsList([...this.webhooks.values()].map(hookMessage));
        list.setNextPageToken("");
        return list;
      })
      .on("Webhooks/ListWebhookDeliveries", () => {
        const list = new w.ListWebhookDeliveriesResponse();
        list.setItemsList([]);
        return list;
      })
      .on("Webhooks/CreateWebhook", (bytes) => {
        const { url, eventsList } =
          w.CreateWebhookRequest.deserializeBinary(bytes).toObject();
        const ref = this.next("wh");
        const row = {
          ref,
          url,
          events: eventsList,
          secret: `whsec_${ref}`,
          previousSecretUntil: 0
        };
        this.webhooks.set(ref, row);
        const response = new w.CreateWebhookResponse();
        response.setRef(ref);
        response.setSecret(row.secret);
        return response;
      })
      .on("Webhooks/UpdateWebhook", (bytes) => {
        const r = w.UpdateWebhookRequest.deserializeBinary(bytes).toObject();
        const row = this.webhooks.get(r.ref)!;
        row.url = r.url || row.url;
        if (r.eventsList?.length) row.events = r.eventsList;
        const response = new w.UpdateWebhookResponse();
        response.setRef(r.ref);
        return response;
      })
      .on("Webhooks/RotateWebhookSecret", (bytes) => {
        const { ref } =
          w.RotateWebhookSecretRequest.deserializeBinary(bytes).toObject();
        const row = this.webhooks.get(ref)!;
        row.secret = `whsec_rotated_${ref}`;
        row.previousSecretUntil = NOW + 24 * 3600;
        const response = new w.RotateWebhookSecretResponse();
        response.setRef(ref);
        response.setSecret(row.secret);
        response.setPreviousSecretUntil(row.previousSecretUntil);
        return response;
      })
      .on("Webhooks/DeleteWebhook", (bytes) => {
        const { ref } =
          w.DeleteWebhookRequest.deserializeBinary(bytes).toObject();
        this.webhooks.delete(ref);
        const response = new w.DeleteWebhookResponse();
        response.setRef(ref);
        return response;
      });
    return this;
  }
}
