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
import { useParams } from "react-router-dom";
import { useSdk } from "~/lib/auth";
import { useMaybeWorkspace } from "~/lib/workspace";
import { createSdkRegionsApi } from "./sdk-api";
import { isPrivateWorkspace, type Region, type RegionsApi } from "./types";

const RegionsApiContext = createContext<RegionsApi | undefined>(undefined);
/** Overrides the SDK adapter (tests and stories pass the in-memory mock). */
export const RegionsApiProvider = RegionsApiContext.Provider;

export function useRegionsApi(): RegionsApi {
  const provided = useContext(RegionsApiContext);
  const sdk = useSdk();
  const { workspaceRef } = useParams();
  return useMemo(
    () => provided ?? createSdkRegionsApi(sdk),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provided, sdk, workspaceRef]
  );
}

export const regionKey = (workspaceRef: string) =>
  ["region", workspaceRef] as const;

/**
 * The current workspace's region, polled. Only private workspaces load it;
 * public ones have nothing to show beyond their region name.
 */
export function useRegion(refetchMs = 30_000) {
  const api = useRegionsApi();
  const workspace = useMaybeWorkspace();
  const priv = workspace ? isPrivateWorkspace(workspace) : false;
  const query = useQuery<Region>({
    queryKey: regionKey(workspace?.ref ?? ""),
    queryFn: () => api.getRegion(),
    enabled: priv,
    refetchInterval: refetchMs
  });
  return { ...query, isPrivate: priv };
}
