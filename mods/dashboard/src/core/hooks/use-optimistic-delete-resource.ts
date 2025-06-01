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
  deleteResourceFromCache,
  type BaseApiObject,
  type ListResponse
} from "../providers/query-client/manage-resource-cache.helper";
import { Logger } from "../shared/logger";

/**
 * A custom React hook that provides optimistic deletion of a resource using React Query.
 *
 * This hook improves perceived performance by immediately removing a resource from the UI
 * before the server confirms deletion. If the deletion fails, the original data is restored.
 *
 * @template TRef - The type of the resource reference (commonly a string ID). Defaults to string.
 *
 * @param deleteFn - An async function that performs the deletion of the resource on the backend.
 * @param collectionKey - The query key for the list/collection of resources.
 * @param resourceKey - The query key prefix for accessing individual resources.
 *
 * @returns A `useMutation` instance configured for optimistic deletion.
 */
export function useOptimisticDeleteResource<TRef extends string = string>(
  deleteFn: (ref: TRef) => Promise<BaseApiObject>,
  collectionKey: unknown[],
  resourceKey: unknown[]
) {
  const queryClient = useQueryClient();

  return useMutation<
    TRef, // Return type of the mutation function (ref of deleted item)
    unknown, // Error type (unknown here)
    TRef, // Variables passed to mutationFn (ref of item to delete)
    {
      previousList: ListResponse<BaseApiObject> | undefined; // Previous state of the collection cache
      previousItem: BaseApiObject | undefined; // Previous state of the individual item cache
    }
  >({
    /**
     * The function that actually performs the deletion request.
     *
     * @param ref - The identifier of the resource to delete.
     * @returns The same reference after deletion.
     */
    mutationFn: async (ref: TRef) => {
      await deleteFn(ref);
      return ref;
    },

    /**
     * Called before the mutation function runs.
     *
     * Performs an optimistic update by removing the item from the cache,
     * and stores the current cache state to allow rollback if needed.
     *
     * @param refToDelete - The identifier of the resource to delete.
     * @returns An object containing the previous list and item data for potential rollback.
     */
    onMutate: async (refToDelete: TRef) => {
      // Cancel ongoing queries for the collection to prevent cache races
      await queryClient.cancelQueries({ queryKey: collectionKey });

      Logger.debug(
        "[useOptimisticDeleteResource] Deleting optimistically for: ",
        refToDelete
      );

      // Store current cache state to support rollback
      const previousList =
        queryClient.getQueryData<ListResponse<BaseApiObject>>(collectionKey);
      const previousItem = queryClient.getQueryData<BaseApiObject>([
        ...resourceKey,
        refToDelete
      ]);

      // Optimistically remove the item from the collection cache
      deleteResourceFromCache(queryClient, collectionKey, refToDelete);

      return { previousList, previousItem };
    },

    /**
     * Called if the mutation fails.
     *
     * Restores the previous cache state using the context from `onMutate`.
     *
     * @param _err - The error (not used here).
     * @param ref - The identifier of the resource that failed to delete.
     * @param context - Contains the previous state of the cache.
     */
    onError: (_err, ref, context) => {
      Logger.error(
        "[useOptimisticDeleteResource] Error deleting resource: ",
        ref,
        _err
      );

      if (context?.previousList) {
        Logger.debug(
          "[useOptimisticDeleteResource] Restoring previous list state for: ",
          ref
        );
        queryClient.setQueryData(collectionKey, context.previousList);
      }

      if (context?.previousItem) {
        Logger.debug(
          "[useOptimisticDeleteResource] Restoring previous item state for: ",
          ref
        );
        queryClient.setQueryData([...resourceKey, ref], context.previousItem);
      }
    },

    /**
     * Called after the mutation either succeeds or fails.
     *
     * Ensures that the cache reflects the most recent server state by invalidating the queries.
     *
     * @param _ - The mutation result (not used).
     * @param _error - The error object (not used).
     * @param ref - The identifier of the affected resource.
     */
    onSettled: (_, _error, ref) => {
      Logger.debug("[useOptimisticDeleteResource] Mutation settled for: ", ref);
      queryClient.invalidateQueries({ queryKey: collectionKey });
      queryClient.invalidateQueries({ queryKey: [...resourceKey, ref] });
    }
  });
}
