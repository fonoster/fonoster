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
  type User as Resource,
  type CreateUserRequest as ResourceCreateRequest,
  type UpdateUserRequest as ResourceUpdateRequest,
  type ListWorkspaceMembersRequest as ResourceListRequest,
  type SendResetPasswordCodeRequest,
  type ResetPasswordRequest
} from "@fonoster/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { useOptimisticCreateResource } from "~/core/hooks/use-optimistic-create-resource";
import { useOptimisticDeleteResource } from "~/core/hooks/use-optimistic-delete-resource";
import { useOptimisticUpdateResource } from "~/core/hooks/use-optimistic-update-resource";
import { useFonoster } from "~/core/sdk/hooks/use-fonoster";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";

/**
 * Constant query key used to cache and track the list of users.
 * Should be used consistently to avoid query duplication and cache mismatch.
 */
export const COLLECTION_QUERY_KEY = ["collection:users"];

/**
 * Constant query key prefix used to cache and track individual user resources.
 * Should be combined with a specific user reference (ID).
 */
export const RESOURCE_QUERY_KEY = ["resource:user"];

/**
 * Hook to fetch the list of users using the Fonoster SDK.
 *
 * This hook uses React Query's `useQuery` to:
 * - Fetch the user list from the backend.
 * - Automatically manage loading and error states.
 * - Cache the data for performance and offline support.
 *
 * @param params - Optional parameters to filter or paginate the list of users.
 * @returns A React Query object containing user data and query metadata.
 */
export const useUsers = (params?: ResourceListRequest) => {
  const { sdk } = useFonoster();
  const workspaceId = useWorkspaceId();

  const { data, ...rest } = useQuery({
    queryKey: [...COLLECTION_QUERY_KEY, workspaceId, params],
    queryFn: async () =>
      await sdk.workspaces.listWorkspaceMembers({ ...params })
  });

  return {
    data: data?.items || [],
    nextPageToken: data?.nextPageToken,
    ...rest
  };
};

/**
 * Hook to fetch a specific user by its reference using the Fonoster SDK.
 *
 * This uses React Query to:
 * - Fetch an individual user from the backend.
 * - Track loading, success, and error states.
 * - Cache the result for faster access on subsequent loads.
 *
 * The query is only enabled if a valid `ref` is provided.
 *
 * @param ref - The reference (unique ID) of the user to retrieve.
 * @returns A React Query result object containing the user and metadata.
 */
export const useUser = (ref: string) => {
  const { sdk } = useFonoster();

  const { data = null, ...rest } = useQuery({
    queryKey: [...RESOURCE_QUERY_KEY, ref],
    queryFn: async () => sdk.users.getUser(ref),
    enabled: !!ref
  });

  return { data, ...rest };
};

/**
 * Hook to create a new user using the Fonoster SDK with optimistic UI updates.
 *
 * Internally uses a custom `useOptimisticCreateResource` hook which:
 * - Adds the new user to the cache optimistically (before server confirmation).
 * - Rolls back changes on error.
 * - Replaces temporary data with server-confirmed data on success.
 * - Invalidates the user list to refresh from the server.
 *
 * @returns A mutation object that can be used to trigger the creation.
 */
export const useCreateUser = () => {
  const { sdk } = useFonoster();

  return useOptimisticCreateResource<
    Resource,
    Omit<ResourceCreateRequest, "avatar">
  >(
    (req) => sdk.users.createUser({ avatar: "", ...req }),
    COLLECTION_QUERY_KEY,
    RESOURCE_QUERY_KEY
  );
};

/**
 * Hook to update an existing user using the Fonoster SDK with optimistic UI support.
 *
 * Internally uses `useOptimisticUpdateResource`, which:
 * - Applies changes optimistically to the user in the cache.
 * - Handles rollback on error.
 * - Updates the cache with the confirmed data on success.
 * - Invalidates related queries to ensure consistency.
 *
 * @returns A mutation object for updating an user.
 */
export const useUpdateUser = () => {
  const { sdk } = useFonoster();

  return useOptimisticUpdateResource<Resource, ResourceUpdateRequest>(
    (req) => sdk.users.updateUser(req),
    COLLECTION_QUERY_KEY,
    RESOURCE_QUERY_KEY
  );
};

/**
 * Hook to delete an user by reference using the Fonoster SDK with optimistic cache updates.
 *
 * Internally uses `useOptimisticDeleteResource`, which:
 * - Removes the user from the cache before server confirmation.
 * - Restores it if the deletion fails.
 * - Invalidates relevant queries on completion to re-sync data.
 *
 * @returns A mutation object for deleting an user.
 */
export const useDeleteUser = () => {
  const { sdk } = useFonoster();

  return useOptimisticDeleteResource(
    (ref) => sdk.users.deleteUser(ref),
    COLLECTION_QUERY_KEY,
    RESOURCE_QUERY_KEY
  );
};

/**
 * Hook to send a password reset code to a user using the Fonoster SDK.
 *
 * This hook uses React Query's `useMutation` to:
 * - Send a reset password code request to the backend.
 * - Handle errors by displaying a toast notification.
 * @param request - The request object containing user details for password reset.
 * @returns A mutation object that can be used to trigger the password reset code request.
 */
export const useForgotPassword = () => {
  const { sdk } = useFonoster();

  return useMutation({
    mutationFn: (request: SendResetPasswordCodeRequest) =>
      sdk.users.sendResetPasswordCode(request),
    onError: () => {
      toast("Oops! Something went wrong while trying to reset your password.");
    }
  });
};

/**
 * Hook to reset a user's password using the Fonoster SDK.
 *
 * This hook uses React Query's `useMutation` to:
 * - Send a reset password request to the backend.
 * - Handle errors by displaying a toast notification.
 * @param request - The request object containing user details for resetting the password.
 * @returns A mutation object that can be used to trigger the password reset.
 */
export const useResetPassword = () => {
  const { sdk } = useFonoster();

  return useMutation({
    mutationFn: (request: ResetPasswordRequest) =>
      sdk.users.resetPassword(request),
    onError: () => {
      toast("Oops! Something went wrong while trying to reset your password.");
    }
  });
};

export const useCreateUserWithOauth2Code = () => {
  const { sdk } = useFonoster();

  return useMutation({
    mutationFn: async (code: string) =>
      sdk.users.createUserWithOauth2Code({ code })
  });
};

export const useLoginWithOauth2Code = () => {
  const { client } = useFonoster();

  return useMutation({
    mutationFn: async (code: string) => {
      await client.loginWithOauth2Code("GITHUB", code);

      return {
        accessToken: client.getAccessToken(),
        refreshToken: client.getRefreshToken(),
        idToken: client.getIdToken()
      };
    }
  });
};
