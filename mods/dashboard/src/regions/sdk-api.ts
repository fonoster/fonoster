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
  Region as SdkRegion,
  RegionSummary as SdkRegionSummary
} from "@fonoster/types";
import type { FonosterSdk } from "~/lib/client";
import {
  DEFAULT_REGION,
  type Region,
  type RegionDetail,
  type RegionsApi
} from "./types";

export function toRegion(r: SdkRegionSummary | SdkRegion): Region {
  return {
    ref: r.ref ?? `rg_${r.id}`,
    id: r.id,
    displayName: r.displayName,
    kind: r.kind,
    status: r.state ?? r.status
  };
}

export function toRegionDetail(r: SdkRegion): RegionDetail {
  const set = new Set(r.secretsSet ?? []);
  const secrets = r.secrets?.length
    ? r.secrets
    : (r.secretsNeeded ?? []).map((name) => ({
        name,
        usedBy: [],
        set: set.has(name)
      }));
  return {
    ...toRegion(r),
    version: r.version,
    lastSeenAt: r.lastSeenAt ?? r.lastHeartbeatAt,
    mediaNodes: r.components?.mediaNodes ?? r.mediaNodes,
    gateways: r.components?.gateways ?? r.gateways,
    activeCalls: r.activeCalls,
    unsupportedReason: r.unsupportedReason,
    sipDomain: r.sipDomain,
    workspaces: (r.workspaces ?? []).map(({ ref, name }) => ({ ref, name })),
    secrets,
    endpoints: r.endpoints,
    monthlyFeeCents: r.monthlyFeeCents ?? undefined,
    minutesThisMonth: r.minutesThisMonth
  };
}

/** The RegionsApi over the SDK (`sdk.regions` and `sdk.workspaces`). */
export function createSdkRegionsApi(sdk: FonosterSdk): RegionsApi {
  return {
    async listRegions() {
      try {
        const { items } = await sdk.regions.listRegions();
        return items?.length ? items.map(toRegion) : [DEFAULT_REGION];
      } catch {
        return [DEFAULT_REGION];
      }
    },
    async createRegion(input) {
      const { ref, id, token, expiresAt } =
        await sdk.regions.createRegion(input);
      return { ref, id, token, expiresAt };
    },
    async getRegion(ref) {
      return toRegionDetail(await sdk.regions.getRegion(ref));
    },
    async updateRegion(ref, input) {
      await sdk.regions.updateRegion(ref, input);
    },
    async reissueRegionToken(ref) {
      const { token, expiresAt } = await sdk.regions.reissueRegionToken(ref);
      return { token, expiresAt };
    },
    async disconnectRegion(ref) {
      await sdk.regions.disconnectRegion(ref);
    },
    async deleteRegion(ref) {
      await sdk.regions.deleteRegion(ref);
    },
    async createWorkspace({ name, region }) {
      const res = await sdk.workspaces.createWorkspace({ name, region });
      return { ref: res.ref };
    }
  };
}
