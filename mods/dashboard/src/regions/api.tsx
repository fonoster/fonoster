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
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo } from "react";
import { useSdk } from "~/lib/auth";
import { useMaybeWorkspace } from "~/lib/workspace";
import { createSdkRegionsApi } from "./sdk-api";
import {
  workspaceRegionId,
  type Region,
  type RegionDetail,
  type RegionsApi
} from "./types";

const RegionsApiContext = createContext<RegionsApi | undefined>(undefined);
/** Overrides the SDK adapter (tests and stories pass the in-memory mock). */
export const RegionsApiProvider = RegionsApiContext.Provider;

export function useRegionsApi(): RegionsApi {
  const provided = useContext(RegionsApiContext);
  const sdk = useSdk();
  return useMemo(() => provided ?? createSdkRegionsApi(sdk), [provided, sdk]);
}

export const REGIONS_KEY = ["regions"] as const;
export const regionKey = (ref: string) => ["region", ref] as const;

/** The user's regions: the public `default`, then their own. Polled while any is not up. */
export function useRegions(refetchMs = 30_000) {
  const api = useRegionsApi();
  return useQuery<Region[]>({
    queryKey: REGIONS_KEY,
    queryFn: () => api.listRegions(),
    refetchInterval: (q) =>
      q.state.data?.some((r) => r.status === "waiting")
        ? Math.min(refetchMs, 5_000)
        : q.state.data?.some((r) => r.kind === "private")
          ? refetchMs
          : false
  });
}

/** One region's detail, polled while it is private. */
export function useRegionDetail(ref: string | undefined, refetchMs = 30_000) {
  const api = useRegionsApi();
  return useQuery<RegionDetail>({
    queryKey: regionKey(ref ?? ""),
    queryFn: () => api.getRegion(ref!),
    enabled: !!ref,
    refetchInterval: (q) =>
      q.state.data?.kind === "public" ? false : refetchMs
  });
}

/** The current workspace's region (its id is fixed for life). */
export function useRegion(refetchMs = 30_000) {
  const workspace = useMaybeWorkspace();
  const regions = useRegions(refetchMs);
  const id = workspace ? workspaceRegionId(workspace) : undefined;
  const summary = regions.data?.find((r) => r.id === id);
  const detail = useRegionDetail(summary?.ref, refetchMs);
  return {
    ...detail,
    data: detail.data,
    isLoading: regions.isLoading || detail.isLoading,
    error: regions.error ?? detail.error,
    isPrivate: summary?.kind === "private"
  };
}
