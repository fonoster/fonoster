/*
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
import {
  type Acl as Resource,
  type CreateAclRequest as ResourceCreateRequest,
  type ListAclsRequest as ResourceListRequest,
  type UpdateAclRequest as ResourceUpdateRequest
} from "@fonoster/types";
import { useQuery } from "@tanstack/react-query";
import { useOptimisticCreateResource } from "~/core/hooks/use-optimistic-create-resource";
import { useOptimisticDeleteResource } from "~/core/hooks/use-optimistic-delete-resource";
import { useOptimisticUpdateResource } from "~/core/hooks/use-optimistic-update-resource";
import { useFonoster } from "~/core/sdk/hooks/use-fonoster";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";

/**
 * Constant query key used to cache and track the list of acls.
 * Should be used consistently to avoid query duplication and cache mismatch.
 */
export const COLLECTION_QUERY_KEY = ["collection:acls"];

/**
 * Constant query key prefix used to cache and track individual acl resources.
 * Should be combined with a specific acl reference (ID).
 */
export const RESOURCE_QUERY_KEY = ["resource:acl"];

/**
 * Hook to fetch the list of acls using the Fonoster SDK.
 *
 * This hook uses React Query's `useQuery` to:
 * - Fetch the acl list from the backend.
 * - Automatically manage loading and error states.
 * - Cache the data for performance and offline support.
 *
 * @param params - Optional parameters to filter or paginate the list of acls.
 * @returns A React Query object containing acl data and query metadata.
 */
export const useAcls = (params?: ResourceListRequest) => {
  const { sdk } = useFonoster();
  const workspaceId = useWorkspaceId();

  const { data, ...rest } = useQuery({
    queryKey: [...COLLECTION_QUERY_KEY, workspaceId, params],
    queryFn: async () => await sdk.acls.listAcls({ ...params })
  });

  return {
    data: data?.items || [],
    nextPageToken: data?.nextPageToken,
    ...rest
  };
};

/**
 * Hook to fetch a specific acl by its reference using the Fonoster SDK.
 *
 * This uses React Query to:
 * - Fetch an individual acl from the backend.
 * - Track loading, success, and error states.
 * - Cache the result for faster access on subsequent loads.
 *
 * The query is only enabled if a valid `ref` is provided.
 *
 * @param ref - The reference (unique ID) of the acl to retrieve.
 * @returns A React Query result object containing the acl and metadata.
 */
export const useAcl = (ref: string) => {
  const { sdk } = useFonoster();
  const workspaceId = useWorkspaceId();

  const { data = null, ...rest } = useQuery({
    queryKey: [...RESOURCE_QUERY_KEY, workspaceId, ref],
    queryFn: async () => sdk.acls.getAcl(ref),
    enabled: !!ref
  });

  return { data, ...rest };
};

/**
 * Hook to create a new acl using the Fonoster SDK with optimistic UI updates.
 *
 * Internally uses a custom `useOptimisticCreateResource` hook which:
 * - Adds the new acl to the cache optimistically (before server confirmation).
 * - Rolls back changes on error.
 * - Replaces temporary data with server-confirmed data on success.
 * - Invalidates the acl list to refresh from the server.
 *
 * @returns A mutation object that can be used to trigger the creation.
 */
export const useCreateAcl = () => {
  const { sdk } = useFonoster();
  const workspaceId = useWorkspaceId();

  const COLLECTION_KEY = [...COLLECTION_QUERY_KEY, workspaceId];
  const RESOURCE_KEY = [...RESOURCE_QUERY_KEY, workspaceId];

  return useOptimisticCreateResource<
    Resource,
    ResourceCreateRequest & { deny: string[] }
  >((req) => sdk.acls.createAcl(req), COLLECTION_KEY, RESOURCE_KEY);
};

/**
 * Hook to update an existing acl using the Fonoster SDK with optimistic UI support.
 *
 * Internally uses `useOptimisticUpdateResource`, which:
 * - Applies changes optimistically to the acl in the cache.
 * - Handles rollback on error.
 * - Updates the cache with the confirmed data on success.
 * - Invalidates related queries to ensure consistency.
 *
 * @returns A mutation object for updating an acl.
 */
export const useUpdateAcl = () => {
  const { sdk } = useFonoster();
  const workspaceId = useWorkspaceId();

  const COLLECTION_KEY = [...COLLECTION_QUERY_KEY, workspaceId];
  const RESOURCE_KEY = [...RESOURCE_QUERY_KEY, workspaceId];

  return useOptimisticUpdateResource<Resource, ResourceUpdateRequest>(
    (req) => sdk.acls.updateAcl(req),
    COLLECTION_KEY,
    RESOURCE_KEY
  );
};

/**
 * Hook to delete an acl by reference using the Fonoster SDK with optimistic cache updates.
 *
 * Internally uses `useOptimisticDeleteResource`, which:
 * - Removes the acl from the cache before server confirmation.
 * - Restores it if the deletion fails.
 * - Invalidates relevant queries on completion to re-sync data.
 *
 * @returns A mutation object for deleting an acl.
 */
export const useDeleteAcl = () => {
  const { sdk } = useFonoster();
  const workspaceId = useWorkspaceId();

  const COLLECTION_KEY = [...COLLECTION_QUERY_KEY, workspaceId];
  const RESOURCE_KEY = [...RESOURCE_QUERY_KEY, workspaceId];

  return useOptimisticDeleteResource(
    (ref) => sdk.acls.deleteAcl(ref),
    COLLECTION_KEY,
    RESOURCE_KEY
  );
};
