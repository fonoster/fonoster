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
import type { Workspace } from "@fonoster/types";

export type RegionStatus =
  | "waiting"
  | "connected"
  | "degraded"
  | "offline"
  | "unsupported";

export type RegionSecret = {
  name: string;
  /** Apps or agents that need the key. */
  usedBy: string[];
  set: boolean;
};

export type SipTransport = "udp" | "tcp" | "tls" | "ws" | "wss";

export type RegionEndpoints = {
  sip: { host: string; port: number; transport: SipTransport }[];
  signalingAddresses: string[];
  mediaAddresses: string[];
  rtpPorts?: { min: number; max: number };
  updatedAt?: string;
};

/** A region in a list: the public `default` first, then the user's own. */
export type Region = {
  /** Hidden `rg_...` ref; every call after creation keys on it. */
  ref: string;
  /** What users type and workspaces store: `default`, `acme-dallas`. */
  id: string;
  displayName: string;
  kind: "public" | "private";
  status: RegionStatus;
};

export type RegionDetail = Region & {
  version?: string;
  /** ISO time of the last heartbeat. */
  lastSeenAt?: string;
  roomrNodes?: number;
  appbridges?: number;
  activeCalls?: number;
  /** Why config sync is paused (status `unsupported`). */
  unsupportedReason?: string;
  sipDomain?: string;
  /** Workspaces that picked this region. */
  workspaces: { ref: string; name: string }[];
  /** Provider keys the region's config needs, and whether the region has them. */
  secrets: RegionSecret[];
  /** Where carriers and softphones connect; absent until the region reports them. */
  endpoints?: RegionEndpoints;
  /** Cloud only: the monthly fee in USD cents. Absent for self-hosted. */
  monthlyFeeCents?: number;
  /** Minutes this month (private regions); shown with the fee, not billed. */
  minutesThisMonth?: number;
};

export type RegionToken = { token: string; expiresAt: string };

export type CreatedRegion = RegionToken & { ref: string; id: string };

/** What the dashboard needs from the control plane for regions. */
export type RegionsApi = {
  /** The public `default` first, then the user's private regions. */
  listRegions(): Promise<Region[]>;
  createRegion(input: {
    id: string;
    displayName: string;
    sipDomain: string;
  }): Promise<CreatedRegion>;
  getRegion(ref: string): Promise<RegionDetail>;
  updateRegion(ref: string, input: { displayName: string }): Promise<void>;
  /** Issues a new token; the old credentials are revoked when it enrolls. */
  reissueRegionToken(ref: string): Promise<RegionToken>;
  /** Revokes the credentials; the region goes back to `waiting`. */
  disconnectRegion(ref: string): Promise<void>;
  deleteRegion(ref: string): Promise<void>;
  /** `region` is a region id. */
  createWorkspace(input: { name: string; region: string }): Promise<{
    ref: string;
  }>;
};

export const DEFAULT_REGION_ID = "default";
export const DEFAULT_REGION: Region = {
  ref: "rg_default",
  id: DEFAULT_REGION_ID,
  displayName: "Default",
  kind: "public",
  status: "connected"
};

/** Workspaces carry the id of their region (fixed for life). */
export function workspaceRegionId(workspace: Workspace): string {
  return (
    (workspace as Workspace & { region?: string }).region ?? DEFAULT_REGION_ID
  );
}

/** A region that can take a new workspace. */
export const isUsable = (r: Region) =>
  r.status === "connected" || r.status === "degraded";
