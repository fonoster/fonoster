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
  type Credentials as Resource,
  type CreateCredentialsRequest as ResourceCreateRequest,
  type ListCredentialsRequest as ResourceListRequest,
  type UpdateCredentialsRequest as ResourceUpdateRequest
} from "@fonoster/types";
import { useQuery } from "@tanstack/react-query";
import { useOptimisticCreateResource } from "~/core/hooks/use-optimistic-create-resource";
import { useOptimisticDeleteResource } from "~/core/hooks/use-optimistic-delete-resource";
import { useOptimisticUpdateResource } from "~/core/hooks/use-optimistic-update-resource";
import { useFonoster } from "~/core/sdk/hooks/use-fonoster";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";

/**
 * Constant query key used to cache and track the list of credentials.
 * Should be used consistently to avoid query duplication and cache mismatch.
 */
export const COLLECTION_QUERY_KEY = ["collection:credentials"];

/**
 * Constant query key prefix used to cache and track individual credential resources.
 * Should be combined with a specific credential reference (ID).
 */
export const RESOURCE_QUERY_KEY = ["resource:credential"];

/**
 * Hook to fetch the list of credentials using the Fonoster SDK.
 *
 * This hook uses React Query's `useQuery` to:
 * - Fetch the credential list from the backend.
 * - Automatically manage loading and error states.
 * - Cache the data for performance and offline support.
 *
 * @param params - Optional parameters to filter or paginate the list of credentials.
 * @returns A React Query object containing credential data and query metadata.
 */
export const useCredentials = (params?: ResourceListRequest) => {
  const { sdk } = useFonoster();
  const workspaceId = useWorkspaceId();

  const { data, ...rest } = useQuery({
    queryKey: [...COLLECTION_QUERY_KEY, workspaceId, params],
    queryFn: async () => await sdk.credentials.listCredentials({ ...params })
  });

  return {
    data: data?.items || [],
    nextPageToken: data?.nextPageToken,
    ...rest
  };
};

/**
 * Hook to fetch a specific credential by its reference using the Fonoster SDK.
 *
 * This uses React Query to:
 * - Fetch an individual credential from the backend.
 * - Track loading, success, and error states.
 * - Cache the result for faster access on subsequent loads.
 *
 * The query is only enabled if a valid `ref` is provided.
 *
 * @param ref - The reference (unique ID) of the credential to retrieve.
 * @returns A React Query result object containing the credential and metadata.
 */
export const useCredential = (ref: string) => {
  const { sdk } = useFonoster();
  const workspaceId = useWorkspaceId();

  const { data = null, ...rest } = useQuery({
    queryKey: [...RESOURCE_QUERY_KEY, workspaceId, ref],
    queryFn: async () => sdk.credentials.getCredentials(ref),
    enabled: !!ref
  });

  return { data, ...rest };
};

/**
 * Hook to create a new credential using the Fonoster SDK with optimistic UI updates.
 *
 * Internally uses a custom `useOptimisticCreateResource` hook which:
 * - Adds the new credential to the cache optimistically (before server confirmation).
 * - Rolls back changes on error.
 * - Replaces temporary data with server-confirmed data on success.
 * - Invalidates the credential list to refresh from the server.
 *
 * @returns A mutation object that can be used to trigger the creation.
 */
export const useCreateCredential = () => {
  const { sdk } = useFonoster();
  const workspaceId = useWorkspaceId();

  const COLLECTION_KEY = [...COLLECTION_QUERY_KEY, workspaceId];
  const RESOURCE_KEY = [...RESOURCE_QUERY_KEY, workspaceId];

  return useOptimisticCreateResource<Resource, ResourceCreateRequest>(
    (req) => sdk.credentials.createCredentials(req),
    COLLECTION_KEY,
    RESOURCE_KEY
  );
};

/**
 * Hook to update an existing credential using the Fonoster SDK with optimistic UI support.
 *
 * Internally uses `useOptimisticUpdateResource`, which:
 * - Applies changes optimistically to the credential in the cache.
 * - Handles rollback on error.
 * - Updates the cache with the confirmed data on success.
 * - Invalidates related queries to ensure consistency.
 *
 * @returns A mutation object for updating an credential.
 */
export const useUpdateCredential = () => {
  const { sdk } = useFonoster();
  const workspaceId = useWorkspaceId();

  const COLLECTION_KEY = [...COLLECTION_QUERY_KEY, workspaceId];
  const RESOURCE_KEY = [...RESOURCE_QUERY_KEY, workspaceId];

  return useOptimisticUpdateResource<Resource, ResourceUpdateRequest>(
    (req) => sdk.credentials.updateCredentials(req),
    COLLECTION_KEY,
    RESOURCE_KEY
  );
};

/**
 * Hook to delete an credential by reference using the Fonoster SDK with optimistic cache updates.
 *
 * Internally uses `useOptimisticDeleteResource`, which:
 * - Removes the credential from the cache before server confirmation.
 * - Restores it if the deletion fails.
 * - Invalidates relevant queries on completion to re-sync data.
 *
 * @returns A mutation object for deleting an credential.
 */
export const useDeleteCredential = () => {
  const { sdk } = useFonoster();
  const workspaceId = useWorkspaceId();

  const COLLECTION_KEY = [...COLLECTION_QUERY_KEY, workspaceId];
  const RESOURCE_KEY = [...RESOURCE_QUERY_KEY, workspaceId];

  return useOptimisticDeleteResource(
    (ref) => sdk.credentials.deleteCredentials(ref),
    COLLECTION_KEY,
    RESOURCE_KEY
  );
};
