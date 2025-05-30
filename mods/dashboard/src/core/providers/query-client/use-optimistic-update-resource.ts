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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateResourceInCache,
  updateSingleResourceInCache,
  type BaseApiObject
} from "./manage-resource-cache.helper";
import type { ListResponse } from "@fonoster/types";

/**
 * A custom React hook that provides optimistic update functionality for resources.
 *
 * This hook allows updating a resource in the UI immediately after a user action,
 * before waiting for the server response. If the server fails, the UI rolls back to the previous state.
 *
 * @template TData - The shape of the resource being updated (must extend BaseApiObject).
 * @template TVariables - The shape of the update request payload (must also extend BaseApiObject).
 *
 * @param updateFn - Async function that sends the update request to the server.
 * @param collectionKey - Query key used for the collection of resources in the cache.
 * @param resourceKey - Query key prefix for individual resource items in the cache.
 *
 * @returns A React Query mutation object with `mutate`, `status`, and callbacks configured for optimistic updates.
 */
export function useOptimisticUpdateResource<
  TData extends BaseApiObject,
  TVariables extends BaseApiObject
>(
  updateFn: (data: TVariables) => Promise<BaseApiObject>,
  collectionKey: unknown[],
  resourceKey: unknown[]
) {
  const queryClient = useQueryClient();

  return useMutation<
    TData, // The type of the mutation result.
    unknown, // The error type (not specified).
    TVariables, // The type of the variables passed to the mutation.
    {
      previousList: ListResponse<TData> | undefined; // Cached collection state for rollback.
      previousItem: TData | undefined; // Cached single item state for rollback.
    }
  >({
    /**
     * The main mutation function that sends an update request to the backend.
     * Merges the original request data with the server response and updates the timestamp.
     *
     * @param request - The data used to update the resource.
     * @returns The final merged and updated resource object.
     */
    mutationFn: async (request: TVariables): Promise<TData> => {
      const updated = await updateFn(request);

      return {
        ...request,
        ...updated,
        updatedAt: new Date()
      } as unknown as TData;
    },

    /**
     * Called immediately before the mutation function runs.
     * Saves current cache state and performs an optimistic update on both the list and item views.
     *
     * @param resource - The resource update payload.
     * @returns An object containing the previous cache states for rollback purposes.
     */
    onMutate: async (resource: TVariables) => {
      await queryClient.cancelQueries({ queryKey: collectionKey });

      const previousList =
        queryClient.getQueryData<ListResponse<TData>>(collectionKey);
      const previousItem = queryClient.getQueryData<TData>([
        ...resourceKey,
        resource.ref
      ]);

      updateResourceInCache(queryClient, collectionKey, resource);
      updateSingleResourceInCache(queryClient, resourceKey, resource);

      return { previousList, previousItem };
    },

    /**
     * Called if the mutation fails.
     * Restores the cache to its previous state using data saved during `onMutate`.
     *
     * @param _err - The error thrown by the mutation.
     * @param _vars - The variables passed to the mutation (not used here).
     * @param context - The rollback context returned from `onMutate`.
     */
    onError: (_err, _vars, context) => {
      if (context?.previousList) {
        queryClient.setQueryData<ListResponse<TData>>(
          collectionKey,
          context.previousList
        );
      }
      if (context?.previousItem) {
        queryClient.setQueryData<TData>(
          [...resourceKey, context.previousItem.ref],
          context.previousItem
        );
      }
    },

    /**
     * Called when the mutation succeeds.
     * Ensures the cache is updated with the confirmed resource from the server.
     *
     * @param resource - The updated resource returned by the server.
     */
    onSuccess: (resource) => {
      updateResourceInCache(queryClient, collectionKey, resource);
      updateSingleResourceInCache(queryClient, resourceKey, resource);
    },

    /**
     * Called after the mutation completes (regardless of success or failure).
     * Invalidates related queries to ensure fresh data from the server.
     *
     * @param _data - The data returned by the mutation.
     * @param _error - Any error that occurred during the mutation.
     * @param variables - The variables originally passed to the mutation.
     */
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: collectionKey });
      queryClient.invalidateQueries({
        queryKey: [...resourceKey, variables.ref]
      });
    }
  });
}
