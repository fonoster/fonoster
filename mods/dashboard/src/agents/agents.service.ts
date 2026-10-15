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
import type {
  Application,
  CreateApplicationRequest,
  INumber,
  UpdateApplicationRequest
} from "@fonoster/types";
import { useQuery } from "@tanstack/react-query";
import { useSdk } from "~/lib/auth";
import {
  PAGE_SIZE,
  useResourceList,
  useResourceMutation
} from "~/lib/resource";
import { useWorkspace } from "~/lib/workspace";

/** Shared with the Apps and Numbers screens; filtered to AUTOPILOT here. */
const RESOURCE = "applications";

export function isAgent(app: Pick<Application, "type">) {
  return String(app.type) === "AUTOPILOT";
}

/** The workspace's AI agents (AUTOPILOT applications), page by page. */
export function useAgents() {
  const sdk = useSdk();
  const list = useResourceList<Application>(RESOURCE, (request) =>
    sdk.applications.listApplications(request)
  );
  return { ...list, items: list.items.filter(isAgent) };
}

/** One agent; refreshed by any applications mutation. */
export function useAgent(ref: string) {
  const sdk = useSdk();
  const workspace = useWorkspace();
  return useQuery({
    queryKey: [RESOURCE, workspace.ref, "get", ref],
    queryFn: () => sdk.applications.getApplication(ref)
  });
}

export function useCreateAgent() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (request: CreateApplicationRequest) =>
      sdk.applications.createApplication(request),
    { success: "Agent created" }
  );
}

/** The API replaces speech and intelligence on update: send the whole agent. */
export function useUpdateAgent() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (request: UpdateApplicationRequest) =>
      sdk.applications.updateApplication(request),
    { success: "Agent saved" }
  );
}

export function useDeleteAgent() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (ref: string) => sdk.applications.deleteApplication(ref),
    { success: "Agent deleted" }
  );
}

/** Hard stop so a misbehaving page token can't loop forever. */
const MAX_PAGES = 20;

/** Every number in the workspace (same key as the Numbers lookups, shared cache). */
export function useAllNumbers() {
  const sdk = useSdk();
  const workspace = useWorkspace();
  return useQuery({
    queryKey: ["numbers", workspace.ref, "all"],
    queryFn: async () => {
      const items: INumber[] = [];
      let pageToken: string | undefined;
      for (let page = 0; page < MAX_PAGES; page++) {
        const response = await sdk.numbers.listNumbers({
          pageSize: PAGE_SIZE,
          pageToken
        });
        items.push(...(response.items ?? []));
        pageToken = response.nextPageToken || undefined;
        if (!pageToken) break;
      }
      return items;
    }
  });
}

export function numbersFor(numbers: INumber[] | undefined, appRef: string) {
  return (numbers ?? []).filter((n) => n.appRef === appRef);
}

export { formatNumber } from "~/lib/format";
