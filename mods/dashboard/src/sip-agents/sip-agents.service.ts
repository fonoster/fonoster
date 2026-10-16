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
import type {
  Agent,
  CreateAgentRequest,
  Credentials,
  Privacy,
  UpdateAgentRequest
} from "@fonoster/types";
import { plain } from "~/domains/domains.service";
import { useSdk } from "~/lib/auth";
import { useResourceList, useResourceMutation } from "~/lib/resource";

// SIP users are "agents" in the SDK (not AI agents).
const RESOURCE = "agents";

/** What the API sends and expects (the types' Privacy enum says "ID"). */
export type PrivacyValue = "NONE" | "PRIVATE";

export const asPrivacy = (value: PrivacyValue) => value as unknown as Privacy;

/** Registration expiry the API requires on create; not shown in the form. */
export const DEFAULT_EXPIRES = 3600;

export type SipUserRow = {
  ref: string;
  name: string;
  username: string;
  privacy: PrivacyValue;
  enabled: boolean;
  maxContacts?: number;
  domain?: { ref: string; name: string; domainUri: string };
  credentials?: { ref: string; name: string; username: string };
};

/** Normalizes an SDK agent (its nested domain/credentials are raw protobufs). */
export function toSipUserRow(agent: Agent): SipUserRow {
  const privacy = String(agent.privacy);
  const domain = plain<SipUserRow["domain"]>(agent.domain);
  const credentials = plain<SipUserRow["credentials"]>(agent.credentials);
  return {
    ref: agent.ref,
    name: agent.name,
    username: agent.username,
    privacy: privacy === "PRIVATE" || privacy === "ID" ? "PRIVATE" : "NONE",
    enabled: Boolean(agent.enabled),
    maxContacts: agent.maxContacts || undefined,
    domain: domain?.ref ? domain : undefined,
    credentials: credentials?.ref ? credentials : undefined
  };
}

export function sipUri(user: Pick<SipUserRow, "username" | "domain">) {
  return user.domain?.domainUri
    ? `sip:${user.username}@${user.domain.domainUri}`
    : `sip:${user.username}`;
}

export function useSipUsers() {
  const sdk = useSdk();
  const list = useResourceList<Agent>(RESOURCE, (request) =>
    sdk.agents.listAgents(request)
  );
  return { ...list, rows: list.items.map(toSipUserRow) };
}

export function useCreateSipUser() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (request: CreateAgentRequest) => sdk.agents.createAgent(request),
    { success: "SIP user added" }
  );
}

export function useUpdateSipUser() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (request: UpdateAgentRequest) => sdk.agents.updateAgent(request),
    { success: "SIP user updated" }
  );
}

/** Flip a SIP user on or off from the list; errors go to a toast. */
export function useToggleSipUser() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    ({ ref, enabled }: { ref: string; enabled: boolean }) =>
      sdk.agents.updateAgent({ ref, enabled }),
    { toastErrors: true }
  );
}

export function useDeleteSipUser() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (ref: string) => sdk.agents.deleteAgent(ref),
    { success: "SIP user deleted" }
  );
}

/** Credentials to pick from (first page; same cache as the Credentials screen). */
export function useCredentialsLookup() {
  const sdk = useSdk();
  return useResourceList<Credentials>("credentials", (request) =>
    sdk.credentials.listCredentials(request)
  );
}
