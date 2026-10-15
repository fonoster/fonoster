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

/** A region offered in the "New workspace" picker. */
export type PublicRegion = { id: string; name: string };

export type RegionSecret = {
  name: string;
  /** Apps or assistants that need the key. */
  usedBy: string[];
  /** Reported as set by the cell's last heartbeat. */
  set: boolean;
};

export type Region = {
  /** `us-east-1` for public regions, `rg_<base32>` for a private one. */
  ref: string;
  kind: "public" | "private";
  name: string;
  status: RegionStatus;
  version?: string;
  /** ISO time of the last heartbeat. */
  lastHeartbeatAt?: string;
  mediaNodes?: number;
  gateways?: number;
  activeCalls?: number;
  enrolledAt?: string;
  /** Why config sync is paused (status `unsupported`). */
  unsupportedReason?: string;
  /** The names the region's config needs, and whether the cell has them. */
  secrets: RegionSecret[];
  /** Where carriers and softphones connect; absent until a private region reports them. */
  endpoints?: RegionEndpoints;
};

export type SipTransport = "udp" | "tcp" | "tls" | "ws" | "wss";

export type RegionEndpoints = {
  sip: { host: string; port: number; transport: SipTransport }[];
  signalingAddresses: string[];
  mediaAddresses: string[];
  rtpPorts?: { min: number; max: number };
  updatedAt?: string;
};

export type RegionToken = { token: string; expiresAt: string };

export type CreatedWorkspace = {
  ref: string;
  /** Present when the workspace was created with a private region. */
  enrollment?: RegionToken;
};

/** What the dashboard needs from the control plane for regions (RU-B1). */
export type RegionsApi = {
  listRegions(): Promise<PublicRegion[]>;
  /** `region` is a public region id, or `"private"` for a new private region. */
  createWorkspace(input: {
    name: string;
    region: string;
  }): Promise<CreatedWorkspace>;
  /** The region of the current workspace. */
  getRegion(): Promise<Region>;
  /** Issues a new token; the old cell identity is revoked when it enrolls. */
  reissueRegionToken(): Promise<RegionToken>;
  /** Revokes the cell's credentials; the region goes back to `waiting`. */
  disconnectRegion(): Promise<void>;
};

export const DEFAULT_REGION: PublicRegion = {
  id: "us-east-1",
  name: "US East (N. Virginia)"
};
export const PRIVATE_REGION = "private";

/** Workspaces carry `region` (RU-B2); a private region id starts with `rg_`. */
export function workspaceRegion(workspace: Workspace): string {
  return (
    (workspace as Workspace & { region?: string }).region ?? DEFAULT_REGION.id
  );
}

export function isPrivateWorkspace(workspace: Workspace): boolean {
  return workspaceRegion(workspace).startsWith("rg_");
}
