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
import type {
  Application as Resource,
  CreateApplicationRequest as ResourceCreateRequest,
  ListApplicationsRequest as ResourceListRequest,
  UpdateApplicationRequest as ResourceUpdateRequest
} from "@fonoster/types";
import { useQuery } from "@tanstack/react-query";
import { useOptimisticCreateResource } from "~/core/providers/query-client/use-optimistic-create-resource";
import { useOptimisticDeleteResource } from "~/core/providers/query-client/use-optimistic-delete-resource";
import { useOptimisticUpdateResource } from "~/core/providers/query-client/use-optimistic-update-resource";
import { useFonoster } from "~/core/sdk/hooks/use-fonoster";

/**
 * Constant query key used to cache and track the list of applications.
 * Should be used consistently to avoid query duplication and cache mismatch.
 */
export const COLLECTION_QUERY_KEY = ["collection:applications"];

/**
 * Constant query key prefix used to cache and track individual application resources.
 * Should be combined with a specific application reference (ID).
 */
export const RESOURCE_QUERY_KEY = ["resource:application"];

/**
 * Hook to fetch the list of applications using the Fonoster SDK.
 *
 * This hook uses React Query's `useQuery` to:
 * - Fetch the application list from the backend.
 * - Automatically manage loading and error states.
 * - Cache the data for performance and offline support.
 *
 * @param params - Optional parameters to filter or paginate the list of applications.
 * @returns A React Query object containing application data and query metadata.
 */
export const useApplications = (params?: ResourceListRequest) => {
  const { sdk } = useFonoster();

  return useQuery({
    queryKey: [...COLLECTION_QUERY_KEY, params],
    queryFn: async () => sdk.applications.listApplications({ ...params })
  });
};

/**
 * Hook to fetch a specific application by its reference using the Fonoster SDK.
 *
 * This uses React Query to:
 * - Fetch an individual application from the backend.
 * - Track loading, success, and error states.
 * - Cache the result for faster access on subsequent loads.
 *
 * The query is only enabled if a valid `ref` is provided.
 *
 * @param ref - The reference (unique ID) of the application to retrieve.
 * @returns A React Query result object containing the application and metadata.
 */
export const useApplication = (ref: string) => {
  const { sdk } = useFonoster();

  return useQuery({
    queryKey: [...RESOURCE_QUERY_KEY, ref],
    queryFn: async () => sdk.applications.getApplication(ref),
    enabled: !!ref
  });
};

/**
 * Hook to create a new application using the Fonoster SDK with optimistic UI updates.
 *
 * Internally uses a custom `useOptimisticCreateResource` hook which:
 * - Adds the new application to the cache optimistically (before server confirmation).
 * - Rolls back changes on error.
 * - Replaces temporary data with server-confirmed data on success.
 * - Invalidates the application list to refresh from the server.
 *
 * @returns A mutation object that can be used to trigger the creation.
 */
export const useCreateApplication = () => {
  const { sdk } = useFonoster();

  return useOptimisticCreateResource<Resource, ResourceCreateRequest>(
    (req) => sdk.applications.createApplication(req),
    COLLECTION_QUERY_KEY,
    RESOURCE_QUERY_KEY
  );
};

/**
 * Hook to update an existing application using the Fonoster SDK with optimistic UI support.
 *
 * Internally uses `useOptimisticUpdateResource`, which:
 * - Applies changes optimistically to the application in the cache.
 * - Handles rollback on error.
 * - Updates the cache with the confirmed data on success.
 * - Invalidates related queries to ensure consistency.
 *
 * @returns A mutation object for updating an application.
 */
export const useUpdateApplication = () => {
  const { sdk } = useFonoster();

  return useOptimisticUpdateResource<Resource, ResourceUpdateRequest>(
    (req) => sdk.applications.updateApplication(req),
    COLLECTION_QUERY_KEY,
    RESOURCE_QUERY_KEY
  );
};

/**
 * Hook to delete an application by reference using the Fonoster SDK with optimistic cache updates.
 *
 * Internally uses `useOptimisticDeleteResource`, which:
 * - Removes the application from the cache before server confirmation.
 * - Restores it if the deletion fails.
 * - Invalidates relevant queries on completion to re-sync data.
 *
 * @returns A mutation object for deleting an application.
 */
export const useDeleteApplication = () => {
  const { sdk } = useFonoster();

  return useOptimisticDeleteResource(
    (ref) => sdk.applications.deleteApplication(ref),
    COLLECTION_QUERY_KEY,
    RESOURCE_QUERY_KEY
  );
};
