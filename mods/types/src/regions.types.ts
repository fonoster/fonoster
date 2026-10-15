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

type PublicRegion = { id: string; name: string; default: boolean };

type ListRegionsResponse = { items: PublicRegion[] };

type RegionSecret = { name: string; usedBy: string[]; set: boolean };

/** The workspace's region and, for a private one, its cell's status. */
type Region = {
  ref: string;
  kind: "public" | "private";
  name: string;
  status: RegionStatus;
  /** Same as status (alias). */
  state: RegionStatus;
  reason?: string;
  unsupportedReason?: string;
  requiredVersion?: string;
  version?: string;
  lastHeartbeatAt?: string;
  enrolledAt?: string;
  components?: { mediaNodes: number; gateways: number; autopilot: boolean };
  mediaNodes?: number;
  gateways?: number;
  activeCalls?: number;
  configVersion?: number;
  secretsNeeded?: string[];
  secretsSet?: string[];
  secrets: RegionSecret[];
};

type RegionEnrollmentToken = { enrollmentToken: string; expiresAt: string };

export {
  ListRegionsResponse,
  PublicRegion,
  Region,
  RegionEnrollmentToken,
  RegionSecret,
  RegionStatus
};
