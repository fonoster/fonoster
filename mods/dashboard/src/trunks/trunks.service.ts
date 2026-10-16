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
  Acl,
  CreateTrunkRequest,
  Credentials,
  Trunk,
  UpdateTrunkRequest
} from "@fonoster/types";
import { useQuery } from "@tanstack/react-query";
import { useSdk } from "~/lib/auth";
import { useResourceList, useResourceMutation } from "~/lib/resource";
import { useWorkspace } from "~/lib/workspace";
import { useAllOf } from "~/numbers/lookups";

const RESOURCE = "trunks";

export function useTrunks() {
  const sdk = useSdk();
  return useResourceList<Trunk>(RESOURCE, (request) =>
    sdk.trunks.listTrunks(request)
  );
}

/** Every trunk, for pickers. */
export function useAllTrunks() {
  const sdk = useSdk();
  return useAllOf<Trunk>(RESOURCE, (request) => sdk.trunks.listTrunks(request));
}

export function useTrunk(ref: string | undefined) {
  const sdk = useSdk();
  const workspace = useWorkspace();
  return useQuery({
    queryKey: [RESOURCE, workspace.ref, "get", ref],
    queryFn: () => sdk.trunks.getTrunk(ref!),
    enabled: Boolean(ref)
  });
}

export function useCreateTrunk() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (request: CreateTrunkRequest) => sdk.trunks.createTrunk(request),
    { success: "Trunk created" }
  );
}

export function useUpdateTrunk() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (request: UpdateTrunkRequest) => sdk.trunks.updateTrunk(request),
    { success: "Trunk saved" }
  );
}

export function useDeleteTrunk() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (ref: string) => sdk.trunks.deleteTrunk(ref),
    { success: "Trunk deleted" }
  );
}

export function useAclOptions() {
  const sdk = useSdk();
  return useAllOf<Acl>("acls", (request) => sdk.acls.listAcls(request));
}

export function useCredentialsOptions() {
  const sdk = useSdk();
  return useAllOf<Credentials>("credentials", (request) =>
    sdk.credentials.listCredentials(request)
  );
}
