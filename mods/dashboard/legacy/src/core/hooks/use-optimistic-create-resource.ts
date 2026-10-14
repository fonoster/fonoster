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
  appendResourceToCache,
  deleteResourceFromCache,
  updateResourceInCache,
  updateSingleResourceInCache,
  type BaseApiObject
} from "../providers/query-client/manage-resource-cache.helper";
import { Logger } from "../shared/logger";

/**
 * A custom React hook that provides an optimistic mutation handler for creating new resources.
 *
 * This hook leverages React Query's `useMutation` to handle API calls, and manages cache updates
 * to provide a responsive user experience by showing the new resource immediately in the UI,
 * before the server confirms the creation.
 *
 * It includes functionality for:
 * - Optimistically adding a new resource to the cache.
 * - Rolling back optimistic updates on error.
 * - Replacing temporary resource entries with real server responses on success.
 * - Invalidating queries to keep cache data fresh.
 *
 * @template TData - The expected type of the resource being created (must extend BaseApiObject).
 * @template TVariables - The shape of the data passed to the creation function.
 *
 * @param createFn - An async function that performs the actual API request to create the resource.
 * @param collectionKey - The query key for the list (or collection) of resources.
 * @param resourceKey - The query key for the individual resource.
 *
 * @returns A `useMutation` object from React Query, with optimistic update behavior configured.
 */
export function useOptimisticCreateResource<
  TData extends BaseApiObject,
  TVariables extends Record<string, any>
>(
  createFn: (data: TVariables) => Promise<BaseApiObject>,
  collectionKey: unknown[],
  resourceKey: unknown[]
) {
  const queryClient = useQueryClient();

  return useMutation<TData, unknown, TVariables, { tempId: string }>({
    /**
     * The main mutation function that sends a request to the backend to create a new resource.
     * It also injects timestamps and merges request data into the response to maintain consistency.
     *
     * @param request - The variables/data required to create the resource.
     * @returns The created resource, enhanced with request data and timestamps.
     */
    mutationFn: async (request: TVariables): Promise<TData> => {
      const created = await createFn(request);
      const now = new Date();

      return {
        ...created,
        ...request,
        createdAt: now,
        updatedAt: now
      } as unknown as TData;
    },

    /**
     * Called immediately before the mutation function is executed.
     * This is where we apply an optimistic update by adding a temporary version of the resource to the cache.
     *
     * @param newResource - The resource data provided by the user.
     * @returns A context object containing a temporary ID to track this optimistic update.
     */
    onMutate: async (newResource: TVariables) => {
      // Cancel any outgoing fetches for the resource collection to avoid overwriting optimistic changes
      await queryClient.cancelQueries({ queryKey: collectionKey });

      Logger.debug(
        "[useOptimisticCreateResource]: Adding optimistic resource to cache for collection:",
        collectionKey
      );

      const tempId = `ref_temp_${Date.now()}`;
      const optimistic = {
        ...newResource,
        ref: tempId,
        createdAt: new Date(),
        updatedAt: new Date()
      } as unknown as TData;

      // Add the temporary resource to the collection in cache
      appendResourceToCache(queryClient, collectionKey, optimistic);

      return { tempId };
    },

    /**
     * Called if the mutation fails (e.g., API request errors out).
     * Here we invalidate the collection query to refetch the data and revert any optimistic changes.
     */
    onError: () => {
      Logger.debug(
        "[useOptimisticCreateResource]: Mutation failed, invalidating collection cache"
      );
      queryClient.invalidateQueries({ queryKey: collectionKey });
    },

    /**
     * Called when the mutation is successful.
     * This replaces the temporary resource (if any) with the actual resource returned by the server.
     * It also updates both the collection and the individual resource in cache.
     *
     * @param resource - The real resource returned by the server.
     * @param _vars - The original mutation variables (not used here).
     * @param context - The context object returned from `onMutate`, used to identify and remove the temporary resource.
     */
    onSuccess: (resource, _vars, context) => {
      if (context?.tempId) {
        Logger.debug(
          "[useOptimisticCreateResource]: Mutation succeeded, removing temporary resource from cache"
        );
        deleteResourceFromCache(queryClient, collectionKey, context.tempId);
      }

      Logger.debug(
        "[useOptimisticCreateResource]: Updating cache with new resource",
        resource
      );
      updateResourceInCache(queryClient, collectionKey, resource);
      updateSingleResourceInCache(queryClient, resourceKey, resource);
    },

    /**
     * Called after either success or error.
     * Used to revalidate the collection to ensure data is fresh and consistent with the backend.
     */
    onSettled: () => {
      Logger.debug(
        "[useOptimisticCreateResource]: Mutation settled, invalidating collection cache"
      );
      queryClient.invalidateQueries({ queryKey: collectionKey });
    }
  });
}
