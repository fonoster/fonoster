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
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type QueryKey
} from "@tanstack/react-query";
import { toast } from "~/components/ui/sonner";
import { useWorkspace } from "./workspace";
import { errorMessage } from "./errors";

type Page<T> = { items: T[]; nextPageToken?: string };

export const PAGE_SIZE = 50;

/**
 * A workspace's list of some resource, page by page. The key is scoped to the
 * current workspace so switching never shows another workspace's rows.
 */
export function useResourceList<T>(
  resource: string,
  list: (request: { pageSize: number; pageToken?: string }) => Promise<Page<T>>
) {
  const workspace = useWorkspace();
  const query = useInfiniteQuery({
    queryKey: [resource, workspace.ref, "list"],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      list({ pageSize: PAGE_SIZE, pageToken: pageParam }),
    getNextPageParam: (last) => last.nextPageToken || undefined
  });
  return {
    ...query,
    items: query.data?.pages.flatMap((page) => page.items) ?? []
  };
}

/** The query key prefix of a workspace's resource, for invalidation. */
export function useResourceKey(resource: string): QueryKey {
  return [resource, useWorkspace().ref];
}

/**
 * A create/update/delete call that refreshes the resource's lists and shows a
 * toast on success (and on failure, unless the caller handles errors itself).
 */
export function useResourceMutation<Input, Output>(
  resource: string,
  mutationFn: (input: Input) => Promise<Output>,
  options: {
    success?: string | ((output: Output) => string);
    toastErrors?: boolean;
  } = {}
) {
  const queryClient = useQueryClient();
  const key = useResourceKey(resource);
  return useMutation({
    mutationFn,
    onSuccess: async (output) => {
      await queryClient.invalidateQueries({ queryKey: key });
      const message =
        typeof options.success === "function"
          ? options.success(output)
          : options.success;
      if (message) toast.success(message);
    },
    onError: (error) => {
      if (options.toastErrors) toast.error(errorMessage(error));
    }
  });
}
