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
import type { Region as SdkRegion } from "@fonoster/types";
import type { FonosterSdk } from "~/lib/client";
import {
  DEFAULT_REGION,
  type Region,
  type RegionToken,
  type RegionsApi
} from "./types";

/** The SDK's region view, narrowed to what the dashboard shows. */
export function toRegion(r: SdkRegion): Region {
  return {
    ref: r.ref,
    kind: r.kind,
    name: r.name,
    status: r.status,
    version: r.version,
    lastHeartbeatAt: r.lastHeartbeatAt,
    mediaNodes: r.mediaNodes ?? r.components?.mediaNodes,
    gateways: r.gateways ?? r.components?.gateways,
    activeCalls: r.activeCalls,
    enrolledAt: r.enrolledAt,
    unsupportedReason: r.unsupportedReason,
    secrets: r.secrets ?? [],
    endpoints: r.endpoints
  };
}

/** The RegionsApi over the SDK (`SDK.Regions` and `SDK.Workspaces`, RG-B9). */
export function createSdkRegionsApi(sdk: FonosterSdk): RegionsApi {
  return {
    async listRegions() {
      try {
        const { items } = await sdk.regions.listRegions();
        return items?.length
          ? items.map(({ id, name }) => ({ id, name }))
          : [DEFAULT_REGION];
      } catch {
        return [DEFAULT_REGION];
      }
    },
    async createWorkspace({ name, region }) {
      const res = await sdk.workspaces.createWorkspace({ name, region });
      return {
        ref: res.ref,
        enrollment: res.enrollmentToken
          ? { token: res.enrollmentToken, expiresAt: res.expiresAt ?? "" }
          : undefined
      };
    },
    async getRegion() {
      return toRegion(await sdk.regions.getRegion());
    },
    async reissueRegionToken(): Promise<RegionToken> {
      const res = await sdk.regions.reissueRegionToken();
      return { token: res.enrollmentToken, expiresAt: res.expiresAt };
    },
    async disconnectRegion() {
      await sdk.regions.disconnectRegion();
    }
  };
}
