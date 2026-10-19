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
/** Regions (add-private-regions). */
type RegionStatus =
  | "waiting"
  | "connected"
  | "degraded"
  | "offline"
  | "unsupported";

type RegionKind = "public" | "private";

/** A region in a list (`GET /api/regions`): offered public regions and the caller's own. */
type RegionSummary = {
  /** Absent for a configured public region. */
  ref?: string;
  id: string;
  /** Same as displayName. */
  name: string;
  displayName: string;
  kind: RegionKind;
  default: boolean;
  status: RegionStatus;
  /** Same as status. */
  state: RegionStatus;
  sipDomain?: string;
  /** The caller's private regions: how many workspaces use it. */
  workspaces?: number;
  published?: boolean;
};

/** @deprecated use RegionSummary */
type PublicRegion = RegionSummary;

type ListRegionsResponse = { items: RegionSummary[] };

type RegionSecret = { name: string; usedBy: string[]; set: boolean };

type SipTransport = "udp" | "tcp" | "tls" | "ws" | "wss";

/** Where carriers and softphones reach a region (contract §3 `region.R.endpoints`, §3a). */
type RegionEndpoints = {
  sip: { host: string; port: number; transport: SipTransport }[];
  /** Public addresses carriers must allowlist for signaling. */
  signalingAddresses: string[];
  /** Public addresses media (RTP) comes from. */
  mediaAddresses: string[];
  rtpPorts?: { min: number; max: number };
  /** The region's SIP domain (PR-16): workspaces get subdomains of it. */
  sipDomain?: string;
  updatedAt?: string;
};

type RegionWorkspace = {
  ref: string;
  accessKeyId: string;
  name: string;
  /** The workspace's SIP domain in this region (`<label>.<sipDomain>`). */
  domain?: string;
};

/** A region and its status (contract §0 `Region`). */
type Region = {
  ref: string;
  id: string;
  kind: RegionKind;
  name: string;
  displayName: string;
  default?: boolean;
  sipDomain?: string;
  ownerRef?: string;
  published?: boolean;
  status: RegionStatus;
  /** Same as status (alias). */
  state: RegionStatus;
  reason?: string;
  unsupportedReason?: string;
  requiredVersion?: string;
  version?: string;
  lastHeartbeatAt?: string;
  /** Same as lastHeartbeatAt. */
  lastSeenAt?: string;
  enrolledAt?: string;
  components?: { roomrNodes: number; appbridges: number; autopilot: boolean };
  roomrNodes?: number;
  appbridges?: number;
  activeCalls?: number;
  configVersion?: number;
  /** Owner views: the workspaces the region serves. */
  workspaces?: RegionWorkspace[];
  /** `getRegion()` of the current workspace: its SIP domain in the region. */
  workspaceDomain?: string;
  secretsNeeded?: string[];
  secretsSet?: string[];
  secrets: RegionSecret[];
  /** Connection details; absent until a region's cell reports them. */
  endpoints?: RegionEndpoints;
  /** Private regions on the cloud: the flat monthly fee (PR-11); null when billing is off. */
  monthlyFeeCents?: number | null;
  /** Private regions: minutes reported this calendar month (UTC); shown, not billed. */
  minutesThisMonth?: number;
};

type CreateRegionRequest = {
  /** 3-32 lowercase letters, digits, hyphens; starts with a letter; never changes (PR-18). */
  id: string;
  displayName: string;
  /** Your SIP domain (PR-16), e.g. sip.acme.com; point *.sip.acme.com at the region. */
  sipDomain: string;
};

/** A one-time enrollment token (shown once); `enrollmentToken` is the same value. */
type RegionEnrollmentToken = {
  token: string;
  enrollmentToken: string;
  expiresAt: string;
};

type CreateRegionResponse = RegionEnrollmentToken & { ref: string; id: string };

export {
  CreateRegionRequest,
  CreateRegionResponse,
  ListRegionsResponse,
  RegionKind,
  RegionSummary,
  RegionWorkspace,
  PublicRegion,
  Region,
  RegionEndpoints,
  RegionEnrollmentToken,
  RegionSecret,
  RegionStatus,
  SipTransport
};
