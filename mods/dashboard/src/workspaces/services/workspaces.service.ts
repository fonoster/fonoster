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
  type InviteUserToWorkspaceRequest,
  type Workspace as Resource,
  type CreateWorkspaceRequest as ResourceCreateRequest,
  type UpdateWorkspaceRequest as ResourceUpdateRequest
} from "@fonoster/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOptimisticCreateResource } from "~/core/hooks/use-optimistic-create-resource";
import { useOptimisticDeleteResource } from "~/core/hooks/use-optimistic-delete-resource";
import { useOptimisticUpdateResource } from "~/core/hooks/use-optimistic-update-resource";
import { useFonoster } from "~/core/sdk/hooks/use-fonoster";
import { COLLECTION_QUERY_KEY as USER_COLLECTION_QUERY_KEY } from "~/auth/services/auth.service";

/**
 * Constant query key used to cache and track the list of workspaces.
 * Should be used consistently to avoid query duplication and cache mismatch.
 */
export const COLLECTION_QUERY_KEY = ["collection:workspaces"];

/**
 * Constant query key prefix used to cache and track individual workspace resources.
 * Should be combined with a specific workspace reference (ID).
 */
export const RESOURCE_QUERY_KEY = ["resource:workspace"];

/**
 * Hook to fetch the list of workspaces using the Fonoster SDK.
 *
 * This hook uses React Query's `useQuery` to:
 * - Fetch the workspace list from the backend.
 * - Automatically manage loading and error states.
 * - Cache the data for performance and offline support.
 *
 * @param params - Optional parameters to filter or paginate the list of workspaces.
 * @returns A React Query object containing workspace data and query metadata.
 */
export const useWorkspaces = () => {
  const { sdk } = useFonoster();

  const { data, ...rest } = useQuery({
    queryKey: COLLECTION_QUERY_KEY,
    queryFn: async () => await sdk.workspaces.listWorkspaces(),
    staleTime: 1000 * 60 * 60 // 1 hour
  });

  return {
    data: data?.items || [],
    nextPageToken: data?.nextPageToken,
    ...rest
  };
};

/**
 * Hook to fetch a specific workspace by its reference using the Fonoster SDK.
 *
 * This uses React Query to:
 * - Fetch an individual workspace from the backend.
 * - Track loading, success, and error states.
 * - Cache the result for faster access on subsequent loads.
 *
 * The query is only enabled if a valid `ref` is provided.
 *
 * @param ref - The reference (unique ID) of the workspace to retrieve.
 * @returns A React Query result object containing the workspace and metadata.
 */
export const useWorkspace = (ref: string) => {
  const { sdk } = useFonoster();

  const { data = null, ...rest } = useQuery({
    queryKey: [...RESOURCE_QUERY_KEY, ref],
    queryFn: async () => sdk.workspaces.getWorkspace(ref),
    enabled: !!ref
  });

  return { data, ...rest };
};

/**
 * Hook to create a new workspace using the Fonoster SDK with optimistic UI updates.
 *
 * Internally uses a custom `useOptimisticCreateResource` hook which:
 * - Adds the new workspace to the cache optimistically (before server confirmation).
 * - Rolls back changes on error.
 * - Replaces temporary data with server-confirmed data on success.
 * - Invalidates the workspace list to refresh from the server.
 *
 * @returns A mutation object that can be used to trigger the creation.
 */
export const useCreateWorkspace = () => {
  const { sdk } = useFonoster();

  return useOptimisticCreateResource<Resource, ResourceCreateRequest>(
    (req) => sdk.workspaces.createWorkspace(req),
    COLLECTION_QUERY_KEY,
    RESOURCE_QUERY_KEY
  );
};

/**
 * Hook to update an existing workspace using the Fonoster SDK with optimistic UI support.
 *
 * Internally uses `useOptimisticUpdateResource`, which:
 * - Applies changes optimistically to the workspace in the cache.
 * - Handles rollback on error.
 * - Updates the cache with the confirmed data on success.
 * - Invalidates related queries to ensure consistency.
 *
 * @returns A mutation object for updating an workspace.
 */
export const useUpdateWorkspace = () => {
  const { sdk } = useFonoster();

  return useOptimisticUpdateResource<Resource, ResourceUpdateRequest>(
    (req) => sdk.workspaces.updateWorkspace(req),
    COLLECTION_QUERY_KEY,
    RESOURCE_QUERY_KEY
  );
};

/**
 * Hook to delete an workspace by reference using the Fonoster SDK with optimistic cache updates.
 *
 * Internally uses `useOptimisticDeleteResource`, which:
 * - Removes the workspace from the cache before server confirmation.
 * - Restores it if the deletion fails.
 * - Invalidates relevant queries on completion to re-sync data.
 *
 * @returns A mutation object for deleting an workspace.
 */
export const useDeleteWorkspace = () => {
  const { sdk } = useFonoster();

  return useOptimisticDeleteResource(
    (ref) => sdk.workspaces.deleteWorkspace(ref),
    COLLECTION_QUERY_KEY,
    RESOURCE_QUERY_KEY
  );
};

/**
 * Hook to invite a user to a workspace using the Fonoster SDK.
 *
 * This mutation allows sending an invitation request to a user for joining a specific workspace.
 * It uses React Query's `useMutation` to handle the API call and manage loading/error states.
 *
 * @returns A mutation object that can be used to trigger the invitation process.
 */
export const useInviteWorkspace = () => {
  const { sdk } = useFonoster();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: Omit<InviteUserToWorkspaceRequest, "password">) =>
      sdk.workspaces.inviteUserToWorkspace({ ...req, password: "" }),
    onSuccess: () => {
      // Invalidate the workspaces list to ensure the cache is fresh
      queryClient.invalidateQueries({ queryKey: USER_COLLECTION_QUERY_KEY });
    }
  });
};

export const useWorkspaceResendInvite = () => {
  const { sdk } = useFonoster();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userRef: string) =>
      sdk.workspaces.resendWorkspaceMembershipInvitation(userRef),
    onSuccess: () => {
      // Invalidate the workspaces list to ensure the cache is fresh
      queryClient.invalidateQueries({ queryKey: USER_COLLECTION_QUERY_KEY });
    }
  });
};

export const useWorkspaceRemoveMember = () => {
  const { sdk } = useFonoster();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userRef: string) =>
      sdk.workspaces.removeUserFromWorkspace(userRef),
    onSuccess: () => {
      // Invalidate the workspaces list to ensure the cache is fresh
      queryClient.invalidateQueries({ queryKey: USER_COLLECTION_QUERY_KEY });
    }
  });
};
