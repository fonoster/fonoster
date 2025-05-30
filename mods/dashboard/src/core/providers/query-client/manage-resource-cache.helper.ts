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
import { QueryClient } from "@tanstack/react-query";

/**
 * Base interface for API objects that includes a `ref` property.
 */
export interface BaseApiObject {
  ref: string;
}

/**
 * Interface for paginated list requests.
 */
export interface ListResponse<T> {
  items: T[];
  nextPageToken?: string;
}

/**
 * Appends a new resource item to the cached array under the specified query key.
 *
 * @param queryClient - React Query client instance
 * @param key - The cache key (e.g., ["applications"])
 * @param item - The new resource item to append
 */
export function appendResourceToCache<T extends BaseApiObject>(
  queryClient: QueryClient,
  key: unknown[],
  item: T
) {
  queryClient.setQueryData<ListResponse<T>>(key, (old) => {
    if (!old?.items) return { items: [item] };

    return {
      ...old,
      items: [item, ...old.items]
    };
  });
}

/**
 * Updates a resource item in the cached array by matching its `ref` property.
 *
 * @param queryClient - React Query client instance
 * @param key - The cache key (e.g., ["applications"])
 * @param item - The updated resource item
 */
export function updateResourceInCache<T extends BaseApiObject>(
  queryClient: QueryClient,
  key: unknown[],
  item: T
) {
  queryClient.setQueryData<ListResponse<T>>(key, (old) => {
    if (!old?.items) return old;

    return {
      ...old,
      items: old.items.map((i) => (i.ref === item.ref ? { ...i, ...item } : i))
    };
  });
}

/**
 * Removes a resource item from the cached array by its `ref` value.
 *
 * @param queryClient - React Query client instance
 * @param key - The cache key (e.g., ["applications"])
 * @param ref - The `ref` of the resource item to delete
 */
export function deleteResourceFromCache<T extends BaseApiObject>(
  queryClient: QueryClient,
  key: unknown[],
  ref: string
) {
  queryClient.setQueryData<ListResponse<T>>(key, (old) => {
    if (!old?.items) return old;

    return {
      ...old,
      items: old.items.filter((i) => i.ref !== ref)
    };
  });
}

/**
 * Updates the cached single resource (e.g., `getApplication`) by query key and `ref`.
 *
 * @param queryClient - React Query client instance
 * @param key - Query key prefix (e.g., ["resource:application"])
 * @param item - The updated resource object (must include `ref`)
 */
export function updateSingleResourceInCache<T extends { ref: string }>(
  queryClient: QueryClient,
  key: unknown[],
  item: T
) {
  queryClient.setQueryData<T>([...key, item.ref], item);
}
