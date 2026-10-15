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
import type { FonosterSdk } from "~/lib/client";
import {
  DEFAULT_REGION,
  type Region,
  type RegionDetail,
  type RegionsApi,
  type RegionStatus
} from "./types";

/** The shape of `sdk.regions` this adapter codes against (add-private-regions). */
type SdkRegion = {
  ref: string;
  id: string;
  displayName: string;
  kind: "public" | "private";
  state?: RegionStatus;
  status?: RegionStatus;
  version?: string;
  lastSeenAt?: string;
  components?: { mediaNodes?: number; gateways?: number };
  activeCalls?: number;
  unsupportedReason?: string;
  sipDomain?: string;
  endpoints?: RegionDetail["endpoints"];
  workspaces?: { ref: string; name: string }[];
  secretsNeeded?: string[];
  secretsSet?: string[];
  monthlyFeeCents?: number;
};

type RegionsSdk = {
  createRegion(r: {
    id: string;
    displayName: string;
    sipDomain: string;
  }): Promise<{ ref: string; id: string; token: string; expiresAt: string }>;
  listRegions(): Promise<{ items?: SdkRegion[] } | SdkRegion[]>;
  getRegion(ref: string): Promise<SdkRegion>;
  updateRegion(ref: string, r: { displayName: string }): Promise<unknown>;
  reissueRegionToken(
    ref: string
  ): Promise<{ token: string; expiresAt: string }>;
  disconnectRegion(ref: string): Promise<unknown>;
  deleteRegion(ref: string): Promise<unknown>;
};

export function toRegion(r: SdkRegion): Region {
  return {
    ref: r.ref,
    id: r.id,
    displayName: r.displayName,
    kind: r.kind,
    status: r.state ?? r.status ?? "waiting"
  };
}

export function toRegionDetail(r: SdkRegion): RegionDetail {
  const set = new Set(r.secretsSet ?? []);
  return {
    ...toRegion(r),
    version: r.version,
    lastSeenAt: r.lastSeenAt,
    mediaNodes: r.components?.mediaNodes,
    gateways: r.components?.gateways,
    activeCalls: r.activeCalls,
    unsupportedReason: r.unsupportedReason,
    sipDomain: r.sipDomain,
    workspaces: r.workspaces ?? [],
    secrets: (r.secretsNeeded ?? []).map((name) => ({
      name,
      usedBy: [],
      set: set.has(name)
    })),
    endpoints: r.endpoints,
    monthlyFeeCents: r.monthlyFeeCents
  };
}

/** The RegionsApi over the SDK (`sdk.regions` and `sdk.workspaces`). */
export function createSdkRegionsApi(sdk: FonosterSdk): RegionsApi {
  const regions = () => (sdk as unknown as { regions: RegionsSdk }).regions;
  return {
    async listRegions() {
      try {
        const res = await regions().listRegions();
        const items = Array.isArray(res) ? res : res.items;
        return items?.length ? items.map(toRegion) : [DEFAULT_REGION];
      } catch {
        return [DEFAULT_REGION];
      }
    },
    async createRegion(input) {
      return regions().createRegion(input);
    },
    async getRegion(ref) {
      return toRegionDetail(await regions().getRegion(ref));
    },
    async updateRegion(ref, input) {
      await regions().updateRegion(ref, input);
    },
    async reissueRegionToken(ref) {
      const { token, expiresAt } = await regions().reissueRegionToken(ref);
      return { token, expiresAt };
    },
    async disconnectRegion(ref) {
      await regions().disconnectRegion(ref);
    },
    async deleteRegion(ref) {
      await regions().deleteRegion(ref);
    },
    async createWorkspace({ name, region }) {
      const res = await sdk.workspaces.createWorkspace({ name, region });
      return { ref: res.ref };
    }
  };
}
