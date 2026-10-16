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
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ListApiKeysResponse
} from "@fonoster/types";
import { useSdk } from "~/lib/auth";
import { useResourceList, useResourceMutation } from "~/lib/resource";

/** @fonoster/types doesn't export the item type itself. */
export type ApiKey = ListApiKeysResponse["items"][number];

const RESOURCE = "apiKeys";

export function useApiKeys() {
  const sdk = useSdk();
  return useResourceList<ApiKey>(RESOURCE, (request) =>
    sdk.apiKeys.listApiKeys(request)
  );
}

export function useCreateApiKey() {
  const sdk = useSdk();
  return useResourceMutation<CreateApiKeyRequest, CreateApiKeyResponse>(
    RESOURCE,
    (request) => sdk.apiKeys.createApiKey(request)
  );
}

export function useRegenerateApiKey() {
  const sdk = useSdk();
  return useResourceMutation<string, CreateApiKeyResponse>(RESOURCE, (ref) =>
    sdk.apiKeys.regenerateApiKey(ref)
  );
}

export function useDeleteApiKey() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (ref: string) => sdk.apiKeys.deleteApiKey(ref),
    { success: "API key deleted" }
  );
}

/** Labels for the roles an API key or member can have. */
export const ROLE_LABELS: Record<string, string> = {
  WORKSPACE_OWNER: "Workspace owner",
  WORKSPACE_ADMIN: "Workspace admin",
  WORKSPACE_MEMBER: "Workspace member"
};
