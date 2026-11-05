/**
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
import type { CallDetailRecord, ListCallsRequest } from "@fonoster/types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSdk } from "~/lib/auth";
import { PAGE_SIZE } from "~/lib/resource";
import { useWorkspace } from "~/lib/workspace";
import { rangeStart } from "./format";

const RESOURCE = "calls";

export type CallFilters = {
  /** Days back from now, one of RANGES. */
  range: string;
  /** A CallStatus name, or "" for any. */
  status: string;
};

/**
 * The workspace's call records, newest first, page by page. The filters run on
 * the server, so each combination is its own list.
 */
export function useCalls(filters: CallFilters) {
  const sdk = useSdk();
  const workspace = useWorkspace();
  const query = useInfiniteQuery({
    queryKey: [RESOURCE, workspace.ref, "list", filters],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      sdk.calls.listCalls({
        after: rangeStart(filters.range),
        ...(filters.status && {
          status: filters.status as ListCallsRequest["status"]
        }),
        pageSize: PAGE_SIZE,
        pageToken: pageParam
      }),
    // The API returns a token after every non-empty page; a short page is the last.
    getNextPageParam: (last) =>
      last.items.length >= PAGE_SIZE
        ? last.nextPageToken || undefined
        : undefined
  });
  return {
    ...query,
    items: query.data?.pages.flatMap((page) => page.items) ?? []
  };
}

export function useCall(ref: string) {
  const sdk = useSdk();
  const workspace = useWorkspace();
  return useQuery<CallDetailRecord>({
    queryKey: [RESOURCE, workspace.ref, "get", ref],
    queryFn: () => sdk.calls.getCall(ref)
  });
}
