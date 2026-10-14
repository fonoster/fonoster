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
import { useEffect } from "react";
import { useSdk } from "~/lib/auth";
import {
  PAGE_SIZE,
  useResourceList,
  useResourceMutation
} from "~/lib/resource";
import { useWorkspace } from "~/lib/workspace";

/** Shared with the Agents and Numbers screens; filtered to EXTERNAL here. */
const RESOURCE = "applications";

export const EXTERNAL = "EXTERNAL" as CreateApplicationRequest["type"];

export function isVoiceApp(app: Pick<Application, "type">) {
  return String(app.type) === "EXTERNAL";
}

/** The workspace's voice apps (EXTERNAL applications), page by page. */
export function useVoiceApps() {
  const sdk = useSdk();
  const list = useResourceList<Application>(RESOURCE, (request) =>
    sdk.applications.listApplications(request)
  );
  const items = list.items.filter(isVoiceApp);
  const { hasNextPage, isFetching, fetchNextPage } = list;
  // A page of only AI agents shows nothing here; keep loading until it does.
  useEffect(() => {
    if (items.length === 0 && hasNextPage && !isFetching) void fetchNextPage();
  }, [items.length, hasNextPage, isFetching, fetchNextPage]);
  return { ...list, items };
}

/** One voice app; also refreshed by any applications mutation. */
export function useVoiceApp(ref: string) {
  const sdk = useSdk();
  const workspace = useWorkspace();
  return useQuery({
    queryKey: [RESOURCE, workspace.ref, "get", ref],
    queryFn: () => sdk.applications.getApplication(ref)
  });
}

export function useCreateVoiceApp() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (request: CreateApplicationRequest) =>
      sdk.applications.createApplication(request),
    { success: "Voice app created" }
  );
}

/**
 * The API replaces the app's speech settings on every update, so callers send
 * the whole app (name, type, endpoint and any textToSpeech / speechToText).
 */
export function useUpdateVoiceApp() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (request: UpdateApplicationRequest) =>
      sdk.applications.updateApplication(request),
    { success: "Voice app saved" }
  );
}

export function useDeleteVoiceApp() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (ref: string) => sdk.applications.deleteApplication(ref),
    { success: "Voice app deleted" }
  );
}

/** Hard stop so a misbehaving page token can't loop forever. */
const MAX_PAGES = 20;

/**
 * Every number in the workspace, to show which ones route to each app.
 * Same key and shape as the Numbers screen's lookup, so they share the cache.
 */
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
