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
import type { Agent, Application } from "@fonoster/types";
import { useQuery } from "@tanstack/react-query";
import { useSdk } from "~/lib/auth";
import { PAGE_SIZE } from "~/lib/resource";
import { useWorkspace } from "~/lib/workspace";

type Page<T> = { items: T[]; nextPageToken?: string };

/** Hard stop so a misbehaving page token can't loop forever. */
const MAX_PAGES = 20;

/**
 * Every item of a workspace's resource, for pickers and cross-references
 * (e.g. which app a number routes to). Shares the resource's key prefix, so
 * its mutations refresh this too.
 */
export function useAllOf<T>(
  resource: string,
  list: (request: { pageSize: number; pageToken?: string }) => Promise<Page<T>>
) {
  const workspace = useWorkspace();
  return useQuery({
    queryKey: [resource, workspace.ref, "all"],
    queryFn: async () => {
      const items: T[] = [];
      let pageToken: string | undefined;
      for (let page = 0; page < MAX_PAGES; page++) {
        const response = await list({ pageSize: PAGE_SIZE, pageToken });
        items.push(...(response.items ?? []));
        pageToken = response.nextPageToken || undefined;
        if (!pageToken) break;
      }
      return items;
    }
  });
}

/** AI agents and voice apps (SDK Applications). */
export function useApplicationOptions() {
  const sdk = useSdk();
  return useAllOf<Application>("applications", (request) =>
    sdk.applications.listApplications(request)
  );
}

/** SIP users (SDK Agents). */
export function useSipUserOptions() {
  const sdk = useSdk();
  return useAllOf<Agent>("agents", (request) => sdk.agents.listAgents(request));
}
