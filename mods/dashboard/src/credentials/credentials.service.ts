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
  CreateCredentialsRequest,
  Credentials,
  UpdateCredentialsRequest
} from "@fonoster/types";
import { useMemo } from "react";
import { useSdk } from "~/lib/auth";
import { useResourceList, useResourceMutation } from "~/lib/resource";

const RESOURCE = "credentials";

export function useCredentials() {
  const sdk = useSdk();
  return useResourceList<Credentials>(RESOURCE, (request) =>
    sdk.credentials.listCredentials(request)
  );
}

export function useCreateCredentials() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (request: CreateCredentialsRequest) =>
      sdk.credentials.createCredentials(request),
    { success: "Credentials created" }
  );
}

export type UpdateCredentialsInput = {
  ref: string;
  name: string;
  username: string;
  /** Omitted to keep the current password. */
  password?: string;
};

export function useUpdateCredentials() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    // The proto and API take username and password on update, but the SDK
    // type only declares `name` (types/src/credentials.types.ts).
    (request: UpdateCredentialsInput) =>
      sdk.credentials.updateCredentials(
        request as unknown as UpdateCredentialsRequest
      ),
    { success: "Credentials saved" }
  );
}

export function useDeleteCredentials() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (ref: string) => sdk.credentials.deleteCredentials(ref),
    { success: "Credentials deleted" }
  );
}

/**
 * The list APIs return linked credentials as objects (proto
 * `inbound_credentials`, `credentials`), while the SDK trunk type declares
 * `*CredentialsRef`; accept both.
 */
type LinkedTrunk = {
  name: string;
  inboundCredentialsRef?: string;
  outboundCredentialsRef?: string;
  inboundCredentials?: { ref?: string };
  outboundCredentials?: { ref?: string };
};

type LinkedAgent = {
  name: string;
  credentialsRef?: string;
  credentials?: { ref?: string };
};

/** "Trunk · Claro (outbound)" and "SIP agent · María" labels per credentials ref. */
export function useCredentialsUsage() {
  const sdk = useSdk();
  const trunks = useResourceList<LinkedTrunk>("trunks", (request) =>
    sdk.trunks.listTrunks(request)
  );
  const agents = useResourceList<LinkedAgent>("sip-agents", (request) =>
    sdk.agents.listAgents(request)
  );

  const usage = useMemo(() => {
    const map = new Map<string, string[]>();
    const add = (ref: string | undefined, label: string) => {
      if (!ref) return;
      map.set(ref, [...(map.get(ref) ?? []), label]);
    };
    for (const trunk of trunks.items) {
      add(
        trunk.inboundCredentialsRef || trunk.inboundCredentials?.ref,
        `Trunk · ${trunk.name} (inbound)`
      );
      add(
        trunk.outboundCredentialsRef || trunk.outboundCredentials?.ref,
        `Trunk · ${trunk.name} (outbound)`
      );
    }
    for (const agent of agents.items)
      add(
        agent.credentialsRef || agent.credentials?.ref,
        `SIP agent · ${agent.name}`
      );
    return map;
  }, [trunks.items, agents.items]);

  return {
    usage,
    /** False while loading or when either list failed; show "—" then. */
    ready: trunks.isSuccess && agents.isSuccess
  };
}
