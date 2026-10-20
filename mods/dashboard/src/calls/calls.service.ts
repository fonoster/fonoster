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
import { toDate } from "~/lib/format";
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

const RECENT_LIMIT = 100;

/**
 * Recent calls to or from some of the workspace's numbers, newest first. Call
 * records don't say which app answered, so an app's calls are the calls on the
 * numbers routed to it now. The range and status filters run on the server.
 */
export function useCallsForNumbers(
  telUrls: string[],
  filters: CallFilters = { range: "30", status: "" }
) {
  const sdk = useSdk();
  const workspace = useWorkspace();
  const numbers = telUrls.map((telUrl) => telUrl.replace(/^tel:/, "")).sort();
  return useQuery({
    queryKey: [RESOURCE, workspace.ref, "numbers", numbers, filters],
    enabled: numbers.length > 0,
    queryFn: async () => {
      const after = rangeStart(filters.range);
      const pages = await Promise.all(
        numbers.flatMap((number) =>
          (["to", "from"] as const).map((side) =>
            sdk.calls.listCalls({
              after,
              [side]: number,
              ...(filters.status && {
                status: filters.status as ListCallsRequest["status"]
              }),
              pageSize: RECENT_LIMIT
            })
          )
        )
      );
      const byRef = new Map<string, CallDetailRecord>();
      for (const call of pages.flatMap((page) => page.items))
        byRef.set(call.ref, call);
      return [...byRef.values()]
        .sort(
          (a, b) =>
            (toDate(b.startedAt)?.getTime() ?? 0) -
            (toDate(a.startedAt)?.getTime() ?? 0)
        )
        .slice(0, RECENT_LIMIT);
    }
  });
}
