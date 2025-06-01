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
import { type ListCallsRequest as ResourceListRequest } from "@fonoster/types";
import { useQuery } from "@tanstack/react-query";
import { useFonoster } from "~/core/sdk/hooks/use-fonoster";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";

/**
 * Constant query key used to cache and track the list of calls.
 * Should be used consistently to avoid query duplication and cache mismatch.
 */
export const COLLECTION_QUERY_KEY = ["collection:calls"];

/**
 * Hook to fetch the list of calls using the Fonoster SDK.
 *
 * This hook uses React Query's `useQuery` to:
 * - Fetch the call list from the backend.
 * - Automatically manage loading and error states.
 * - Cache the data for performance and offline support.
 *
 * @param params - Optional parameters to filter or paginate the list of calls.
 * @returns A React Query object containing call data and query metadata.
 */
export const useCalls = (params?: ResourceListRequest) => {
  const { sdk } = useFonoster();
  const workspaceId = useWorkspaceId();

  const { data, ...rest } = useQuery({
    queryKey: [...COLLECTION_QUERY_KEY, workspaceId, params],
    queryFn: async () => await sdk.calls.listCalls({ ...params })
  });

  return {
    data: data?.items || [],
    nextPageToken: data?.nextPageToken,
    ...rest
  };
};
