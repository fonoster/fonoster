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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
import { toast } from "~/components/ui/sonner";
import { useSdk } from "~/lib/auth";
import { createSdkSessionApi } from "./sdk-api";
import type { SessionApi } from "./types";

const SessionApiContext = createContext<SessionApi | undefined>(undefined);
/** Overrides the SDK adapter (tests and stories pass the in-memory mock). */
export const SessionApiProvider = SessionApiContext.Provider;

/** The provided adapter, or the SDK adapter for the current workspace. */
export function useSessionApi(): SessionApi {
  const provided = useContext(SessionApiContext);
  const sdk = useSdk();
  // A new adapter per workspace, so pages reload when the workspace changes.
  const { workspaceRef } = useParams();
  return useMemo(
    () => provided ?? createSdkSessionApi(sdk),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provided, sdk, workspaceRef]
  );
}

/** The message of an API error (gRPC-Web errors carry it in `message`). */
export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** The query key prefix of the current workspace's session data. */
function useSessionKey() {
  return ["session", useParams().workspaceRef];
}

/**
 * Loads session data through React Query, keyed by workspace; `reload()` fetches it again and
 * useSessionMutation refreshes it after every change.
 */
export function useSessionQuery<T>(
  key: unknown[],
  load: (api: SessionApi) => Promise<T | undefined>,
  enabled = true
) {
  const api = useSessionApi();
  const query = useQuery({
    queryKey: [...useSessionKey(), ...key],
    // React Query can't hold undefined; null stands for "not found".
    queryFn: async () => (await load(api)) ?? null,
    enabled
  });
  return {
    data: query.data ?? undefined,
    loading: query.isLoading,
    error: query.error ? errorMessage(query.error) : undefined,
    reload: () => void query.refetch()
  };
}

/**
 * A change to session data: refreshes the workspace's session queries and shows a toast on
 * success (and on failure when toastErrors is set; forms show their own errors).
 */
export function useSessionMutation<Input, Output>(
  change: (api: SessionApi, input: Input) => Promise<Output>,
  options: {
    success?: string | ((output: Output, input: Input) => string);
    toastErrors?: boolean;
  } = {}
) {
  const api = useSessionApi();
  const queryClient = useQueryClient();
  const key = useSessionKey();
  return useMutation({
    mutationFn: (input: Input) => change(api, input),
    onSuccess: async (output, input) => {
      await queryClient.invalidateQueries({ queryKey: key });
      const message =
        typeof options.success === "function"
          ? options.success(output, input)
          : options.success;
      if (message) toast.success(message);
    },
    onError: (error) => {
      if (options.toastErrors) toast.error(errorMessage(error));
    }
  });
}
